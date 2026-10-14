import { expect, test, type Page } from "@playwright/test";

/** Where each ingredient flow divider is placed, in page order. */
const PLACEMENTS: Record<string, string[]> = {
  "/": ["moringa", "beetroot"],
  "/products": ["carrot"],
  "/products/moringa-powder": ["apple"],
  "/shop": ["ginger"],
  "/our-story": ["hibiscus"],
};

const TEXT_AND_CONTROLS = "h1, h2, h3, h4, p, a, button, input, select, label, li";

/**
 * Text and controls whose box meets a divider's artwork box. Fixed UI (the
 * header, SVARA, the chapter rail) floats over everything and is skipped.
 */
async function obstructed(page: Page): Promise<string[]> {
  return page.evaluate((selector) => {
    const isFixed = (element: Element) => {
      for (let node: Element | null = element; node; node = node.parentElement) {
        const position = getComputedStyle(node).position;
        if (position === "fixed" || position === "sticky") return true;
      }
      return false;
    };
    const found: string[] = [];
    document.querySelectorAll("[data-flow]").forEach((divider) => {
      const art = divider.querySelector("[data-flow-art]")!.getBoundingClientRect();
      document.querySelectorAll(selector).forEach((element) => {
        if (divider.contains(element) || isFixed(element)) return;
        const box = element.getBoundingClientRect();
        if (!box.width || !box.height) return;
        const meets =
          box.left < art.right &&
          box.right > art.left &&
          box.top < art.bottom &&
          box.bottom > art.top;
        if (meets) found.push(`${divider.getAttribute("data-flow")} → ${element.tagName}`);
      });
    });
    return found;
  }, TEXT_AND_CONTROLS);
}

for (const [route, ingredients] of Object.entries(PLACEMENTS)) {
  test(`${route} places its ingredient flows as decoration only`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    const dividers = page.locator("[data-flow]");
    await expect(dividers).toHaveCount(ingredients.length);
    expect(
      await dividers.evaluateAll((all) => all.map((el) => el.getAttribute("data-flow"))),
    ).toEqual(ingredients);

    for (const divider of await dividers.all()) {
      await expect(divider).toHaveAttribute("aria-hidden", "true");
      await expect(divider.locator("img")).toHaveAttribute("alt", "");
      await expect(divider.locator("img")).toHaveAttribute("loading", "lazy");
      expect(await divider.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");
    }
    // Nothing a reader can focus or read lives inside a divider.
    await expect(
      page.locator("[data-flow] a, [data-flow] button, [data-flow] [tabindex]"),
    ).toHaveCount(0);
    expect(await obstructed(page)).toEqual([]);
  });
}

test("a click on the artwork reaches whatever lies beneath it", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const art = page.locator("[data-flow='beetroot'] [data-flow-art]");
  await art.scrollIntoViewIfNeeded();
  const hit = await art.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return top ? top.closest("[data-flow]") === null : true;
  });
  expect(hit).toBe(true);
});

/** Target artwork height (px) at each tested width — about a third of a desktop viewport. */
const HEIGHT_RANGE: Record<number, [number, number]> = {
  1440: [300, 380],
  1200: [260, 340],
  768: [220, 280],
  390: [150, 210],
};

/**
 * Every divider's artwork is centred on the page, within the standard height
 * range for this width, and never wider than the page.
 */
async function standardAndCentred(page: Page): Promise<string[]> {
  const width = page.viewportSize()!.width;
  const [min, max] = HEIGHT_RANGE[width];
  return page.evaluate(
    ([min, max]) => {
      const pageBox = document.body.getBoundingClientRect();
      const centre = pageBox.left + pageBox.width / 2;
      const misses: string[] = [];
      document.querySelectorAll("[data-flow]").forEach((divider) => {
        const name = divider.getAttribute("data-flow");
        const frame = divider.querySelector("[data-flow-art]")!.getBoundingClientRect();
        const offset = frame.left + frame.width / 2 - centre;
        if (Math.abs(offset) > 1) misses.push(`${name} off-centre by ${Math.round(offset)}px`);
        if (frame.height < min || frame.height > max)
          misses.push(`${name} is ${Math.round(frame.height)}px tall`);
        if (frame.left < pageBox.left || frame.right > pageBox.right)
          misses.push(`${name} is wider than the page`);
      });
      return misses;
    },
    [min, max],
  );
}

