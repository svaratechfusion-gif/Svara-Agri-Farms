import { expect, test, type Page } from "@playwright/test";

const SECTION = 'section[aria-labelledby="range-heading"]';
const PACKS = [
  "Beetroot",
  "Carrot",
  "Apple",
  "Garlic",
  "Onion",
  "Ginger",
  "Neem",
  "Raw Banana",
  "Hibiscus Leaf",
  "Hibiscus Flower",
  "Amla",
];
const WIDTHS = [1440, 1200, 768, 390];
/** Artwork width range (px) per viewport width, from the brief. */
const ARTWORK: Record<number, [number, number]> = {
  1440: [380, 500],
  1200: [380, 500],
  768: [280, 360],
  390: [220, 300],
};

const section = (page: Page) => page.locator(SECTION);
const stops = (page: Page) =>
  page.getByRole("list", { name: "Also in the range." }).getByRole("listitem");

async function openHome(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem("svara:mascot-welcomed", "1"));
  await page.goto("/", { waitUntil: "networkidle" });
}

/** Scrolls the whole section past the reader, as a visitor would. */
async function scrollThrough(page: Page) {
  const { top, height } = await section(page).evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top + window.scrollY, height: rect.height };
  });
  const step = Math.round(page.viewportSize()!.height * 0.6);
  for (let y = top - 600; y < top + height; y += step) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(60);
  }
}

test("every product is on the roadmap, with labels and links from the catalogue", async ({
  page,
}) => {
  await openHome(page);
  const featured = section(page).getByRole("article", { name: "SVARA Moringa Powder" });
  await expect(featured.getByRole("img", { name: /SVARA Moringa/ })).toBeAttached();
  await expect(featured.getByRole("list", { name: "About this product" })).toContainText(
    "Available",
  );
  await expect(featured.getByRole("link", { name: "View product" })).toHaveAttribute(
    "href",
    "/products/moringa-powder",
  );

  await expect(stops(page)).toHaveCount(PACKS.length);
  for (const [index, name] of PACKS.entries()) {
    const stop = stops(page).nth(index);
    await expect(stop.getByRole("heading", { name: `${name} Powder` })).toBeAttached();
    await expect(
      stop.getByRole("img", { name: new RegExp(`SVARA ${name} Powder pouch`) }),
    ).toBeAttached();
    await expect(stop).toContainText("Available");
    await expect(stop).toContainText(String(index + 2).padStart(2, "0"));
  }
  // The roadmap is a journey, not a shop: no buttons, links or prices (the shop sells).
  const list = page.getByRole("list", { name: "Also in the range." });
  await expect(list.getByRole("button")).toHaveCount(0);
  await expect(list.getByRole("link")).toHaveCount(0);
  await expect(section(page).getByText(/₹|add to cart/i)).toHaveCount(0);

  // Every link in the section leads to a real page.
  const hrefs = await section(page)
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(new Set(hrefs)).toEqual(new Set(["/products/moringa-powder", "/shop", "/products"]));
  for (const href of new Set(hrefs)) {
    expect((await page.request.get(href!)).status()).toBe(200);
  }

  await featured.getByRole("link", { name: "View product" }).click();
  await page.waitForURL("**/products/moringa-powder");
});

