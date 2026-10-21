"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import { CloseIcon } from "@/components/ui/icons";
import { converse, EMPTY_CHAT, type ChatAction } from "@/lib/mascot/chat/conversation";
import { MAIN_REPLIES, QUICK_REPLIES, type ReplyId } from "@/lib/mascot/chat/script";
import { mayBeCurious } from "@/lib/mascot/curiosity";
import { mascotDefinition, type MascotState } from "@/lib/mascot/definition";
import { onMascotEvent } from "@/lib/mascot/events";
import {
  browserClock,
  createMoodController,
  timelineDurationMs,
  type MoodController,
} from "@/lib/mascot/moodController";
import { INTERACTION_PRIORITY } from "@/lib/mascot/moodPriority";
import { NOTE_RULES } from "@/lib/mascot/noteRules";
import {
  markWelcomed,
  mayWelcome,
  sessionStore,
  subscribeWelcome,
  WELCOME,
  welcomedServerSnapshot,
  welcomedSnapshot,
} from "@/lib/mascot/welcome";

import { MascotChat } from "./MascotChat";
import { WhatsAppLink } from "@/components/ui/WhatsAppLink";
import { generalEnquiry } from "@/lib/contact/whatsapp";
import { trackMascotWhatsAppClick } from "@/lib/analytics/events";

import { SvaraMascot } from "./SvaraMascot";
import { useMascotMotion } from "./useMascotMotion";
import { useSectionNotes } from "./useSectionNotes";

/** Routes whose purchase controls the companion must never cover on small screens. */
const PURCHASE_ROUTES = ["/shop", "/products/", "/order"];
/** The cart: quantities and the WhatsApp order throughout, so SVARA stays out at every size. */
const QUIET_ROUTES = ["/cart"];
/** The corner SVARA lives in, as an IntersectionObserver root margin (bottom 22%, right 12%). */
const MASCOT_CORNER = "-78% 0px 0px -88%";

/** After this long with no activity on the page, SVARA dozes (while the panel is closed). */
const SLEEP_AFTER_MS = 60_000;
/** Below the desktop layout the companion waits until the hero has scrolled away. */
const SMALL_SCREEN_QUERY = "(max-width: 63.99rem)";
const HERO_SHARE = 0.85;
const ACTIVITY_EVENTS = ["pointermove", "keydown", "scroll", "touchstart"] as const;
/** Listening lasts while the visitor is in the panel; this only bounds it. */
const LISTEN_HOLD_MS = 60_000;

/** One-shot moods play their timeline once, then hand back to idle. */
const ONE_SHOTS: ReadonlySet<MascotState> = new Set([
  "welcome",
  "curious",
  "greeting",
  "excited",
  "goodbye",
]);
/** Slack after a one-shot's timeline, so its own end (not the fallback) usually settles it. */
const ONE_SHOT_SLACK_MS = 300;

/**
 * How long each mood is protected (and, unless held, how long it lasts).
 * One-shots last exactly their timeline: with reduced motion the timeline
 * holds its first pose and never "ends", so this timer is what returns SVARA
 * to idle — it can never get stuck in a pose.
 */
function holdFor(mood: MascotState): number {
  if (ONE_SHOTS.has(mood) && mascotDefinition.ok) {
    return timelineDurationMs(mascotDefinition.definition.animations[mood]) + ONE_SHOT_SLACK_MS;
  }
  const holds: Partial<Record<MascotState, number>> = {
    happy: 2200,
    error: 4200,
    explaining: NOTE_RULES.visibleMs - 500,
  };
  return holds[mood] ?? 2400;
}

/**
 * The floating companion: SVARA in the bottom-right corner, opening a small
 * scripted conversation (`lib/mascot/chat/`). Mounted once, in the root layout, so it persists
 * across client-side navigation with its mood intact.
 *
 * Every mood goes through one controller (`lib/mascot/moodController.ts`) and
 * one priority table (`lib/mascot/moodPriority.ts`). Moods follow real
 * moments only:
 *   - welcome: once per browser session, the first time SVARA is actually seen;
 *   - curious: a fine pointer rests on a link or button (with a cooldown);
 *   - explaining: a section note appears, or the moringa journey comes into view;
 *   - greeting / listening / happy / goodbye: the panel opens, is used, a place
 *     is chosen, it closes; chat answers wear their script node's mood
 *     (explaining, happy, goodbye, listening) through the same priorities;
 *   - excited / error: something was added to the cart / could not be saved;
 *   - sleeping: after a long quiet spell.
 * Route changes do not force a mood: a playing expression finishes, and the
 * new page's section notes take over. The conversation is scripted — no AI,
 * search or backend is implied; `thinking`/`searching` are reserved for when a
 * real operation exists, and `error` (concerned) for real failures only.
 * The conversation lives here, so it survives client-side navigation.
 */
