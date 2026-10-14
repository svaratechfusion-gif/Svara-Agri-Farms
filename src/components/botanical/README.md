# SVARA botanical design language

**A website that grows like a leaf.** The moringa leaf is the structure of the
site, not a decoration on it. It is a compound leaf: one stem (the rachis), paired
leaflets along it, a fine midrib in each leaflet, and secondary veins branching
forward. Every primitive below comes from that structure.

| Leaf             | On the site                                                    |
| ---------------- | -------------------------------------------------------------- |
| Stem / midrib    | The headline and the main line of a composition                |
| Secondary veins  | Supporting text, connected to the main line by short hairlines |
| Leaflets         | Markers, stages, small images, the state of a control          |
| Leaflet outline  | Every organic shape: buttons, plates, chips, seeds             |
| Field annotation | Mono metadata (chapter numbers, figure labels, tags)           |

## Rules

1. **One curve family.** Each shape has two broad _shoulders_ and two nearly sharp
   _tips_ on opposite corners. Only the scale changes. Nothing is heart-shaped,
   and no shape is pointed on every corner.
2. **Restraint.** Hairlines use `--vein` (forest at 28%). Leaflets are `botanical`
   on ivory and `harvest` on forest or photography. Leave whitespace empty.
3. **Never over the subject.** Tags sit on a plate's _tips_, away from its
   shoulders, and never on the leaf in The Leaf plate.
4. **State never depends on colour alone.** Filled leaflet = reached, larger
   filled leaflet = current, outline = upcoming.
5. **Motion is optional.** A vein can draw itself, a plate can unfold
   (`data-reveal="leaf"`), and a button's light can pass once on hover. Nothing
   loops, and reduced motion removes all of it. Progress indicators still update
   without motion, because they carry information.

## Geometry (CSS — `src/styles/botanical.css`, `src/styles/leaf-buttons.css`)

| Primitive       | Class                                  | Use                                     |
| --------------- | -------------------------------------- | --------------------------------------- |
| Long leaf       | `leaf-btn` (via `LeafButton`)          | Every action                            |
| Leaf plate      | `leaf-plate`, `leaf-plate-reverse`     | Photographs, feature panels             |
| Small plate     | `leaf-plate-sm`                        | Thumbnails, cards, inset images         |
| Leaflet         | `leaflet`                              | Small inset photographs                 |
| Seed form       | `seed`                                 | Metadata tags, image tags, categories   |
| Botanical frame | `botanical-frame` (with a plate class) | Offset harvest hairline behind a plate  |
| Leaf chip       | `leaf-chip`                            | Filters and selectable stages           |
| Midrib list     | `midrib-list`                          | A vertical vein down a list's left edge |
| Stem            | `.stem` (via `Stem`) + `.branch-node`  | A page-long margin vein (Our Story)     |

Shape utilities set `--frame-radius`. A nested `.media-frame` inherits it, so
`<div class="leaf-plate"><div class="media-frame">` clips the photograph to the plate.

## Graphics and compositions (`src/components/botanical/`)

| Component           | What it draws                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `geometry.ts`       | The leaflet path (obovate: narrow base, rounded tip), midrib, veins                         |
| `LeafletMark`       | One leaflet: `filled`, `outline` or `veined`                                                |
| `VeinDivider`       | Midrib with forked secondary veins and a leaflet or label at its node                       |
| `VeinProgress`      | Stages as leaflets on one vein; live `--progress` trace; buttons optional; stacks on phones |
| `VeinRow`           | Items hanging from one horizontal vein                                                      |
| `Branches`/`Branch` | Content branching from a vertical midrib                                                    |
| `LeafCluster`       | Ideas alternating either side of one stem                                                   |
| `AnnotationStem`    | Field note → headline vein on photography                                                   |
| `HeroFrame`         | Hairline leaf plate inset over full-bleed photography, with seeds                           |
| `MoringaLeaf`       | Line drawing of the compound leaf (`drawing`, `fallen`), numbered callouts                  |
| `IngredientDiagram` | The product's botanical plate: the leaf with its parts named                                |
| `ReadingVein`       | Article reading progress as a growing vein with a leaflet tip                               |
| `Stem`              | Wrapper that draws the page-long margin vein                                                |

## Buttons (`src/components/ui/LeafButton.tsx`)

| Variant           | API                               | Use                                  |
| ----------------- | --------------------------------- | ------------------------------------ |
| Primary           | `<LeafButton>`                    | Add to cart, Discover, primary paths |
| Secondary         | `variant="secondary"`             | Buy now, alternatives                |
| Outline           | `variant="outline"`               | Understated actions                  |
| Compact           | `size="sm"` (44px minimum target) | Dense rows, toolbars                 |
| Large             | `size="lg"`                       | Purchase actions                     |
| Textual leaf link | `<LeafLink>`                      | Editorial links                      |
| Icon-only control | `<LeafIconButton label icon>`     | Previous/next, compact controls      |