for (const width of WIDTHS) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("balanced, never sideways, and nothing overlaps", async ({ page }) => {
      test.setTimeout(120_000); // a long section, scrolled the way a visitor would
      await openHome(page);
      await scrollThrough(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );

      const layout = await section(page).evaluate((root) => {
        const box = (el: Element) => el.getBoundingClientRect();
        const vein = box(root.querySelector(".roadmap-vein")!);
        const stops = Array.from(root.querySelectorAll(".milestone"), (stop) => ({
          side: stop.getAttribute("data-side"),
          art: box(stop.querySelector(".milestone__art")!),
          copy: box(stop.querySelector(".milestone__copy")!),
        }));
        const content = root.querySelector(".container-page")!.getBoundingClientRect();
        // Every piece of text and every control, pairwise.
        const pieces = Array.from(
          root.querySelectorAll("h2, h3, h4, p, a, .seed, .milestone__art"),
        ).filter((el) => !el.closest("a") || el.tagName === "A");
        const leaves = pieces.filter((el) => !pieces.some((o) => o !== el && el.contains(o)));
        const overlaps: string[] = [];
        leaves.forEach((a, i) =>
          leaves.slice(i + 1).forEach((b) => {
            const r = box(a);
            const s = box(b);
            const x = Math.min(r.right, s.right) - Math.max(r.left, s.left);
            const y = Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top);
            if (x > 1 && y > 1)
              overlaps.push(
                `${a.textContent?.trim().slice(0, 24)} × ${b.textContent?.trim().slice(0, 24)}`,
              );
          }),
        );
        return {
          veinCentre: vein.left + vein.width / 2,
          contentCentre: content.left + content.width / 2,
          stops: stops.map((s) => ({
            side: s.side,
            artCentre: s.art.left + s.art.width / 2,
            copyLeft: s.copy.left,
          })),
          overlaps,
        };
      });
      expect(layout.overlaps).toEqual([]);

      if (width >= 768) {
        // The vein runs down the middle; stops alternate either side of it.
        expect(Math.abs(layout.veinCentre - layout.contentCentre)).toBeLessThan(2);
        layout.stops.forEach((stop, index) => {
          expect(stop.side).toBe(index % 2 === 0 ? "left" : "right");
          if (stop.side === "left") expect(stop.artCentre).toBeLessThan(layout.veinCentre);
          else expect(stop.artCentre).toBeGreaterThan(layout.veinCentre);
        });
      } else {
        // One column: the vein beside the content, every stop's text aligned.
        layout.stops.forEach((stop) => expect(stop.artCentre).toBeGreaterThan(layout.veinCentre));
        expect(new Set(layout.stops.map((s) => Math.round(s.copyLeft))).size).toBe(1);
      }
    });

    test("each product's artwork is large", async ({ page }) => {
      await openHome(page);
      const [min, max] = ARTWORK[width];
      const sizes = await page
        .locator(".milestone__art")
        // Layout size: a scene that is not centred is drawn slightly receded.
        .evaluateAll((arts) => arts.map((art) => (art as HTMLElement).offsetWidth));
      sizes.forEach((size) => {
        expect(size).toBeGreaterThanOrEqual(min);
        expect(size).toBeLessThanOrEqual(max);
      });
      // Contained, never cropped or stretched.
      await expect(page.locator(".milestone__art img").first()).toHaveCSS("object-fit", "contain");
    });

    test("SVARA never covers the roadmap", async ({ page }) => {
      test.setTimeout(120_000); // a long section, scrolled the way a visitor would
      await openHome(page);
      const { top, height } = await section(page).evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return { top: rect.top + window.scrollY, height: rect.height };
      });
      const launcher = page.locator(".mascot-launcher");
      for (let y = top - 300; y < top + height - 400; y += 350) {
        await page.evaluate((to) => window.scrollTo(0, to), y);
        await page.waitForTimeout(650); // the companion's own fade
        const covered = await page.evaluate((selector) => {
          const companion = document.querySelector(".mascot-launcher")!;
          const style = getComputedStyle(companion.closest(".mascot-companion")!);
          if (style.visibility === "hidden" || Number(style.opacity) === 0) return [];
          const m = companion.getBoundingClientRect();
          return Array.from(document.querySelectorAll(`${selector} :is(h3, h4, p, a, .seed, img)`))
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.left < m.right && r.right > m.left && r.top < m.bottom && r.bottom > m.top;
            })
            .map((el) => el.textContent?.trim() || el.getAttribute("alt") || el.tagName);
        }, SECTION);
        expect(covered, `scrolled to ${y}`).toEqual([]);
      }
      // Below the desktop layout it steps aside here, and comes back after.
      if (width < 1024) {
        await section(page).evaluate((el) => el.scrollIntoView({ block: "center" }));
        await expect(page.locator(".mascot-companion")).toHaveClass(/mascot-companion--away/);
        await page.evaluate(({ t, h }) => window.scrollTo(0, t + h + 400), { t: top, h: height });
        await expect(page.locator(".mascot-companion")).not.toHaveClass(/mascot-companion--away/, {
          timeout: 10_000,
        });
      }
      await expect(launcher).toBeAttached();
    });
  });
}

