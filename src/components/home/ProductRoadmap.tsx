"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { CutoutImage } from "@/components/botanical/CutoutImage";
import { LeafletMark } from "@/components/botanical/LeafletMark";
import { LeafButton, LeafLink } from "@/components/ui/LeafButton";
import type { Milestone, Roadmap } from "@/lib/commerce/roadmap";
import { observeScrollProgress, prefersReducedMotion } from "@/lib/motion/scrollProgress";
import { useScrollProgress } from "@/lib/motion/useScrollProgress";

/** Where along the viewport the vein has "reached" as the visitor scrolls. */
const DRAW_LINE = 0.72;
/** Below the desktop layout, each scene settles once this far into the viewport. */
const SEEN_MARGIN = "0px 0px -8% 0px";
/** Desktop: each scene's focus follows its own scroll position (no pinning). */
const SCENE_QUERY = "(min-width: 64rem)";

/** A gently winding vein, one sway per scene, drawn in a 48 × 1000 box. */
function veinPath(stops: number): string {
  const step = 1000 / stops;
  let d = "M24 0";
  for (let index = 0; index < stops; index += 1) {
    const sway = index % 2 === 0 ? 14 : -14;
    const top = index * step;
    d += ` C ${24 + sway} ${top + step * 0.3}, ${24 + sway} ${top + step * 0.7}, 24 ${top + step}`;
  }
  return d;
}

function MilestoneScene({ milestone }: { milestone: Milestone }) {
  const style = { "--scale": milestone.scale } as CSSProperties;
  return (
    <li
      className="milestone"
      data-milestone=""
      data-step={milestone.step}
      data-side={milestone.side}
      data-tone={milestone.tone}
      style={style}
    >
      <span aria-hidden="true" className="milestone__marker">
        <LeafletMark variant="filled" size={22} rotate={milestone.side === "left" ? -35 : 215} />
      </span>
      <div className="milestone__art">
        <span aria-hidden="true" className="milestone__arc" />
        <div className="milestone__pack relative" style={{ aspectRatio: "1400 / 1105" }}>
          <Image
            src={milestone.image}
            alt={milestone.alt}
            fill
            placeholder="blur"
            sizes="(min-width: 64rem) 31rem, (min-width: 48rem) 22rem, 19rem"
            className="object-contain object-bottom drop-shadow-[0_22px_22px_rgb(24_32_25/0.18)]"
          />
        </div>
      </div>
      <div className="milestone__copy">
        <p className="type-label text-earth-ink">
          <span className="sr-only">Stop </span>
          {milestone.step}
        </p>
        <h4 className="mt-2 type-h3 text-forest">{milestone.name}</h4>
        <p className="mt-2 type-body text-ink-soft">{milestone.ingredient}</p>
        <p className="mt-4 seed bg-ivory-deep text-earth-ink">{milestone.status}</p>
      </div>
    </li>
  );
}

/**
 * The homepage products as one botanical journey: SVARA Moringa Powder opens
 * it, then every pack in preparation follows as its own scene, its large
 * artwork alternating either side of a fine vein that draws itself down.
 *
 * Desktop: each scene is about a screen tall and its focus follows its own
 * scroll position through the shared scroll loop — the scene in the middle
 * of the screen is sharp, the one leaving recedes to its side, the next
 * arrives from the other. One product at a time, with native scrolling
 * (nothing is pinned), so wheel, trackpad, touch, keyboard and scrolling
 * back all just work. Smaller screens reveal each scene as it arrives.
 *
 * Motion only ever adds to content that is already there: without scripting,
 * with reduced motion, or before this hydrates, every scene is in place and
 * the vein is fully drawn.
 */
