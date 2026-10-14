import Image from "next/image";
import type { CSSProperties } from "react";

import { CompareSlider } from "@/components/editorial/CompareSlider";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { AirflowIcon, HandLeafIcon, ShadeTrayIcon } from "@/components/ui/processIcons";
import { photos } from "@/content/photos";

/** The three disciplines of drying, in observable terms only. */
const DISCIPLINES = [
  {
    title: "Out of the sun",
    body: "The leaves rest in a shaded shelter, away from direct sunlight.",
    Icon: ShadeTrayIcon,
  },
  {
    title: "Air around every leaf",
    body: "Spread thinly across tiered trays so the air can move around them.",
    Icon: AirflowIcon,
  },
  {
    title: "Ready by touch",
    body: "Watched as they change from soft to crisp, and moved on only when ready.",
    Icon: HandLeafIcon,
  },
] as const;

const DRYING_RECORD = [
  { term: "Where", value: "An open-sided shelter" },
  { term: "How", value: "Slowly, in the shade" },
  { term: "Next", value: "The mill" },
] as const;

interface ShadeProps {
  index?: string;
}

/**
 * The Shade — the drying room as a dark, warm chapter. The shelter fills the
 * width; bands of filtered light cross it and slide with the scroll while the
 * photograph drifts more slowly behind them. Below, the fresh-to-dried
 * comparison (drag or arrow keys) and the three disciplines, each with its
 * process icon.
 */
export function Shade({ index = "06" }: ShadeProps) {
  const shelter = photos.shadeVeranda;
  return (
    <section
      aria-labelledby="shade-heading"
      data-surface="dark"
      className="bg-forest-deep pb-[var(--section-space)] text-ivory"
    >
      <div
        className="shade-room relative isolate h-[92svh] min-h-[34rem] overflow-hidden"
        data-parallax="0.1"
      >
        <div className="absolute inset-x-0 -inset-y-[10%] -z-20" data-parallax-target="">
          <Image
            src={shelter.src}
            alt={shelter.alt}
            fill
            sizes="100vw"
            className="object-cover object-[50%_45%]"
          />
        </div>
        <span aria-hidden="true" className="shade-room__light absolute -inset-[20%] -z-10" />
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(10_28_18/0.5)_0%,transparent_30%,rgb(10_28_18/0.15)_55%,var(--color-forest-deep)_100%)]"
        />
        <div className="container-page flex h-full flex-col justify-end pb-[clamp(2rem,6vh,4rem)]">
          <SectionHeader index={index} label="The Shade" tone="light" />
          <RevealHeading
            id="shade-heading"
            className="mt-5 max-w-3xl type-display text-ivory"
            lines={[
              "Preserved",
              <em key="1" className="text-harvest italic">
                by patience.
              </em>,
            ]}
          />
          <p className="mt-6 max-w-xl type-lead text-ivory/85" data-reveal="fade">
            After the harvest, the leaves move into the shade. Spread across trays where the air can
            move around them, they are left to dry slowly — away from direct sun, in their own time.
          </p>
        </div>
      </div>

      <div className="container-page">
        <CompareSlider
          before={{ photo: "shadePavilion", label: "Fresh, on the racks" }}
          after={{ photo: "leafDriedScatter", label: "Shade dried" }}
          label="Compare fresh leaves on the drying racks with shade-dried leaves"
          hint="Drag to see the change"
          sizes="(min-width: 1536px) 1408px, 100vw"
          tone="light"
          className="mt-16 lg:mt-24"
        />

        <ol className="mt-20 grid gap-10 md:grid-cols-3 md:gap-8 lg:mt-28" data-reveal="stagger">
          {DISCIPLINES.map(({ title, body, Icon }, position) => (
            <li
              key={title}
              className="relative border-t border-rule-light pt-8"
              style={{ "--i": position } as CSSProperties}
            >
              <span className="grid size-14 place-items-center rounded-full border border-harvest/50 text-harvest">
                <Icon size={26} />
              </span>
              <p className="mt-6 type-label text-harvest">0{position + 1}</p>
              <h3 className="mt-2 type-h3 text-ivory">{title}</h3>
              <p className="mt-3 max-w-xs type-body text-ivory/75">{body}</p>
            </li>
          ))}
        </ol>

        <dl className="mt-16 grid gap-px overflow-hidden leaf-plate-sm bg-ivory/15 sm:grid-cols-3">
          {DRYING_RECORD.map((row) => (
            <div key={row.term} className="bg-forest px-6 py-5">
              <dt className="type-label text-harvest">{row.term}</dt>
              <dd className="mt-2 type-h4 text-ivory">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
