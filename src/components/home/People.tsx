import { RevealHeading } from "@/components/editorial/RevealHeading";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { GestureStory, type Gesture } from "@/components/page/GestureStory";

/** The harvest as three gestures, each with its own scene. */
const GESTURES: readonly Gesture[] = [
  {
    title: "Plucked by hand",
    body: "Leaves are taken from the branch one handful at a time.",
    photo: "harvestRows",
    origin: "34% 46%",
  },
  {
    title: "Carried in baskets",
    body: "Woven baskets move the harvest from the trees to the table.",
    photo: "farmPathBasket",
    origin: "52% 22%",
  },
  {
    title: "Sorted on cloth",
    body: "Each handful is looked over before it moves into the shade.",
    photo: "sortingLeaves",
    origin: "48% 56%",
  },
];

interface PeopleProps {
  index?: string;
}

/**
 * The People. The harvest told as three gestures against one held frame:
 * each gesture's scene opens over the last from the hands (GestureStory).
 */
export function People({ index = "05" }: PeopleProps) {
  return (
    <section aria-labelledby="people-heading">
      <GestureStory
        tone="deep"
        gestures={GESTURES}
        intro={
          <>
            <SectionHeader index={index} label="The People" />
            <RevealHeading
              id="people-heading"
              className="mt-5 type-h1 text-forest"
              lines={[
                "Behind every harvest",
                <em key="1" className="text-botanical italic">
                  are human hands.
                </em>,
              ]}
            />
            <p className="mt-6 max-w-md type-lead text-ink-soft">
              Every leaf that becomes SVARA Moringa Powder passes through human hands. It is patient
              work, done at the pace of the morning.
            </p>
          </>
        }
      />
    </section>
  );
}