for (const viewport of [
  { width: 1200, height: 900 },
  { width: 768, height: 1024 },
]) {
  test.describe(`at ${viewport.width}px`, () => {
    test.use({ viewport });

    for (const route of Object.keys(PLACEMENTS)) {
      test(`${route} is centred, standard height, clear of text, never sideways`, async ({
        page,
      }) => {
        await page.goto(route, { waitUntil: "networkidle" });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
        expect(await standardAndCentred(page)).toEqual([]);
        expect(await obstructed(page)).toEqual([]);
      });
    }
  });
}

test("is centred and standard height at desktop and phone sizes too", async ({ page }) => {
  for (const route of Object.keys(PLACEMENTS)) {
    await page.goto(route, { waitUntil: "networkidle" });
    expect(await standardAndCentred(page)).toEqual([]);
  }
});

test.describe("when a scrollbar takes space", () => {
  // Headless browsers hide scrollbars, so the narrower page is simulated: the
  // body loses 17px on the right, exactly as a classic scrollbar would take
  // them, while 100vw stays the full window. The band must still blend both
  // page edges, the art must centre on the page (not the window), and the
  // page must not scroll sideways.
  test("the band reaches the page edges and the art centres on the page", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "body { margin-right: 17px }" });
    const result = await page.evaluate(() => {
      const pageBox = document.body.getBoundingClientRect();
      const divider = document.querySelector("[data-flow]")!;
      const band = divider.getBoundingClientRect();
      const frame = divider.querySelector("[data-flow-art]")!.getBoundingClientRect();
      return {
        coversLeft: band.left <= pageBox.left,
        coversRight: band.right >= pageBox.right,
        centred: Math.abs(frame.left + frame.width / 2 - (pageBox.left + pageBox.width / 2)) <= 1,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    expect(result).toEqual({ coversLeft: true, coversRight: true, centred: true, overflow: 0 });
  });
});

test.describe("with motion allowed", () => {
  test.use({ reducedMotion: "no-preference" });

  test("artwork is visible before its reveal, then settles in and drifts with scroll", async ({
    page,
  }) => {
    await page.goto("/our-story", { waitUntil: "networkidle" });
    const divider = page.locator("[data-flow='hibiscus']");
    const art = divider.locator("[data-flow-art]");
    await expect(divider).not.toHaveAttribute("data-revealed");
    // Never hidden while waiting for the observer: faint, but there.
    expect(Number(await art.evaluate((el) => getComputedStyle(el).opacity))).toBeGreaterThan(0.3);

    await divider.scrollIntoViewIfNeeded();
    await expect(divider).toHaveAttribute("data-revealed", "");
    await expect.poll(() => art.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    // The shared scroll loop drives the drift.
    await expect
      .poll(() => divider.evaluate((el) => el.style.getPropertyValue("--progress")))
      .not.toBe("");
    const drift = await divider
      .locator("[data-parallax-target]")
      .evaluate((el) => getComputedStyle(el).transform);
    expect(drift).not.toBe("none");
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("artwork is simply in place: no fade, no drift", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    for (const divider of await page.locator("[data-flow]").all()) {
      const art = divider.locator("[data-flow-art]");
      expect(await art.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
      expect(await art.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
      expect(
        await divider
          .locator(".ingredient-flow__drift")
          .evaluate((el) => getComputedStyle(el).transform),
      ).toBe("none");
      expect(await divider.evaluate((el) => el.style.getPropertyValue("--progress"))).toBe("");
    }
  });
});
