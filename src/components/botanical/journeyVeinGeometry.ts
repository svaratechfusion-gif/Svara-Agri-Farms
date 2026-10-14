/**
 * Geometry for the Living Journey Line — a midrib that bows gently, like the
 * central vein of a moringa leaf, with stages placed along it.
 *
 * Coordinates are in a fixed viewBox (VIEW_WIDTH × VIEW_HEIGHT) rendered at a
 * locked aspect ratio, so strokes never distort and HTML nodes can be placed
 * with the same percentages.
 */

export const VIEW_WIDTH = 1000;
export const VIEW_HEIGHT = 140;

const START_X = 24;
const END_X = 976;
const NODE_MARGIN = 60;
const SAMPLE_STEP = 8;

/** The midrib: a long, low arc with a faint secondary undulation. */
export function midribY(x: number): number {
  const t = (x - START_X) / (END_X - START_X);
  return 86 - 30 * Math.sin(Math.PI * t * 0.92) + 5 * Math.sin(Math.PI * 2 * 1.5 * t);
}

/** SVG path data for the midrib, sampled densely enough to read as a curve. */
export function midribPath(): string {
  const points: string[] = [];
  for (let x = START_X; x <= END_X; x += SAMPLE_STEP) {
    points.push(`${x.toFixed(1)} ${midribY(x).toFixed(2)}`);
  }
  points.push(`${END_X} ${midribY(END_X).toFixed(2)}`);
  return `M${points.join(" L")}`;
}

export interface VeinNode {
  /** Position in viewBox units. */
  x: number;
  y: number;
  /** Position as a percentage of the rendered box (for HTML placement). */
  left: number;
  top: number;
  /** Labels alternate below / above the vein, like leaflets along a rachis. */
  side: "below" | "above";
  /** A short secondary vein from the node toward its label. */
  branch: string;
}

/** Evenly spaced stage nodes along the midrib, each with its secondary vein. */
export function veinNodes(count: number): VeinNode[] {
  if (count < 1) return [];
  const span = END_X - START_X - NODE_MARGIN * 2;
  return Array.from({ length: count }, (_, index) => {
    const x = START_X + NODE_MARGIN + (count === 1 ? span / 2 : (span * index) / (count - 1));
    const y = midribY(x);
    const side = index % 2 === 0 ? "below" : "above";
    const direction = side === "below" ? 1 : -1;
    const branch = `M${x.toFixed(1)} ${y.toFixed(2)} Q ${(x + 10).toFixed(1)} ${(
      y +
      direction * 14
    ).toFixed(2)} ${(x + 6).toFixed(1)} ${(y + direction * 30).toFixed(2)}`;
    return {
      x,
      y,
      left: (x / VIEW_WIDTH) * 100,
      top: (y / VIEW_HEIGHT) * 100,
      side,
      branch,
    };
  });
}

/** Arc length of the midrib from its start to x (polyline approximation). */
function arcLengthTo(x: number): number {
  let length = 0;
  let previousX = START_X;
  let previousY = midribY(START_X);
  for (let sample = START_X + 1; sample <= x; sample += 1) {
    const y = midribY(sample);
    length += Math.hypot(sample - previousX, y - previousY);
    previousX = sample;
    previousY = y;
  }
  return length;
}

/**
 * Where each stage node sits along the drawn vein, as a fraction (0–1) of the
 * whole path length — the value the trace must reach for that stage.
 */
export function nodeFractions(count: number): number[] {
  const total = arcLengthTo(END_X);
  return veinNodes(count).map((node) => arcLengthTo(node.x) / total);
}

/**
 * The reader's position along the journey as a fractional stage index, from
 * the measured vertical centres of the stages (in viewport px, top to bottom)
 * and the reading line: 0 while the first centre is still below the line,
 * k exactly as stage k's centre crosses it, interpolated in between.
 */
export function stagePosition(centres: readonly number[], line: number): number {
  if (centres.length === 0) return 0;
  if (line <= centres[0]) return 0;
  for (let index = 1; index < centres.length; index++) {
    if (line <= centres[index]) {
      const span = centres[index] - centres[index - 1];
      return index - 1 + (span > 0 ? (line - centres[index - 1]) / span : 1);
    }
  }
  return centres.length - 1;
}

/** How much of the vein is drawn at a fractional stage position (0–1). */
export function traceAtPosition(position: number, fractions: readonly number[]): number {
  const count = fractions.length;
  if (count === 0) return 0;
  const clamped = Math.min(count - 1, Math.max(0, position));
  const from = Math.floor(clamped);
  const to = Math.min(count - 1, from + 1);
  return fractions[from] + (fractions[to] - fractions[from]) * (clamped - from);
}
