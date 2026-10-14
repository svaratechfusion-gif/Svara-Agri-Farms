"use client";

import { useCallback, useState } from "react";

import { SectionHeader } from "@/components/editorial/SectionHeader";
import { MASCOT_STATES, mascotDefinition, type MascotState } from "@/lib/mascot/definition";

import { SvaraMascot } from "./SvaraMascot";

/** One-shot moods replay when chosen again; the rest hold until another is chosen. */
const ONE_SHOT: ReadonlySet<MascotState> = new Set([
  "welcome",
  "curious",
  "greeting",
  "excited",
  "goodbye",
]);

function label(state: MascotState): string {
  const meta = mascotDefinition.ok
    ? mascotDefinition.definition.animations[state]?.metadata
    : undefined;
  return meta?.label ?? state;
}

function description(state: MascotState): string {
  const meta = mascotDefinition.ok
    ? mascotDefinition.definition.animations[state]?.metadata
    : undefined;
  return meta?.description ?? "";
}

/**
 * Meet SVARA — the companion introduced at full size on a low sun, with each
 * of its moods one press away. A one-shot mood plays and settles back to idle.
 */
export function MeetSvara() {
  const [state, setState] = useState<MascotState>("idle");
  const [play, setPlay] = useState(0);

  const choose = (next: MascotState) => {
    setState(next);
    setPlay((count) => count + 1);
  };
  const handleEnd = useCallback((ended: MascotState) => {
    if (ONE_SHOT.has(ended)) setState("idle");
  }, []);

  return (
    <section aria-labelledby="meet-svara-heading" className="section-space bg-sun">
      <div className="container-page grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeader label="Our companion" />
          <h2 id="meet-svara-heading" className="mt-5 type-h1 text-forest">
            Meet SVARA, <em className="text-botanical italic">a seed with a sprout.</em>
          </h2>
          <p className="mt-6 max-w-md type-lead text-ink-soft">
            SVARA is the botanical companion of SVARA Farms — curious, gentle and never in a hurry.
            You&rsquo;ll find it in the corner of every page, ready to point you to the right place.
          </p>
          <p className="mt-8 type-label text-earth-ink" id="mascot-moods-label">
            Its moods
          </p>
          <ul aria-labelledby="mascot-moods-label" className="mt-4 flex flex-wrap gap-2">
            {MASCOT_STATES.map((mood) => (
              <li key={mood}>
                <button
                  type="button"
                  aria-pressed={state === mood}
                  onClick={() => choose(mood)}
                  className="leaf-chip"
                >
                  {label(mood)}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-6 min-h-[3lh] max-w-md type-small text-ink-soft" aria-live="polite">
            <span className="font-semibold text-forest">{label(state)}.</span> {description(state)}
          </p>
        </div>

        <div className="relative lg:col-span-6 lg:col-start-7">
          <div className="relative mx-auto grid aspect-square max-w-[30rem] place-items-center overflow-hidden leaf-plate bg-[radial-gradient(ellipse_70%_60%_at_50%_72%,rgb(232_200_120/0.55),rgb(197_161_90/0.16)_45%,var(--color-ivory-deep)_78%)]">
            <SvaraMascot
              key={ONE_SHOT.has(state) ? `${state}-${play}` : "steady"}
              state={state}
              size={260}
              ariaLabel={`SVARA, the SVARA Farms companion — ${label(state).toLowerCase()}`}
              onStateEnd={handleEnd}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
