import { Branch, Branches } from "@/components/botanical/Branches";
import { VeinDivider } from "@/components/botanical/VeinDivider";
import { Logo } from "@/components/brand/Logo";
import { EditorialImage } from "@/components/editorial/EditorialImage";
import { Folio } from "@/components/editorial/Folio";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { SectionHeader } from "@/components/editorial/SectionHeader";

/**
 * 02 — The Philosophy. The headline is the main stem; the two paragraphs and
 * the botanical record branch from a midrib beneath it, and the photograph
 * sits on a leaf plate across from them.
 */
export function Philosophy({ index = "02", total = "11" }: { index?: string; total?: string }) {
  return (
    <section aria-labelledby="philosophy-heading" className="section-space">
      <div className="container-page">
        <SectionHeader index={index} label="The Philosophy" aside="From farm to form." />

        <div className="mt-14 grid-editorial gap-y-14 lg:mt-24">
          <div className="col-span-4 md:col-span-8 lg:col-span-7">
            <RevealHeading
              id="philosophy-heading"
              className="type-h1 text-forest"
              lines={[
                "We don’t start",
                "with a product.",
                <em key="2" className="font-serif italic">
                  We start
                </em>,
                "with the land.",
              ]}
            />

            <Branches className="mt-12 space-y-8 lg:mt-16 lg:max-w-2xl">
              <Branch>
                <p className="type-lead">
                  Every SVARA product begins with what grows from the earth — carefully grown,
                  thoughtfully harvested and transformed with respect for the ingredient.
                </p>
              </Branch>
              <Branch flip>
                <p className="type-body text-ink-soft">
                  We work at the pace of the farm. The seasons decide when the trees are ready, and
                  our job is to listen — to tend the soil, gather by hand and take the time each
                  step deserves.
                </p>
              </Branch>
              <Branch>
                <dl className="grid gap-6 sm:grid-cols-2" data-reveal="stagger">
                  <div>
                    <dt className="type-label text-earth-ink">Botanical name</dt>
                    <dd className="mt-2 type-caption text-ink">Moringa oleifera</dd>
                  </div>
                  <div>
                    <dt className="type-label text-earth-ink">Our approach</dt>
                    <dd className="mt-2 type-small text-ink">
                      Grown on our farm. Gathered by hand. Dried in the shade.
                    </dd>
                  </div>
                </dl>
              </Branch>
            </Branches>

            <div className="mt-12 flex items-center gap-4 lg:max-w-2xl">
              <Logo size={28} decorative />
              <span className="type-label text-ink-soft">Nature. Nurture. Nourish.</span>
              <VeinDivider align="end" className="flex-1" />
            </div>
          </div>

          <div className="col-span-4 md:col-span-6 md:col-start-3 lg:col-span-5 lg:col-start-8 lg:pt-6">
            <EditorialImage
              photo="moringaBranch"
              aspect="4 / 5"
              sizes="(min-width: 1024px) 38vw, (min-width: 768px) 70vw, 100vw"
              figureLabel={`Fig. ${index} — Moringa branch`}
              caption="Fine leaflets and early blossom."
              frame="plate"
              botanical
              reveal="leaf"
            />
          </div>
        </div>

        <Folio
          title="SVARA Farms · The story of a leaf"
          marker={`Chapter ${index} of ${total}`}
          className="mt-20 lg:mt-28"
        />
      </div>
    </section>
  );
}
