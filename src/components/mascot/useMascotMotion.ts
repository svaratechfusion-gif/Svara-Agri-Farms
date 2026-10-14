"use client";

import { useEffect, type RefObject } from "react";

import {
  AT_REST,
  FOLLOW_CONFIG,
  isSettled,
  poseFor,
  stepSpring,
  targetFor,
  type SpringState,
  type Vec,
} from "@/lib/mascot/follow";
import { CURIOSITY } from "@/lib/mascot/curiosity";
import { gazeTowards, REST_GAZE, type Gaze } from "@/lib/mascot/gaze";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const INTERACTIVE = "a[href], button, [role='button'], input, select, textarea, summary, label";
/** Beyond this offset (px) SVARA counts as away from home and stops taking pointer events. */
const ROAMING_PX = 4;
/** Touch: how long a glance (at a tap, or along a scroll) is held. */
const GLANCE_MS = 800;
const SCROLL_GLANCE = 4;
const MAX_LEAN = 6;

const fixed = (value: number) => value.toFixed(2);

function writeGaze(root: HTMLElement, gaze: Gaze, lean = gaze.lean): void {
  const style = root.style;
  style.setProperty("--mascot-gx", String(gaze.eyeX));
  style.setProperty("--mascot-gy", String(gaze.eyeY));
  style.setProperty("--mascot-lean", fixed(Math.max(-MAX_LEAN, Math.min(MAX_LEAN, lean))));
  if (gaze.near) root.dataset.near = "";
  else delete root.dataset.near;
}

function writeBody(root: HTMLElement, spring: SpringState): void {
  const style = root.style;
  const { x, y } = spring.position;
  const { tilt, stretch } = poseFor(spring.velocity);
  // Stretch along the direction of travel, preserving volume across it.
  const speed = Math.hypot(spring.velocity.x, spring.velocity.y) || 1;
  const ux2 = (spring.velocity.x / speed) ** 2;
  const uy2 = (spring.velocity.y / speed) ** 2;
  const across = 1 / Math.sqrt(stretch);
  style.setProperty("--mascot-x", `${fixed(x)}px`);
  style.setProperty("--mascot-y", `${fixed(y)}px`);
  style.setProperty("--mascot-tilt", `${fixed(tilt)}deg`);
  style.setProperty("--mascot-sx", fixed(stretch * ux2 + across * uy2 || 1));
  style.setProperty("--mascot-sy", fixed(stretch * uy2 + across * ux2 || 1));
  if (Math.hypot(x, y) > ROAMING_PX) root.dataset.roaming = "";
  else delete root.dataset.roaming;
}

function clearMotion(root: HTMLElement): void {
  for (const name of ["--mascot-x", "--mascot-y", "--mascot-tilt", "--mascot-sx", "--mascot-sy"]) {
    root.style.removeProperty(name);
  }
  delete root.dataset.roaming;
  writeGaze(root, REST_GAZE);
}

