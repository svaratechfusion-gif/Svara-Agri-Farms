import { LeafletMark } from "@/components/botanical/LeafletMark";
import { EditorialImage } from "@/components/editorial/EditorialImage";
import { STAGE_ICONS } from "@/components/ui/processIcons";
import type { JourneyStage as Stage } from "@/content/journey";

interface JourneyStageProps {
  stage: Stage;
  isActive: boolean;
  total: number;
}

/**
 * One chapter of the journey. On desktop it is text only (the image lives in
 * the sticky stage); on mobile it carries its own photograph.
 */
export function JourneyStage({ stage, isActive, total }: JourneyStageProps) {
  const StageIcon = STAGE_ICONS[stage.id as keyof typeof STAGE_ICONS];
  return (
    <li
      id={`stage-${stage.id}`}
      data-journey-stage
      data-active={isActive ? "" : undefined}
      className={`relative flex flex-col justify-center py-10 pl-10 transition-opacity duration-700 ease-[var(--ease-organic)] motion-safe:lg:min-h-[78vh] motion-safe:lg:py-0 motion-reduce:lg:pl-0`}
    >
      {stage.detailPhoto ? (
        <figure className="mb-8 motion-safe:lg:hidden">
          <div className="grid grid-cols-[2fr_3fr] gap-2">
            <EditorialImage
              photo={stage.detailPhoto}
              aspect="2 / 5"
              sizes="40vw"
              frame="plate-sm"
            />
            <EditorialImage photo={stage.photo} aspect="3 / 5" sizes="60vw" frame="plate-reverse" />
          </div>
          <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <span className="type-label text-earth-ink">Fig. 04.{stage.number}</span>
            <span className="type-caption text-ink-soft">{stage.caption}</span>
          </figcaption>
        </figure>
      ) : (
        <EditorialImage
          photo={stage.photo}
          aspect="4 / 5"
          sizes="100vw"
          frame={Number(stage.number) % 2 === 0 ? "plate-reverse" : "plate"}
          className="mb-8 motion-safe:lg:hidden"
          figureLabel={`Fig. 04.${stage.number}`}
          caption={stage.caption}
        />
      )}
      {/* The stage's leaflet on the midrib: filled once reached. */}
      <span
        aria-hidden="true"
        className={`absolute left-0 hidden motion-safe:lg:block ${
          isActive ? "text-forest" : "text-[color:var(--vein)]"
        }`}
      >
        <LeafletMark variant={isActive ? "filled" : "outline"} size={22} rotate={-35} />
      </span>
      <span
        aria-hidden="true"
        className="absolute top-12 left-0 text-botanical motion-safe:lg:hidden motion-reduce:lg:hidden"
      >
        <LeafletMark variant="filled" size={22} rotate={-35} />
      </span>
      {/* On desktop the copy arrives in sequence as the stage becomes active. */}
      <div>
        <p className="stage-seq flex items-center gap-4 type-label text-earth-ink">
          {StageIcon && (
            <span className="grid size-11 place-items-center rounded-full border border-[color:var(--vein)] bg-ivory text-botanical">
              <StageIcon size={22} />
            </span>
          )}
          <span className="tabular-nums">{stage.number}</span>
          <span aria-hidden="true">/</span>
          <span>{stage.title}</span>
          <span className="sr-only">
            — stage {Number(stage.number)} of {total}
          </span>
        </p>
        <h3 className="stage-seq mt-5 type-h1 text-forest">{stage.title}</h3>
        <p className="stage-seq mt-4 type-h3 text-ink italic">{stage.headline}</p>
        <p className="stage-seq mt-6 max-w-md type-body text-ink-soft">{stage.description}</p>
      </div>
    </li>
  );
}
