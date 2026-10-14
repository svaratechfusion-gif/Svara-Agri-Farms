/**
 * Where SVARA looks, as numbers: small, bounded offsets that CSS turns into a
 * gaze (eyes, fast), a lean (body, slower, springy) and a crest that lags
 * behind the body. Physical travel lives in `follow.ts`.
 */
export const GAZE_LIMITS = {
  /** Eye travel in artboard units (the face is ~60 units wide). */
  eyeX: 7,
  eyeY: 5,
  /** Body lean in degrees. */
  lean: 4,
  /** Pointer distance (CSS px) inside which SVARA is "aware" of it as near. */
  near: 170,
  /** Distance over which the gaze reaches full deflection. */
  reach: 280,
} as const;

export interface Gaze {
  eyeX: number;
  eyeY: number;
  lean: number;
  near: boolean;
}

export const REST_GAZE: Gaze = { eyeX: 0, eyeY: 0, lean: 0, near: false };

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));
const round = (value: number) => Math.round(value * 100) / 100;

/** The gaze from SVARA's centre towards a target point (both in viewport px). */
export function gazeTowards(
  centre: { x: number; y: number },
  target: { x: number; y: number },
): Gaze {
  const dx = target.x - centre.x;
  const dy = target.y - centre.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return REST_GAZE;
  const reach = Math.min(1, distance / GAZE_LIMITS.reach);
  const ux = dx / distance;
  const uy = dy / distance;
  return {
    eyeX: round(clamp(ux * reach * GAZE_LIMITS.eyeX, GAZE_LIMITS.eyeX)),
    eyeY: round(clamp(uy * reach * GAZE_LIMITS.eyeY, GAZE_LIMITS.eyeY)),
    lean: round(clamp(ux * reach * GAZE_LIMITS.lean, GAZE_LIMITS.lean)),
    near: distance <= GAZE_LIMITS.near,
  };
}
