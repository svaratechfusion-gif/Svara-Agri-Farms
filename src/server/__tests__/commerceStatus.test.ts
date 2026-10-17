import { describe, expect, it } from "vitest";

import { describeCommerceSetup } from "@/lib/commerce/server/configuredStore";
import { commerceStatus } from "@/server/commerceStatus";

const env = (values: Record<string, string>) => values as unknown as NodeJS.ProcessEnv;
const none = { paymentConnected: false, notificationsConnected: false, rulesConfigured: [] };

describe("the commerce set-up report", () => {
  it("says the store is disabled when nothing is set", () => {
    const setup = describeCommerceSetup(env({}), none);
    expect(setup.store).toBe("disabled");
    expect(setup.lines[0]).toMatch(/^Commerce store: DISABLED/);
  });

  it("enables the database only with a valid DATABASE_URL, never printing it", () => {
    const ok = describeCommerceSetup(
      env({ ORDER_REQUESTS_STORE: "database", DATABASE_URL: "postgres://u:hunter2@db/x" }),
      none,
    );
    expect(ok.store).toBe("database");
    expect(ok.lines[0]).toMatch(/^Commerce store: DATABASE/);

    for (const url of ["", "mysql://u:hunter2@db/x"]) {
      const bad = describeCommerceSetup(
        env({ ORDER_REQUESTS_STORE: "database", DATABASE_URL: url }),
        none,
      );
      expect(bad.store).toBe("disabled");
      expect(bad.lines[0]).toMatch(/DATABASE_URL/);
      expect(bad.lines.join("\n")).not.toContain("hunter2");
    }
  });

  it("reports the file store, an unknown store, and the other integrations", () => {
    expect(describeCommerceSetup(env({ ORDER_REQUESTS_STORE: "file" }), none).store).toBe("file");
    expect(describeCommerceSetup(env({ ORDER_REQUESTS_STORE: "s3" }), none).lines[0]).toMatch(
      /unknown ORDER_REQUESTS_STORE/,
    );
    const connected = describeCommerceSetup(env({}), {
      paymentConnected: true,
      notificationsConnected: true,
      rulesConfigured: ["tax"],
    });
    expect(connected.lines.slice(1)).toEqual([
      "Payment: CONNECTED",
      "Notifications: CONNECTED",
      "Delivery/tax rules: tax",
    ]);
  });

  it("reflects today's real set-up: no payment, no notifications, no rules", () => {
    expect(commerceStatus(env({})).lines.slice(1)).toEqual([
      expect.stringMatching(/^Payment: NOT CONNECTED/),
      expect.stringMatching(/^Notifications: NONE/),
      expect.stringMatching(/^Delivery\/tax rules: NOT CONFIGURED/),
    ]);
  });
});