test("one product at a time, in order, forwards and back — never hidden", async ({ page }) => {
  test.setTimeout(120_000); // a long section, scrolled the way a visitor would
  await openHome(page);
  const wide = page.viewportSize()!.width >= 1024;
  const scenes = page.locator(".milestone");
  const count = await scenes.count();
  const steps = await scenes.evaluateAll((all) =>
    all.map((el) => (el as HTMLElement).dataset.step),
  );
  let faintest = 1;

  const visit = async (index: number) => {
    await scenes.nth(index).evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect(scenes.nth(index)).toHaveAttribute("data-active", "");
    await page.waitForTimeout(wide ? 700 : 1100); // focus follows / arrival fade
    const seen = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>(".milestone")).map((scene) => {
        const art = scene.querySelector(".milestone__art")!;
        const rect = art.getBoundingClientRect();
        return {
          step: scene.dataset.step,
          opacity: Number(getComputedStyle(art).opacity),
          onScreen: rect.bottom > 0 && rect.top < window.innerHeight,
        };
      }),
    );
    seen.forEach((scene) => (faintest = Math.min(faintest, scene.opacity)));
    const current = seen[index];
    expect(current.opacity, `scene ${current.step}`).toBeGreaterThan(0.95);
    if (wide) {
      // The scene in the middle dominates; any neighbour on screen has receded.
      seen
        .filter((scene, other) => other !== index && scene.onScreen)
        .forEach((scene) => expect(scene.opacity, `scene ${scene.step}`).toBeLessThan(0.8));
    }
    return current.step;
  };

  const forward: (string | undefined)[] = [];
  for (let index = 0; index < count; index += 1) forward.push(await visit(index));
  expect(forward).toEqual(steps);
  const backward: (string | undefined)[] = [];
  for (let index = count - 1; index >= 0; index -= 1) backward.push(await visit(index));
  expect(backward).toEqual([...steps].reverse());
  // No product is ever faded out of reach.
  expect(faintest).toBeGreaterThanOrEqual(0.25);
  if (!wide) await expect(page.locator(".milestone:not([data-seen])")).toHaveCount(0);
});

test("one stop is active: the one in the middle of the screen", async ({ page }) => {
  await openHome(page);
  await scrollThrough(page);
  const target = stops(page).nth(4);
  await target.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await expect(target).toHaveAttribute("data-active", "");
  await expect(section(page).locator("[data-active]")).toHaveCount(1);
});

test("the vein draws itself down as the visitor scrolls, and back up", async ({ page }) => {
  await openHome(page);
  /** How much of the drawn vein is uncovered, from its clip (0–1). */
  const drawn = () =>
    page.locator(".roadmap-vein__drawn").evaluate((svg) => {
      const clip = getComputedStyle(svg).clipPath;
      const bottom = /inset\(\S+ \S+ ([\d.]+)%/.exec(clip);
      return bottom ? 1 - Number(bottom[1]) / 100 : 1;
    });
  await page.locator(".roadmap-route").evaluate((el) => el.scrollIntoView({ block: "start" }));
  // Partly drawn: begun, but well short of the end.
  await expect
    .poll(async () => {
      const d = await drawn();
      return d > 0 && d < 0.5;
    })
    .toBe(true);
  const early = await drawn();
  await page.locator(".roadmap-route").evaluate((el) => el.scrollIntoView({ block: "end" }));
  await expect.poll(drawn).toBeGreaterThan(early + 0.3);
  await page.locator(".roadmap-route").evaluate((el) => el.scrollIntoView({ block: "start" }));
  await expect.poll(drawn).toBeLessThan(0.5);
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("everything is simply in place: no movement, the vein fully drawn", async ({ page }) => {
    test.setTimeout(120_000); // a long section, scrolled the way a visitor would
    await openHome(page);
    await expect(section(page).locator(".roadmap")).not.toHaveAttribute("data-roadmap", "live");
    await scrollThrough(page);
    const state = await section(page).evaluate((root) => ({
      // Anything perceptible on the roadmap's own parts. The site's global
      // reduced-motion rule leaves 0.01 ms transitions, which are instant;
      // link and button hover feedback is site-wide.
      animations: Array.from(root.querySelectorAll(".roadmap *"))
        .filter((el) => !el.closest("a, button"))
        .flatMap((el) =>
          el
            .getAnimations()
            .filter((a) => Number(a.effect?.getTiming().duration ?? 0) > 1)
            .map(
              (a) =>
                `${el.getAttribute("class") ?? el.tagName}: ${(a as CSSTransition).transitionProperty ?? ""}`,
            ),
        ),
      minArt: Math.min(
        ...Array.from(root.querySelectorAll(".milestone__art"), (el) =>
          Number(getComputedStyle(el).opacity),
        ),
      ),
      clip: getComputedStyle(root.querySelector(".roadmap-vein__drawn")!).clipPath,
    }));
    expect(state).toEqual({ animations: [], minArt: 1, clip: "none" });
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the whole roadmap is visible", async ({ page }) => {
    await page.goto("/");
    await expect(stops(page)).toHaveCount(PACKS.length);
    const minArt = await section(page)
      .locator(".milestone__art")
      .evaluateAll((arts) => Math.min(...arts.map((a) => Number(getComputedStyle(a).opacity))));
    expect(minArt).toBe(1);
    await expect(section(page).getByRole("link", { name: "View product" })).toBeVisible();
  });
});