On any `[data-surface="dark"]` ancestor, buttons switch to their light treatment
automatically. Disabled, loading (`loading`), focus-visible and reduced-motion
states are built in.

## Motion and 3D (Phase 5)

All motion runs on the existing single scroll loop (`src/lib/motion/scrollProgress.ts`,
`--progress` 0–1) and MotionRoot's one-shot reveals. Choreography lives in
`src/styles/motion.css`. No animation or smooth-scroll library is used, and scrolling
is always native.

| Piece           | Where                                            | Behaviour                                                         |
| --------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| Header entrance | `.header-enter` (SiteHeader)                     | Seal fades and scales in, vein grows outward, items rise in turn  |
| Botanical nav   | `BotanicalNavLink`                               | Vein underline draws on hover/focus; active page holds a leaflet  |
| Header compact  | `SiteHeader`                                     | Bar height ×0.8 and seal scale 0.84 on ivory after scrolling      |
| Menu stagger    | `.menu-item`, `.menu-leaf`                       | Items rise along the midrib; a large leaf drawing unfurls behind  |
| Stem growth     | `data-reveal="stem"` (`Branches`, `LeafCluster`) | Stem grows downward, branches follow in order                     |
| Chapter vein    | `ChapterVein` (homepage, xl)                     | 11 leaflets on one vein; traced to the current chapter; buttons   |
| Leaflet field   | `LeafletField` (Canvas 2D)                       | A few drifting leaflets; pointer-aware; paused off-screen         |
| Tilt stage      | `TiltStage`                                      | ≤4° pointer tilt + contact shadow; optional scroll rise           |
| Floating leaf   | `FloatingLeaf` (The Leaf)                        | 2.5D layered cutout: cast shadow, perspective, organic-mask entry |
| Journey line    | `JourneyVein`, `VerticalVein`                    | Bowed midrib drawn by scroll; leaflet stage buttons; branches     |
| Product reveal  | `ProductStage` (The Product)                     | Layered cutouts: forest plate, branch framing, pouch settling     |
| Ingredient flow | `IngredientFlowDivider` (`data-reveal="flow"`)   | Powder splash fades in along its flow; ≤3.5% scroll drift         |

**No 3D models.** The phase 5 procedural WebGL leaf was replaced by real photographic
cutouts (`src/content/cutouts.ts`, verified alpha), and `three` was removed. The floating
leaf and the product reveal are **layered 2.5D image treatments**:

- a cast shadow made from the leaf's own silhouette;
- perspective transforms of a few degrees;
- background layers moving at different rates;
- organic `clip-path` masks on entry.

All of it is keyed to the real scroll position. Motion tempo comes from the
`--motion-*` tokens in `styles/motion.css`.

**Reduced motion:** no particles, parallax, tilt, scroll rise, stagger or unfolding
reveals. Every element is visible in place. Progress indicators (journey, chapters,
reading) still update, because they carry information.

## Ingredient flow dividers

`IngredientFlowDivider` marks a narrative turn with an ingredient's own powder
splash, centred between two sections at a standard height of about a third of
a desktop viewport. It is purely decorative: `aria-hidden`, `alt=""` and
`pointer-events: none`.

- **Artwork:** `flowArt` in `src/content/ingredientFlows.ts`. These are the
  supplied splashes, alpha-checked (no checkerboard), only trimmed and
  re-encoded as WebP. Moringa reuses the existing `powder-swoosh` cutout.
  - The splashes run diagonally at about 35–40°.
  - On the page each is rotated in CSS to within 6° of level, so it reads as
    a sweep rather than a tall square.
  - Each file's `level` numbers are measured from its alpha. They centre the
    levelled sweep in its frame, so asymmetrical art still sits centred.
- **Size:** height leads, and width follows from the artwork's shape (about
  1.8–2.1 : 1).
  - About 160px tall on phones, 225px at 768, 300px at 1200 and 340–375px at
    1440 and up (`--flow-h` in `src/styles/flow.css`).
  - Width is capped at 92vw and 80rem; a capped frame shrinks evenly, so it is
    never stretched.
- **Band:** spans the page so its background can blend the two neighbours.
  - It breaks out of containers and clips horizontally, so it never scrolls
    sideways, even with a space-taking scrollbar.
  - `overlap` lets the art reach a little (a share of `--section-space`) into
    the neighbours' padding, set from the free space measured in the browser.
  - The e2e check fails if the art meets text or a control.
- **Placements:** `flowPlacements` in the same file. Amla and garlic are
  registered but not yet placed.
- **Motion:** MotionRoot reveal (opacity 0.4 → 1 only, so the art never leaves
  its centred bounds) plus a 2% scroll drift.
  - The art is visible even if the reveal never runs.
  - Both effects are off with reduced motion.
