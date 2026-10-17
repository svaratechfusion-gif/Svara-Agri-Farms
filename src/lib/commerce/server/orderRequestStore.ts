import { createHash, randomUUID } from "node:crypto";
import { link, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import type { OrderRequest } from "../orderRequest";

/**
 * Where order requests are kept. Server-only — never import from client code.
 *
 * Two implementations exist, chosen in `configuredStore.ts`:
 *   - JSON files on the server's own disk (below), for a long-running
 *     `next start` server (a VM or your own machine). NOT for serverless hosts
 *     (e.g. Vercel), whose disks are temporary. Each file holds the customer's
 *     delivery details: keep the directory private and backed up.
 *   - PostgreSQL (`src/server/dal/orderRequests.ts`), for any host.
 */
export interface OrderRequestStore {
  /** Saves a new request. Throws `DuplicateSubmission` if the key was already used. */
  save(order: OrderRequest, idempotencyKey: string): Promise<void>;
  /** The request already saved under this submission key, if any. */
  findByIdempotencyKey(idempotencyKey: string): Promise<OrderRequest | null>;
}

export class DuplicateSubmission extends Error {
  constructor(readonly reference: string) {
    super(`Submission already saved as ${reference}`);
  }
}

export class ReferenceTaken extends Error {}

export const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");

function isAlreadyThere(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === "EEXIST";
}

/** Writes `contents` to `target` only if nothing is there, never leaving a half-written file. */
async function writeNew(target: string, contents: string): Promise<void> {
  const temporary = `${target}.${randomUUID()}.tmp`;
  await writeFile(temporary, contents, { mode: 0o600, flag: "wx" });
  try {
    await link(temporary, target); // fails with EEXIST rather than overwrite
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}

export function createFileOrderRequestStore(directory: string): OrderRequestStore {
  const requests = path.join(directory, "requests");
  const keys = path.join(directory, "submission-keys");
  const ready = Promise.all([
    mkdir(requests, { recursive: true, mode: 0o700 }),
    mkdir(keys, { recursive: true, mode: 0o700 }),
  ]);

  const readRequest = async (reference: string): Promise<OrderRequest> =>
    JSON.parse(await readFile(path.join(requests, `${reference}.json`), "utf8")) as OrderRequest;

  return {
    async save(order, idempotencyKey) {
      await ready;
      const requestFile = path.join(requests, `${order.reference}.json`);
      try {
        await writeNew(requestFile, `${JSON.stringify(order, null, 2)}\n`);
      } catch (error) {
        if (isAlreadyThere(error)) throw new ReferenceTaken(order.reference);
        throw error;
      }
      try {
        await writeNew(
          path.join(keys, `${hashKey(idempotencyKey)}.json`),
          JSON.stringify({ reference: order.reference }),
        );
      } catch (error) {
        // The same submission arrived twice at once: keep the first, drop ours.
        await unlink(requestFile).catch(() => undefined);
        if (!isAlreadyThere(error)) throw error;
        const existing = await this.findByIdempotencyKey(idempotencyKey);
        throw new DuplicateSubmission(existing?.reference ?? "");
      }
    },
    async findByIdempotencyKey(idempotencyKey) {
      await ready;
      try {
        const { reference } = JSON.parse(
          await readFile(path.join(keys, `${hashKey(idempotencyKey)}.json`), "utf8"),
        ) as { reference: string };
        return await readRequest(reference);
      } catch {
        return null;
      }
    },
  };
}