function centreOf(element: Element): Vec {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * SVARA's body in space. On a fine pointer SVARA physically follows the
 * cursor on a damped spring (`lib/mascot/follow.ts`): the eyes look ahead at
 * the pointer at once, the body travels after it, leaning and stretching a
 * little with speed, and the crest lags behind (CSS). It trails within a
 * bounded area, stays home when the pointer is near or over a real control,
 * returns after a pause, and stops taking pointer events while away so it
 * can never intercept a click. The frame loop runs only while SVARA moves.
 * On touch: glances only. With reduced motion: nothing moves at all.
 *
 * `paused` (read each frame) holds SVARA at home — panel open, purchase pages.
 * `onCurious` (read when it fires) is called when a fine pointer has rested
 * on one real control for `CURIOSITY.dwellMs`; the mood controller decides
 * whether SVARA actually turns curious.
 */
export function useMascotMotion(
  root: RefObject<HTMLElement | null>,
  anchor: RefObject<HTMLElement | null>,
  paused: RefObject<boolean>,
  onCurious?: RefObject<(() => void) | null>,
): void {
  useEffect(() => {
    const host = root.current;
    if (!host || window.matchMedia(REDUCED_MOTION).matches) return;

    let frame = 0;
    let timer: number | undefined;
    const cleanups: Array<() => void> = [];
    const visible = () => anchor.current !== null && anchor.current.offsetParent !== null;

    if (window.matchMedia(FINE_POINTER).matches) {
      let spring: SpringState = AT_REST;
      let target: Vec = { x: 0, y: 0 };
      let pointer: Vec | null = null;
      let last = 0;
      let watched: Element | null = null;
      let dwell: number | undefined;
      const watch = (control: Element | null) => {
        if (control === watched) return;
        watched = control;
        window.clearTimeout(dwell);
        if (control) dwell = window.setTimeout(() => onCurious?.current?.(), CURIOSITY.dwellMs);
      };

      /** SVARA's resting centre: where it would be with no offset applied. */
      const home = (): Vec | null => {
        if (!anchor.current || !visible()) return null;
        const centre = centreOf(anchor.current);
        return { x: centre.x - spring.position.x, y: centre.y - spring.position.y };
      };

      const tick = (now: number) => {
        frame = 0;
        const dt = last ? now - last : 16;
        last = now;
        if (paused.current || !visible()) target = { x: 0, y: 0 };
        spring = stepSpring(spring, target, dt);
        const settled = isSettled(spring, target);
        if (settled) spring = { position: { ...target }, velocity: { x: 0, y: 0 } };
        writeBody(host, spring);
        const base = home();
        if (pointer && base) {
          const gaze = gazeTowards(
            { x: base.x + spring.position.x, y: base.y + spring.position.y },
            pointer,
          );
          writeGaze(host, gaze, gaze.lean + poseFor(spring.velocity).tilt * 0.5);
        } else {
          writeGaze(host, REST_GAZE);
        }
        if (!settled) frame = requestAnimationFrame(tick);
        else last = 0;
      };
      const kick = () => {
        if (!frame) frame = requestAnimationFrame(tick);
      };
      const goHome = () => {
        target = { x: 0, y: 0 };
        kick();
      };

      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
        pointer = { x: event.clientX, y: event.clientY };
        const over = event.target as Element | null;
        // Over SVARA itself (its bubble, replies or launcher): hold still where
        // it is, so what the visitor is reaching for does not slide away.
        if (over && host.contains(over)) {
          target = { ...spring.position };
          watch(null);
          window.clearTimeout(timer);
          kick();
          return;
        }
        const control = over?.closest(INTERACTIVE);
        const base = home();
        // Over a real control (outside SVARA): step back home and leave it clear.
        if (!base || paused.current || (control && !host.contains(control)))
          target = { x: 0, y: 0 };
        else target = targetFor(pointer, base);
        watch(control && !host.contains(control) ? control : null);
        kick();
        window.clearTimeout(timer);
        timer = window.setTimeout(goHome, FOLLOW_CONFIG.returnDelayMs);
      };
      const onLeave = (event: MouseEvent) => {
        if (event.relatedTarget) return;
        pointer = null;
        watch(null);
        window.clearTimeout(timer);
        goHome();
      };
      // Keyboard focus on SVARA (or its panel) brings it home, where focus is expected.
      const onFocus = () => goHome();

      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("mouseout", onLeave);
      host.addEventListener("focusin", onFocus);
      cleanups.push(() => {
        window.clearTimeout(dwell);
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("mouseout", onLeave);
        host.removeEventListener("focusin", onFocus);
      });
    } else {
      let lastY = window.scrollY;
      const glance = (apply: () => void) => {
        apply();
        window.clearTimeout(timer);
        timer = window.setTimeout(() => writeGaze(host, REST_GAZE), GLANCE_MS);
      };
      const onScroll = () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const delta = window.scrollY - lastY;
          lastY = window.scrollY;
          if (Math.abs(delta) < 2 || !visible()) return;
          glance(() =>
            writeGaze(host, { ...REST_GAZE, eyeY: delta > 0 ? SCROLL_GLANCE : -SCROLL_GLANCE }),
          );
        });
      };
      const onTap = (event: PointerEvent) => {
        if (event.pointerType !== "touch" || host.contains(event.target as Node)) return;
        if (!anchor.current || !visible()) return;
        const from = centreOf(anchor.current);
        glance(() => writeGaze(host, gazeTowards(from, { x: event.clientX, y: event.clientY })));
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("pointerdown", onTap, { passive: true });
      cleanups.push(() => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("pointerdown", onTap);
      });
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      clearMotion(host);
    };
  }, [root, anchor, paused, onCurious]);
}
