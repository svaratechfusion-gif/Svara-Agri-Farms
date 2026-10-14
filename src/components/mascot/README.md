# SVARA — the SVARA Farms mascot

| File                                        | Role                                                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/content/mascot.avatar.json`            | SVARA's avatar definition: 21 expressions, 11 timelines (`bible-strong/avatar-definition` v1 shape). |
| `src/lib/mascot/definition.ts`              | Types, `MASCOT_STATES`, and a validator; a broken asset yields the static fallback, not a crash.     |
| `src/lib/mascot/playback.ts`                | Timeline + blink scheduler hook (one timer of each per mascot, cleared on change/unmount).           |
| `src/components/mascot/SvaraMascot.tsx`     | Playback wiring, error boundary and static fallback.                                                 |
| `src/components/mascot/MascotArt.tsx`       | The drawing: lit seed body, crest, eyes (SVARA 2.0).                                                 |
| `src/lib/mascot/events.ts`                  | Real site events SVARA reacts to (`cart-added`, `cart-not-saved`, `journey-in-view`).                |
| `src/components/mascot/MascotCompanion.tsx` | Floating companion (mounted in `app/layout.tsx`).                                                    |
| `src/components/mascot/MeetSvara.tsx`       | Large showcase on `/our-story`.                                                                      |
| `src/styles/mascot.css`                     | Per-state body language; reduced motion keeps poses, drops movement.                                 |

## States

`idle`, `greeting` (once), `listening`, `thinking`, `searching`, `explaining`, `happy`,
`excited` (once), `sleeping`, `error` (shown as "Concerned"), `goodbye` (once). A one-shot
state plays through, then the caller returns SVARA to `idle`.

The companion only uses states that reflect real interaction (greeting, listening, happy,
goodbye, sleeping). `thinking` / `searching` / `explaining` / `error` are ready for when a
real operation (search, assistant, backend) is connected — set them only while it runs.

## Rendering (SVARA 2.0)

Volume is real per-pixel lighting: the seed's alpha is blurred into a height map and lit by an
upper-left key light through SVG `feDiffuseLighting` + `feSpecularLighting` (filter `sculpt`),
then a subsurface glow, a gold rim, two-layer contact shadows, eye sockets and glossy eyes.
Chosen over Three.js/WebGL (≈150 KB+ gz and a GPU context per mascot for a 52 px character),
pre-rendered frames (cannot play the definition's expressions) and CSS 3D (cannot shade curves).

**Budgets** — no new dependencies; ≤ 1 timeline timer + 1 blink timer per mascot; no rAF loop
(the companion's small-screen visibility check is rAF-throttled on scroll); 60 fps with p95
frame ≤ 16.8 ms measured with the 260 px showcase and the companion animating together.

## Real events

| Event             | Emitted by                                                         | SVARA      |
| ----------------- | ------------------------------------------------------------------ | ---------- |
| `cart-added`      | `CartProvider.addItem`                                             | excited    |
| `cart-not-saved`  | `CartProvider.addItem` when the cart store reports the save failed | concerned  |
| `journey-in-view` | `JourneyExperience`, once per page view                            | explaining |

Plus: a greeting once per browser session (only if SVARA is at rest), greeting on open,
listening in the panel, happy on choosing a place, goodbye on close, asleep after 60 s idle.
On small screens the companion stays hidden until the hero has scrolled away, and is hidden
on purchase pages.

## Awareness and notes (SVARA 3.0)

- **Gaze** — `useMascotGaze` + `lib/mascot/gaze.ts`. Fine pointers: rAF-throttled `pointermove`
  writes bounded CSS variables on the companion (eyes ±7, lean ±4°, drift ±6 px; "near"
  within 170 px); over a real control SVARA glances at the control; it rests after 2.6 s. Touch:
  a glance along a scroll or towards a tap. No React state per pointer event; off with
  reduced motion.
- **Notes** — `useSectionNotes` + `content/mascot-notes.ts` + `lib/mascot/noteRules.ts`. One
  IntersectionObserver per page over the notes' anchors; a note shows after 0.9 s in the
  reading band, for 6.5 s, once per section per page view, ≥ 9 s apart (30 s after a
  dismissal), never over the panel, menu or cart, never while SVARA is hidden. Every note
  restates copy already on the page; purchase areas and the cart have none. The current
  section's note is repeated inside the panel.
- **Priority** — `lib/mascot/moodPriority.ts`: cart outcomes (3) > interaction (2) > ambient
  notes/journey (1) > rest (0). A mood is protected from lower-priority requests until it
  settles.

## Physical following (SVARA 3.0)

`useMascotMotion` + `src/lib/mascot/follow.ts` (all tunables in `FOLLOW_CONFIG`: travel
300 px left / 220 px up, strength 0.42, stiffness 70, damping 13, home radius 130 px,
return delay 1.8 s, tilt and stretch limits). On fine pointers SVARA travels after the cursor
on a damped spring — eyes on the pointer at once, body after it, leaning and stretching a
little with speed, crest lagging behind. It trails (never under the cursor), stays home when
the pointer is near it or over a real control, returns after a pause or when the pointer
leaves the window, holds home while its panel is open and on purchase pages, holds still
while the pointer is on SVARA itself (its bubble or replies), and takes no
pointer events while away from home. The frame loop runs only until the spring settles.
Touch devices keep glances only; reduced motion disables all of it.

## Conversation (scripted)

`MascotChat` + `src/lib/mascot/chat/`. SVARA is a scripted guide, not an AI, and the panel
says so. `script.ts` holds every answer, its quick replies and its mood; product names,
prices and availability are read from `content/products.ts` and `content/range.ts`, never
written into the script. `intents.ts` is a separate keyword matcher that maps typed text to
one scripted answer, or to the honest "I don't know that one yet". `conversation.ts` is the
pure state machine (start / choose / say) and keeps 40 messages. The conversation lives in
`MascotCompanion`, so it survives client-side navigation (not a reload). Answers are
immediate, so there is no typing indicator. An answer is requested at interaction priority
(`INTERACTION_PRIORITY`): it outranks section notes and curiosity, never a cart or error
moment, and never uses the concerned (`error`) pose. The first-visit welcome bubble uses the
conversation's greeting and offers its three quick replies. There is no order system or
contact page yet, and the order-status answer says so. To add a real assistant later, replace
`matchIntent` with a catalogue-grounded backend and add a typing indicator for that request.

## The `@bible-strong/avatar-react` runtime — not used (yet)

`@bible-strong/avatar-react@0.1.0` is on the public npm registry, but it is licensed
**AGPL-3.0-only**. Using it in this site could oblige publishing the site's source; that
needs a licensing decision before it is installed. It was therefore not added.

If it is approved, the swap is isolated to `SvaraMascot.tsx`'s `LiveMascot`:

```tsx
import { createAvatar } from "@bible-strong/avatar-react";
import "@bible-strong/avatar-react/styles.css";
import definition from "@/content/mascot.avatar.json";
const MascotRuntime = createAvatar(definition);
// <MascotRuntime animation={state} size={size} ariaLabel={label} onAnimationEnd={…} />
```

Note the package draws its own sphere-based body from `body.primary` / `body.nodes`; SVARA's
seed silhouette, moringa crest and gold details exist only in this repo's SVG renderer, so
adopting the package would need those added as body nodes or an overlay.
