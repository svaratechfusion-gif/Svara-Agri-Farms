import { EditorialImage } from "@/components/editorial/EditorialImage";
import { NoteBox } from "@/components/editorial/NoteBox";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { LeafCluster } from "@/components/botanical/LeafCluster";
import { LeafButton } from "@/components/ui/LeafButton";

/** How anything new will be made (Stitch 12 "pillars"), restated as intentions. */
const PRINCIPLES = [
  { number: "01", title: "From our land", body: "Only what we can grow and prepare ourselves." },
  { number: "02", title: "By hand", body: "The same care at every step, not a shortcut." },
  { number: "03", title: "In the shade", body: "Patience over speed, as with the leaf." },
  { number: "04", title: "When it is ready", body: "Shared in our field notes first." },
] as const;

/** 10 — The Future. Editorial, with no invented products. */
export function Future({ index = "10" }: { index?: string }) {
  return (
    <section aria-labelledby="future-heading" className="bg-ivory-deep section-space">
      <div className="container-page">
        <SectionHeader index={index} label="The Future" aside="In the fields, in time." />

        <div className="mt-14 grid-editorial gap-y-14 lg:mt-20">
          <div className="col-span-4 md:col-span-8 lg:col-span-6">
            <p className="type-label text-earth-ink">Future horizons · From the farm</p>
            <RevealHeading
              id="future-heading"
              className="mt-5 type-h1 text-forest"
              lines={[
                "More from",
                "the farm,",
                <em key="2" className="italic">
                  soon.
                </em>,
              ]}
            />
          </div>
          <div
            className="col-span-4 space-y-6 md:col-span-6 lg:col-span-5 lg:col-start-8 lg:self-end"
            data-reveal="fade"
          >
            <NoteBox label="Our premise" meta="Moringa first">
              <p className="type-lead text-ink">
                Moringa is where we begin. What comes next will grow the same way — slowly, from the
                land, with the same care at every step.
              </p>
            </NoteBox>
            <p className="type-body text-ink-soft">
              We would rather take our time than rush. When there is something new to share, you
              will read about it first in our field notes.
            </p>
            <LeafButton href="/field-notes" variant="outline" icon="arrow">
              Read the field notes
            </LeafButton>
          </div>
        </div>

        <div className="mt-16 grid-editorial items-start gap-y-10 lg:mt-24">
          <EditorialImage
            photo="herbariumNotebook"
            aspect="3 / 2"
            sizes="(min-width: 1024px) 50vw, 100vw"
            figureLabel="Fig. 10 — The field notebook"
            caption="Observation comes before everything else."
            tags={[{ text: "In the field notebook", position: "top-right" }]}
            frame="plate"
            botanical
            className="col-span-4 md:col-span-5 lg:col-span-6"
          />
          <EditorialImage
            photo="moringaBranch"
            aspect="4 / 5"
            frame="leaflet"
            sizes="(min-width: 1024px) 24vw, 40vw"
            className="col-span-2 md:col-span-3 lg:col-span-3 lg:col-start-8 lg:mt-24"
          />
          <EditorialImage
            photo="driedBotanicals"
            aspect="4 / 5"
            frame="plate-sm"
            sizes="(min-width: 1024px) 18vw, 40vw"
            className="col-span-2 md:col-span-3 md:col-start-6 lg:col-span-2 lg:col-start-11 lg:mt-48"
          />
        </div>

        <LeafCluster
          label="Four promises to the land"
          className="mt-24 lg:mt-32"
          centre={
            <>
              <p className="type-label text-earth-ink">How anything new will grow</p>
              <h3 className="mt-3 type-h2 text-forest">Four promises to the land.</h3>
            </>
          }
          items={PRINCIPLES.map((principle) => ({
            id: principle.number,
            content: (
              <>
                <p className="type-label text-earth-ink">{principle.number}</p>
                <h4 className="mt-2 type-h3">{principle.title}</h4>
                <p className="mt-2 type-small text-ink-soft">{principle.body}</p>
              </>
            ),
          }))}
        />
      </div>
    </section>
  );
}
