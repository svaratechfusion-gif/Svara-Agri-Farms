"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { notesFor, type SectionNote } from "@/content/mascot-notes";
import { mayShowNote, NOTE_RULES } from "@/lib/mascot/noteRules";

/** The reading band: a section is "current" while its anchor crosses the middle of the screen. */
const READING_BAND = "-35% 0px -40% 0px";

/** Where a note bubble sits above SVARA, from the bottom-right of the screen (px). */
const BUBBLE_FOOTPRINT = { width: 300, height: 240 };
const COVER_RETRIES = 8;
const COVER_RETRY_MS = 1500;

/**
 * Whether a note bubble would now cover something marked `data-note-avoid`
 * or `data-mascot-avoid` (an order summary, a call to action).
 */
function noteWouldCover(): boolean {
  const left = window.innerWidth - BUBBLE_FOOTPRINT.width;
  const top = window.innerHeight - BUBBLE_FOOTPRINT.height;
  return Array.from(document.querySelectorAll("[data-note-avoid], [data-mascot-avoid]")).some(
    (element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.right > left && box.bottom > top && box.top < window.innerHeight;
    },
  );
}

interface SectionNotesOptions {
  pathname: string;
  /** The panel is open: no bubbles over it. */
  blocked: boolean;
  /** Section notes wait (e.g. while the welcome is due); announcements still show. */
  deferred?: boolean;
  /** The companion is not on screen (hero on small screens, purchase pages). */
  hidden: boolean;
  /** Called when a note appears, so SVARA can turn to explain it. */
  onShow: () => void;
}

export interface SectionNotes {
  /** The note on screen now, if any. */
  bubble: SectionNote | null;
  /** The note for the section the visitor is reading (shown again inside the panel). */
  current: SectionNote | null;
  dismiss: () => void;
  /**
   * Shows a one-off note not tied to a section (the welcome). It takes the
   * bubble like any note — one at a time, then the usual quiet gap — and is
   * skipped while the panel is open or SVARA is hidden.
   */
  announce: (note: string, visibleMs?: number) => void;
}

/**
 * Section-aware notes. One IntersectionObserver watches the page's note
 * anchors; when a section has stayed in the reading band for a moment, its
 * note may appear (see `mayShowNote`) and fades after a few seconds. Each
 * note shows once per page view; dismissing one quiets SVARA for a while.
 */
export function useSectionNotes({
  pathname,
  blocked,
  deferred = false,
  hidden,
  onShow,
}: SectionNotesOptions): SectionNotes {
  const [bubble, setBubble] = useState<SectionNote | null>(null);
  const [current, setCurrent] = useState<SectionNote | null>(null);
  const shown = useRef(new Set<string>());
  const quietUntil = useRef(0);
  const blockedRef = useRef(blocked);
  const deferredRef = useRef(deferred);
  const hiddenRef = useRef(hidden);
  const onShowRef = useRef(onShow);
  const hideTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    blockedRef.current = blocked;
    deferredRef.current = deferred;
    hiddenRef.current = hidden;
    onShowRef.current = onShow;
  }, [blocked, deferred, hidden, onShow]);

  useEffect(() => {
    const notes = notesFor(pathname);
    shown.current = new Set();
    if (notes.length === 0) return;
    const findAnchors = () =>
      notes
        .map((note) => ({ note, element: document.querySelector(note.anchor) }))
        .filter(
          (entry): entry is { note: SectionNote; element: Element } => entry.element !== null,
        );

    let dwell: number | undefined;
    let observer: IntersectionObserver | undefined;
    let anchors: { note: SectionNote; element: Element }[] = [];
    const attach = (): boolean => {
      anchors = findAnchors();
      if (anchors.length === 0) return false;
      observer = watch();
      anchors.forEach((entry) => observer!.observe(entry.element));
      return true;
    };
    // Pages that render from browser state (e.g. the order page, from the
    // cart) add their anchors after hydration: wait for them to appear.
    const pending = attach()
      ? undefined
      : new MutationObserver(() => {
          if (attach()) pending?.disconnect();
        });
    pending?.observe(document.body, { childList: true, subtree: true });

    function watch() {
      return new IntersectionObserver(
        (records) => {
          const entering = records.filter((record) => record.isIntersecting).at(-1);
          if (!entering) return;
          const match = anchors.find((entry) => entry.element === entering.target);
          if (!match) return;
          setCurrent(match.note);
          window.clearTimeout(dwell);
          let attempts = 0;
          const tryShow = () => {
            // Its section has left the page (e.g. the order form, once the order is ready).
            if (!match.element.isConnected) return;
            // The bubble would cover something the customer needs: wait, never cover it.
            if (noteWouldCover()) {
              attempts += 1;
              if (attempts <= COVER_RETRIES) dwell = window.setTimeout(tryShow, COVER_RETRY_MS);
              return;
            }
            const now = Date.now();
            const anyDialog = document.querySelector("dialog[open]") !== null;
            const allowed = mayShowNote({
              anchor: match.note.anchor,
              now,
              shown: shown.current,
              quietUntil: quietUntil.current,
              blocked: blockedRef.current || deferredRef.current || anyDialog,
              hidden: hiddenRef.current,
            });
            if (!allowed) return;
            shown.current.add(match.note.anchor);
            quietUntil.current = now + NOTE_RULES.gapMs;
            setBubble(match.note);
            onShowRef.current();
            window.clearTimeout(hideTimer.current);
            hideTimer.current = window.setTimeout(() => setBubble(null), NOTE_RULES.visibleMs);
          };
          dwell = window.setTimeout(tryShow, NOTE_RULES.dwellMs);
        },
        { rootMargin: READING_BAND },
      );
    }
    return () => {
      pending?.disconnect();
      observer?.disconnect();
      window.clearTimeout(dwell);
      window.clearTimeout(hideTimer.current);
      setBubble(null);
      setCurrent(null);
    };
  }, [pathname]);

  const announce = useCallback((note: string, visibleMs: number = NOTE_RULES.visibleMs) => {
    if (blockedRef.current || hiddenRef.current) return;
    quietUntil.current = Date.now() + Math.max(NOTE_RULES.gapMs, visibleMs);
    setBubble({ anchor: "announcement", note });
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setBubble(null), visibleMs);
  }, []);

  const dismiss = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    quietUntil.current = Date.now() + NOTE_RULES.dismissedGapMs;
    setBubble(null);
  }, []);

  // Opening the panel or hiding SVARA takes any bubble with it.
  return { bubble: blocked || hidden ? null : bubble, current, dismiss, announce };
}