export function ProductRoadmap({ roadmap }: { roadmap: Roadmap }) {
  const { featured, milestones, widerOrderable } = roadmap;
  const rootRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<HTMLDivElement>(null);
  const active = useRef<HTMLElement | null>(null);

  // The vein follows the reader down the route.
  useScrollProgress(routeRef, { mode: "anchor", anchor: DRAW_LINE });

  // The scene nearest the middle of the screen is the active one, shown on
  // its marker and the journey counter. A colour change only, so it runs
  // with reduced motion too.
  const [here, setHere] = useState<string | null>(null);
  const pickActive = useCallback((progress: number) => {
    const root = rootRef.current;
    if (!root) return;
    let next: HTMLElement | null = null;
    if (progress > 0 && progress < 1) {
      const middle = window.innerHeight / 2;
      let nearest = Infinity;
      root.querySelectorAll<HTMLElement>("[data-milestone]").forEach((stop) => {
        const rect = stop.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - middle);
        if (distance < nearest) {
          nearest = distance;
          next = stop;
        }
      });
    }
    if (next === active.current) return;
    active.current?.removeAttribute("data-active");
    const current = next as HTMLElement | null;
    current?.setAttribute("data-active", "");
    active.current = current;
    setHere(current?.dataset.step ?? null);
  }, []);
  useScrollProgress(rootRef, { mode: "through", onProgress: pickActive, essential: true });

  // Desktop scenes: each one's focus follows its own pass through the screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;
    const wide = window.matchMedia(SCENE_QUERY);
    let stops: Array<() => void> = [];
    const apply = () => {
      stops.forEach((stop) => stop());
      stops = wide.matches
        ? Array.from(root.querySelectorAll<HTMLElement>(".milestone"), (scene) =>
            observeScrollProgress(scene, { mode: "through" }),
          )
        : [];
    };
    apply();
    wide.addEventListener("change", apply);
    return () => {
      wide.removeEventListener("change", apply);
      stops.forEach((stop) => stop());
    };
  }, []);

  // Gentle arrival: each stop settles in once, the first time it is reached.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;
    const observer = new IntersectionObserver(
      (records) =>
        records.forEach((record) => {
          if (!record.isIntersecting) return;
          record.target.setAttribute("data-seen", "");
          observer.unobserve(record.target);
        }),
      { rootMargin: SEEN_MARGIN },
    );
    root.querySelectorAll("[data-milestone]").forEach((stop) => observer.observe(stop));
    root.setAttribute("data-roadmap", "live");
    return () => {
      observer.disconnect();
      root.removeAttribute("data-roadmap");
    };
  }, []);

  const path = veinPath(milestones.length + 1);

  return (
    <div
      ref={rootRef}
      className="roadmap"
      // Products and their links: SVARA steps aside on small screens here.
      data-mascot-clear=""
    >
      <article
        className="roadmap-featured"
        data-milestone=""
        aria-labelledby="roadmap-featured-name"
      >
        <div className="roadmap-featured__art">
          <span aria-hidden="true" className="roadmap-featured__sun" />
          <div aria-hidden="true" className="roadmap-featured__powder">
            <CutoutImage cutout="powderMound" decorative sizes="(min-width: 64rem) 16vw, 36vw" />
          </div>
          <div className="roadmap-featured__pouch">
            <span aria-hidden="true" className="roadmap-featured__shadow" />
            <CutoutImage
              cutout="svaraPouch"
              sizes="(min-width: 64rem) 24vw, 52vw"
              className="mx-auto h-full max-w-full"
              imageClassName="drop-shadow-[0_24px_24px_rgb(24_32_25/0.22)]"
            />
          </div>
        </div>
        <div className="roadmap-featured__copy">
          <p className="type-label text-earth-ink">{featured.step} · Where the journey begins</p>
          <h3 id="roadmap-featured-name" className="mt-4 type-h2 text-forest">
            {featured.name}
          </h3>
          <p className="mt-5 max-w-md type-lead text-ink-soft">{featured.tagline}</p>
          <ul aria-label="About this product" className="mt-6 flex flex-wrap items-center gap-3">
            <li className="seed bg-ivory-deep text-earth-ink">{featured.botanicalName}</li>
            {featured.availability.map((label) => (
              <li key={label} className="seed bg-forest text-ivory">
                {label}
              </li>
            ))}
            {featured.sizesProvisional && (
              <li className="seed bg-ivory-deep text-earth-ink">Sizes to be confirmed</li>
            )}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <LeafButton href={featured.href} icon="arrow" size="lg">
              View product
            </LeafButton>
            <LeafLink href="/shop">Visit the shop</LeafLink>
          </div>
        </div>
      </article>

      <div className="roadmap-intro">
        <p className="type-label text-earth-ink">The wider range</p>
        <h3 id="range-preview-heading" className="mt-3 type-h2 text-forest">
          {widerOrderable ? "Also in the range." : "Also in preparation."}
        </h3>
        <p className="mt-4 type-small text-ink-soft">
          {widerOrderable
            ? "Each pack can be ordered from the shop — choose a size and add it to your cart."
            : "Packs we are preparing. Sizes, prices and availability will be shared when they are ready."}
        </p>
        <LeafLink href="/products" className="mt-5">
          All products
        </LeafLink>
      </div>

      <div ref={routeRef} className="roadmap-route">
        {/* The vein: a faint full path, and the drawn path over it, uncovered
            from the top as the visitor scrolls (a clip, since dash-drawing
            does not combine with a non-scaling stroke). */}
        <div aria-hidden="true" className="roadmap-vein">
          <svg viewBox="0 0 48 1000" preserveAspectRatio="none" className="roadmap-vein__svg">
            <path d={path} className="roadmap-vein__ghost" />
          </svg>
          <svg
            viewBox="0 0 48 1000"
            preserveAspectRatio="none"
            className="roadmap-vein__svg roadmap-vein__drawn"
          >
            <path d={path} className="roadmap-vein__line" />
          </svg>
        </div>
        <span aria-hidden="true" className="roadmap-bud">
          <LeafletMark variant="filled" size={16} rotate={-90} />
        </span>
        {/* Where the visitor is on the journey (desktop; the headings carry it for assistive tech). */}
        <div aria-hidden="true" className="roadmap-progress" data-visible={here ? "" : undefined}>
          <span className="roadmap-progress__pill">
            <span className="text-forest">{here ?? milestones[0].step}</span>
            <span className="text-ink-soft"> / {milestones.at(-1)?.step}</span>
          </span>
        </div>

        <ol aria-labelledby="range-preview-heading" className="roadmap-list">
          {milestones.map((milestone) => (
            <MilestoneScene key={milestone.id} milestone={milestone} />
          ))}
        </ol>
      </div>
    </div>
  );
}
