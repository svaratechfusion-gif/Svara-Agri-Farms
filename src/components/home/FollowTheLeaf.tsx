import { PathIndex } from "@/components/editorial/PathIndex";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { JourneyExperience } from "@/components/journey/JourneyExperience";
import { journeyStages } from "@/content/journey";

/** The three constants of the journey (Stitch 04 band), stated as practice, not data. */
const CONSTANTS = [
  {
    label: "By hand",
    title: "Gathered by hand",
    body: "Every leaf is plucked, carried and sorted by people, not machines.",
  },
  {
    label: "In the shade",
    title: "Dried in the shade",
    body: "Spread on trays in an airy shelter, away from direct sun.",
  },
  {
    label: "With care",
    title: "Milled with care",
    body: "Only leaves that are ready move on to become powder.",
  },
] as const;

interface FollowTheLeafProps {
  index?: string;
  headingLevel?: "h1" | "h2";
}

/** 04 — Follow the Leaf. Shared by the homepage and /journey. */
export function FollowTheLeaf({ index = "04", headingLevel = "h2" }: FollowTheLeafProps) {
  const Heading = headingLevel;
  return (
    <section aria-labelledby="journey-heading">
      <div className="container-page pt-[var(--section-space)] pb-16 lg:pb-24">
        <SectionHeader index={index} label="The Journey of a Leaf" aside="The chronicle." />
        <div className="mt-14 grid-editorial gap-y-10 lg:mt-20">
          <div className="col-span-4 md:col-span-8 lg:col-span-7">
            <RevealHeading
              as={Heading}
              id="journey-heading"
              className="type-h1 text-forest"
              lines={["Follow the leaf."]}
            />
            <p className="mt-5 type-h3 text-ink-soft italic" data-reveal="fade">
              From the farm to the finished product.
            </p>
          </div>
          <div className="col-span-4 md:col-span-8 lg:col-span-5 lg:self-end" data-reveal="fade">
            <PathIndex className="bg-ivory-deep px-4 py-3" />
          </div>
        </div>
        <div className="mt-10 lg:mt-8">
          <JourneyExperience stages={journeyStages} />
        </div>
      </div>

      <div className="container-page pb-[var(--section-space)]">
        <ul className="grid gap-10 border-t hairline pt-10 md:grid-cols-3" data-reveal="stagger">
          {CONSTANTS.map((constant) => (
            <li key={constant.label}>
              <p className="type-label text-earth-ink">{constant.label}</p>
              <h3 className="mt-3 type-h3 text-forest">{constant.title}</h3>
              <p className="mt-3 max-w-xs type-small text-ink-soft">{constant.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