export function MascotCompanion() {
  const pathname = usePathname();
  const panelId = useId();
  const headingId = useId();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<MascotState>("idle");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pastHero, setPastHero] = useState(false);
  const [small, setSmall] = useState(false);

  // The one mood controller for this companion (created once; its timer is
  // cleared on unmount).
  const controller = useRef<MoodController | null>(null);
  if (controller.current === null)
    controller.current = createMoodController(setState, browserClock);
  useEffect(() => () => controller.current?.dispose(), []);

  /** Asks for a mood; the priority table decides. One-shots and timed moods settle on their own. */
  const request = useCallback(
    (
      mood: MascotState,
      options?: { held?: boolean; holdMs?: number; priority?: number },
    ): boolean =>
      controller.current!.request(mood, options?.holdMs ?? holdFor(mood), {
        held: options?.held,
        priority: options?.priority,
      }),
    [],
  );
  const toRest = useCallback((from: MascotState) => controller.current!.release(from), []);

  // The conversation. The ref mirrors the state so each step reads the latest
  // turn without side effects inside a state updater.
  const [chat, setChat] = useState(EMPTY_CHAT);
  const chatRef = useRef(EMPTY_CHAT);
  /** An answer is interaction, whatever its expression; cart and error moments still outrank it. */
  const respond = useCallback(
    (mood: MascotState) => {
      if (mood === "listening") request("listening", { held: true, holdMs: LISTEN_HOLD_MS });
      else request(mood, { priority: INTERACTION_PRIORITY });
    },
    [request],
  );
  const talk = useCallback(
    (action: ChatAction, react = true) => {
      const step = converse(chatRef.current, action);
      if (step.state === chatRef.current) return;
      chatRef.current = step.state;
      setChat(step.state);
      if (react && step.node) respond(step.node.mood);
    },
    [respond],
  );

  // Small screens: stay out of the hero; appear once the visitor has scrolled past it.
  useEffect(() => {
    const small = window.matchMedia(SMALL_SCREEN_QUERY);
    let frame = 0;
    const measure = () => {
      frame = 0;
      setSmall(small.matches);
      setPastHero(!small.matches || window.scrollY > window.innerHeight * HERO_SHARE);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    small.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      small.removeEventListener("change", schedule);
    };
  }, [pathname]);

  // Real website events: the cart and the journey.
  useEffect(
    () =>
      onMascotEvent((event) => {
        if (event.type === "cart-added") request("excited");
        else if (event.type === "cart-not-saved") request("error");
        else if (event.type === "journey-in-view") request("explaining", { holdMs: 4200 });
      }),
    [request],
  );

  // Sections that ask for a clear view (`data-mascot-clear`, e.g. the product
  // roadmap): while one is on screen, SVARA steps aside on small screens.
  const [clearZone, setClearZone] = useState({ pathname: "", inView: false });
  useEffect(() => {
    const zones = document.querySelectorAll("[data-mascot-clear]");
    if (zones.length === 0) return;
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((records) => {
      records.forEach((record) =>
        record.isIntersecting ? visible.add(record.target) : visible.delete(record.target),
      );
      setClearZone({ pathname, inView: visible.size > 0 });
    });
    zones.forEach((zone) => observer.observe(zone));
    return () => observer.disconnect();
  }, [pathname]);
  // Controls a customer must reach (`data-mascot-avoid`, e.g. size and Add to
  // cart): while one is inside SVARA's own corner, SVARA steps aside at every
  // size. The observer's root is shrunk to that bottom-right corner.
  const [inCorner, setInCorner] = useState({ pathname: "", inView: false });
  useEffect(() => {
    const controls = document.querySelectorAll("[data-mascot-avoid]");
    if (controls.length === 0) return;
    const visible = new Set<Element>();
    const observer = new IntersectionObserver(
      (records) => {
        records.forEach((record) =>
          record.isIntersecting ? visible.add(record.target) : visible.delete(record.target),
        );
        setInCorner({ pathname, inView: visible.size > 0 });
      },
      { rootMargin: MASCOT_CORNER },
    );
    controls.forEach((control) => observer.observe(control));
    return () => observer.disconnect();
  }, [pathname]);
  const asideForControls = inCorner.pathname === pathname && inCorner.inView;
  const stepAside =
    (small && clearZone.pathname === pathname && clearZone.inView) || asideForControls;

  const hideOnSmall = PURCHASE_ROUTES.some((route) => pathname.startsWith(route));
  const quietHere = QUIET_ROUTES.some((route) => pathname.startsWith(route));
  /** SVARA is actually on screen: past the hero, not tucked away on a small-screen purchase page or clear zone. */
  const onScreen = pastHero && !(small && hideOnSmall) && !stepAside && !quietHere;

  // The tab is visible (a welcome in a background tab would be spent unseen).
  const [pageVisible, setPageVisible] = useState(true);
  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  // Whether this browser session still owes the visitor a welcome — spent
  // only when the welcome actually starts (see lib/mascot/welcome.ts).
  const welcomed = useSyncExternalStore(subscribeWelcome, welcomedSnapshot, welcomedServerSnapshot);
  const welcomePending = !welcomed;
  const welcomeDue = mayWelcome({
    pending: welcomePending,
    onScreen,
    pageVisible,
    panelOpen: open,
  });
  const spendWelcome = useCallback(() => markWelcomed(sessionStore()), []);

  // Cursor-following and touch awareness (CSS variables on the root; no re-renders).
  // SVARA stays home while its panel is open and on pages with purchase controls.
  const holdHome = useRef(false);
  useEffect(() => {
    holdHome.current = open || PURCHASE_ROUTES.some((route) => pathname.startsWith(route));
  }, [open, pathname]);

  // Curiosity: the pointer has settled on a real control. Not while the panel
  // is open (SVARA is already attending), and at most once per cooldown.
  const lastCurious = useRef<number | null>(null);
  const curious = useRef<(() => void) | null>(null);
  useEffect(() => {
    curious.current = () => {
      const now = Date.now();
      if (open || !mayBeCurious(now, lastCurious.current)) return;
      if (request("curious")) lastCurious.current = now;
    };
  }, [open, request]);
  useMascotMotion(rootRef, buttonRef, holdHome, curious);

  // Section notes: SVARA turns to explain while a note is on screen.
  const explainNote = useCallback(() => {
    request("explaining");
  }, [request]);
  const notes = useSectionNotes({
    pathname,
    blocked: open,
    // While the welcome is due, it speaks first; section notes wait their turn.
    deferred: welcomeDue,
    hidden: !onScreen,
    onShow: explainNote,
  });

  // The first-visit welcome: once SVARA is on screen in a visible tab, after a
  // beat. If a higher-priority moment holds the stage (a cart celebration),
  // the welcome stays owed and is tried again when SVARA is free (`state`
  // changes). The session is marked only when the welcome starts.
  const firstAttempt = useRef(true);
  const { announce } = notes;
  useEffect(() => {
    if (!welcomeDue) return;
    const delay = firstAttempt.current ? WELCOME.delayMs : WELCOME.revealDelayMs;
    const timer = window.setTimeout(() => {
      firstAttempt.current = false;
      if (!request("welcome")) return;
      spendWelcome();
      announce(WELCOME.note, WELCOME.visibleMs);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [welcomeDue, state, request, spendWelcome, announce]);

  const close = useCallback(
    (returnFocus: boolean) => {
      setOpen(false);
      request("goodbye");
      if (returnFocus) buttonRef.current?.focus();
    },
    [request],
  );

  const toggle = useCallback(() => {
    if (open) {
      close(false);
      return;
    }
    setOpen(true);
    request("greeting");
    // Opening SVARA is a hello of its own: no separate welcome after it.
    spendWelcome();
    talk({ type: "start" }, false);
  }, [open, close, request, spendWelcome, talk]);

  /** A quick reply chosen from the welcome bubble: open the conversation there. */
  const replyFromBubble = useCallback(
    (reply: ReplyId) => {
      setOpen(true);
      spendWelcome();
      talk({ type: "start" }, false);
      talk({ type: "choose", reply });
    },
    [spendWelcome, talk],
  );

  /** A link out of the chat: note the choice, close, and look pleased. */
  const leaveChat = useCallback(
    (reply?: ReplyId) => {
      if (reply) talk({ type: "choose", reply }, false);
      setOpen(false);
      request("happy");
    },
    [talk, request],
  );

  // One-shot states hand back to the resting state when they finish.
  const handleStateEnd = useCallback(
    (ended: MascotState) => {
      if (ONE_SHOTS.has(ended)) toRest(ended);
    },
    [toRest],
  );

  // Escape closes; focus moves into the panel when it opens.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Doze after a long quiet spell; wake on any activity. One timer, cleaned up.
  useEffect(() => {
    if (open) return;
    const doze = () => request("sleeping", { held: true, holdMs: 0 });
    let timer = window.setTimeout(doze, SLEEP_AFTER_MS);
    const wake = () => {
      window.clearTimeout(timer);
      toRest("sleeping");
      timer = window.setTimeout(doze, SLEEP_AFTER_MS);
    };
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, wake, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, wake));
    };
  }, [open, request, toRest]);

  const listen = () => {
    if (controller.current!.current() !== "greeting")
      request("listening", { held: true, holdMs: LISTEN_HOLD_MS });
  };
  const rest = () => toRest("listening");

  // Kept outside the className literal (Prettier's class sorter drops leading spaces).
  const asideClass = asideForControls && !open ? "mascot-companion--aside" : "";
  return (
    <div
      ref={rootRef}
      className={`mascot-companion fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex flex-col items-end gap-3 ${
        quietHere ? "hidden" : hideOnSmall ? "max-lg:hidden" : ""
      } ${(!pastHero || stepAside) && !open ? "mascot-companion--away" : ""} ${asideClass}`}
    >
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={headingId}
          onPointerEnter={listen}
          onPointerLeave={rest}
          onFocus={listen}
          className="mascot-panel max-h-[calc(100dvh-7.5rem)] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto leaf-plate-sm border border-[color:var(--vein)] bg-ivory p-5 shadow-[0_24px_50px_-24px_rgb(15_42_27/0.45)] sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="type-label text-earth-ink">The SVARA Agri Farms companion</p>
              <h2 id={headingId} className="mt-1 type-h3 text-forest">
                Hello, I&rsquo;m SVARA.
              </h2>
            </div>
            <button
              type="button"
              onClick={() => close(true)}
              className="grid size-10 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-ivory-deep hover:text-forest"
            >
              <CloseIcon />
              <span className="sr-only">Close SVARA</span>
            </button>
          </div>
          {notes.current && (
            <p className="mt-3 border-l-2 border-harvest pl-3 type-small text-forest">
              <span className="sr-only">About this section: </span>
              {notes.current.note}
            </p>
          )}
          <MascotChat
            chat={chat}
            pathname={pathname}
            onChoose={(reply) => talk({ type: "choose", reply })}
            onSay={(text) => talk({ type: "say", text })}
            onNavigate={leaveChat}
          />
          <div className="mt-4 border-t border-[color:var(--vein)] pt-3">
            <WhatsAppLink
              message={generalEnquiry()}
              onClick={() => trackMascotWhatsAppClick("panel", pathname)}
            >
              Chat with our team on WhatsApp
            </WhatsAppLink>
          </div>
        </div>
      )}

      {/* The note bubble: a polite live region, so each new note is announced once. */}
      <div role="status" aria-live="polite" className="mascot-note-region">
        {notes.bubble && (
          <div className="mascot-note relative max-w-[min(17rem,calc(100vw-6rem))] rounded-[1.4rem_1.4rem_0.4rem_1.4rem] border border-[color:var(--vein)] bg-ivory py-3 pr-10 pl-4 shadow-[0_18px_40px_-22px_rgb(15_42_27/0.5)]">
            <p className="type-small text-forest">
              <span className="sr-only">SVARA: </span>
              {notes.bubble.note}
            </p>
            <button
              type="button"
              onClick={notes.dismiss}
              className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full text-ink-soft transition-colors hover:bg-ivory-deep hover:text-forest"
            >
              <CloseIcon />
              <span className="sr-only">Dismiss SVARA&rsquo;s note</span>
            </button>
          </div>
        )}
      </div>

      {/* The welcome's quick replies sit beside its bubble, outside the live region. */}
      {notes.bubble?.note === WELCOME.note && (
        <ul
          aria-label="Quick replies"
          className="mascot-note-replies flex flex-wrap justify-end gap-2"
        >
          {MAIN_REPLIES.map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => replyFromBubble(id)}
                className="min-h-10 rounded-full border border-[color:var(--vein)] bg-ivory px-4 py-1.5 type-small text-forest shadow-[0_10px_24px_-18px_rgb(15_42_27/0.5)] transition-colors hover:bg-ivory-deep"
              >
                {QUICK_REPLIES[id].label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="mascot-launcher grid size-16 place-items-center rounded-full border border-[color:var(--vein)] bg-ivory shadow-[0_14px_30px_-14px_rgb(15_42_27/0.55)] transition-transform duration-500 ease-[var(--ease-organic)] hover:-translate-y-0.5"
      >
        <SvaraMascot state={state} size={52} decorative onStateEnd={handleStateEnd} />
        <span className="sr-only">
          {open ? "Close SVARA" : "Open SVARA, the SVARA Agri Farms companion"}
        </span>
      </button>
    </div>
  );
}
