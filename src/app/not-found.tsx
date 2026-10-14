import { MoringaLeaf } from "@/components/botanical/MoringaLeaf";
import { VeinDivider } from "@/components/botanical/VeinDivider";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { LeafButton, LeafLink } from "@/components/ui/LeafButton";

/**
 * 404 — a single moringa leaf with one leaflet come loose and resting below:
 * a quiet picture of "this is not where you meant to be".
 */
export default function NotFound() {
  return (
    <div className="bg-sun">
      <div className="container-page pt-[calc(var(--header-height)+clamp(3rem,8vw,7rem))] pb-[var(--section-space)]">
        <SectionHeader label="404 · Not found" />
        <div className="mt-12 grid-editorial items-center gap-y-14 lg:mt-16">
          <div className="col-span-4 md:col-span-5 lg:col-span-7">
            <RevealHeading
              as="h1"
              trigger="load"
              className="type-h1 text-forest"
              lines={[
                "This path leads",
                <em key="1" className="italic">
                  off the farm.
                </em>,
              ]}
            />
            <p className="mt-8 max-w-md type-lead">
              The page you were looking for isn&rsquo;t here — like a leaflet that has come loose
              from its stem. Let us take you back to the beginning.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <LeafButton href="/" icon="arrow">
                Return home
              </LeafButton>
              <LeafLink href="/journey">Follow the leaf</LeafLink>
            </div>
          </div>
          <figure className="col-span-4 md:col-span-3 lg:col-span-4 lg:col-start-9">
            <div className="mx-auto max-w-xs leaf-plate bg-ivory-deep px-10 pt-10 pb-14 text-forest">
              <MoringaLeaf variant="fallen" />
            </div>
            <figcaption className="mt-5 text-center type-caption text-ink-soft">
              One leaflet, off its stem.
            </figcaption>
          </figure>
        </div>
        <VeinDivider className="mt-20 lg:mt-28" />
        <MotionRoot />
      </div>
    </div>
  );
}
