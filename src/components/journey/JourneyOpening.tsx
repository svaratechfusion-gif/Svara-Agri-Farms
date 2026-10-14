import Image from "next/image";
import type { CSSProperties } from "react";

import { STAGE_ICONS, type StageIconId } from "@/components/ui/processIcons";
import { journeyStages } from "@/content/journey";
import { photos } from "@/content/photos";

const fade = (index: number) => ({ "--line": index }) as CSSProperties;

/**
 * The opening of /journey: the farm at golden hour, full width, drifting with
 * the scroll; the title rising on load; and the six stages laid out as a route
 * along one drawn vein — each stage a link straight to its scene below.
 */
export function JourneyOpening() {
  const image = photos.farmGoldenHour;
  return (
    <header
      data-header-overlay
      data-surface="dark"
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-forest-deep text-ivory"
      data-parallax="0.1"
    >
      <div className="absolute inset-x-0 -inset-y-[10%] -z-20" data-parallax-target="">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          preload
          placeholder="blur"
          sizes="100vw"
          className="object-cover object-[55%_50%]"
        />
      </div>
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(10_28_18/0.6)_0%,transparent_28%,transparent_45%,rgb(10_28_18/0.88)_100%)]"
      />

      <div className="container-page pt-[calc(var(--header-height)+4rem)] pb-[clamp(2.5rem,7vh,5rem)]">
        <p className="hero-fade type-label text-harvest" style={fade(0)}>
          The journey of a leaf
        </p>
        <h1 className="mt-5 max-w-4xl type-display text-ivory">
          <span className="hero-line">
            <span style={fade(0)}>Six stages,</span>
          </span>
          <span className="hero-line">
            <span style={fade(1)}>
              <em className="text-harvest italic">one leaf.</em>
            </span>
          </span>
        </h1>
        <p className="hero-fade mt-6 max-w-xl type-lead text-ivory/85" style={fade(2)}>
          Grow, harvest, select, shade dry, mill and pack — follow a single moringa leaf from the
          farm to the finished powder.
        </p>

        <nav aria-label="Jump to a stage" className="relative mt-12">
          <svg
            aria-hidden="true"
            viewBox="0 0 1200 40"
            preserveAspectRatio="none"
            className="journey-route__vein pointer-events-none absolute inset-x-[4%] top-[1.35rem] hidden h-8 w-[92%] md:block"
          >
            <path
              d="M0 22 C 150 4, 260 36, 400 20 S 650 6, 800 22 S 1060 36, 1200 16"
              pathLength={1}
              fill="none"
              stroke="rgb(197 161 90 / 0.7)"
              strokeWidth={1.2}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <ol className="relative grid grid-cols-3 gap-x-4 gap-y-6 md:grid-cols-6">
            {journeyStages.map((stage, index) => {
              const Icon = STAGE_ICONS[stage.id as StageIconId];
              return (
                <li key={stage.id} className="hero-fade" style={fade(3 + index * 0.6)}>
                  <a
                    href={`#stage-${stage.id}`}
                    className="group flex flex-col items-center gap-3 text-center"
                  >
                    <span className="grid size-12 place-items-center rounded-full border border-harvest/60 bg-forest-deep/70 text-harvest backdrop-blur-sm transition-[background-color,color,transform] duration-500 group-hover:-translate-y-1 group-hover:bg-harvest group-hover:text-forest-deep group-focus-visible:bg-harvest group-focus-visible:text-forest-deep">
                      {Icon && <Icon size={22} />}
                    </span>
                    <span className="type-label text-ivory/90">
                      <span className="text-harvest">{stage.number}</span> {stage.title}
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </header>
  );
}
