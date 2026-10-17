import { expect, test, type Page } from "@playwright/test";

const WELCOMED_KEY = "svara:mascot-welcomed";
const GREETING = "Hey there! 🌱 I'm SVARA, your little guide to SVARA Agri Farms.";

const mascot = (page: Page) => page.locator(".mascot-launcher svg.mascot");
const panel = (page: Page) => page.getByRole("dialog", { name: "Hello, I’m SVARA." });
const log = (page: Page) => page.getByRole("log", { name: "Conversation with SVARA" });
const input = (page: Page) => page.getByRole("textbox", { name: "Ask SVARA a question" });

/** Records every mood SVARA takes from now on, in order, on `window.__moods`. */
async function recordMoods(page: Page) {
  await page.evaluate(() => {
    const svg = document.querySelector(".mascot-launcher svg.mascot")!;
    const seen: string[] = [svg.getAttribute("data-state")!];
    (window as unknown as { __moods: string[] }).__moods = seen;
    new MutationObserver(() => {
      const state = svg.getAttribute("data-state")!;
      if (seen.at(-1) !== state) seen.push(state);
    }).observe(svg, { attributes: true, attributeFilter: ["data-state"] });
  });
}
const moods = (page: Page) =>
  page.evaluate(() => (window as unknown as { __moods: string[] }).__moods);

/** A visitor who has already been welcomed this session, so no bubble competes. */
async function openChat(page: Page, path = "/journey") {
  await page.addInitScript((key) => sessionStorage.setItem(key, "1"), WELCOMED_KEY);
  await page.goto(path, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
  await page.getByRole("button", { name: /Open SVARA/ }).click();
  await expect(panel(page)).toBeVisible();
}

async function ask(page: Page, text: string) {
  await input(page).fill(text);
  await input(page).press("Enter");
}

test("the first-visit welcome greets with quick replies that open the conversation", async ({
  page,
  isMobile,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  if (isMobile) await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
  await expect(mascot(page)).toHaveAttribute("data-state", "welcome", { timeout: 8000 });
  await expect(page.locator(".mascot-note")).toContainText(GREETING);
  const replies = page.locator(".mascot-note-replies").getByRole("button");
  await expect(replies).toHaveText(["Explore the farm", "Discover powders", "Take me shopping"]);

  await replies.filter({ hasText: "Explore the farm" }).click();
  await expect(panel(page)).toBeVisible();
  await expect(log(page)).toContainText(GREETING);
  await expect(log(page)).toContainText("Ooh, let's start at the beginning!");
  await expect(panel(page).getByRole("link", { name: "Show me the journey" })).toHaveAttribute(
    "href",
    "/journey",
  );
  await expect(panel(page).getByRole("link", { name: "Our story" })).toHaveAttribute(
    "href",
    "/our-story",
  );
});

test("SVARA holds still while the pointer is on its own replies", async ({ page, isMobile }) => {
  test.skip(isMobile, "Cursor following needs a fine pointer.");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(mascot(page)).toHaveAttribute("data-state", "welcome", { timeout: 8000 });
  const chip = page
    .locator(".mascot-note-replies")
    .getByRole("button", { name: "Discover powders" });
  await chip.hover();
  const before = (await chip.boundingBox())!;
  await page.waitForTimeout(700);
  const after = (await chip.boundingBox())!;
  expect(Math.abs(after.x - before.x)).toBeLessThan(1);
  expect(Math.abs(after.y - before.y)).toBeLessThan(1);
});

test("every quick reply leads somewhere real, and the chat survives navigation", async ({
  page,
}) => {
  await openChat(page);
  await expect(log(page)).toContainText(GREETING);
  const quick = panel(page).getByRole("list", { name: "Quick replies" });

  await quick.getByRole("button", { name: "Discover powders" }).click();
  await expect(log(page)).toContainText("Leaf me curious! 🍃");
  await expect(quick.getByRole("link", { name: "Moringa powder" })).toHaveAttribute(
    "href",
    "/products/moringa-powder",
  );
  await expect(quick.getByRole("link", { name: "Browse ingredients" })).toHaveAttribute(
    "href",
    "/products#range-preview-heading",
  );

  await ask(page, "take me shopping");
  await expect(log(page)).toContainText("Adventure awaits! 🛍️");
  await expect(quick.getByRole("link", { name: "See available products" })).toHaveAttribute(
    "href",
    "/products",
  );

  // Following a reply navigates client-side, closes the panel and keeps the talk.
  await quick.getByRole("link", { name: "See available products" }).click();
  await page.waitForURL("**/products");
  await expect(panel(page)).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
  await page.getByRole("button", { name: /Open SVARA/ }).click();
  await expect(log(page)).toContainText("Adventure awaits!");
  await expect(log(page)).toContainText("See available products");
  // The greeting is not repeated on reopening.
  await expect(log(page).getByText(GREETING)).toHaveCount(1);
});

test("typed questions get scripted, catalogue-backed answers — or an honest “don't know”", async ({
  page,
}) => {
  await openChat(page);
  await expect(panel(page)).toContainText("not an AI assistant");

  await ask(page, "Is this organic?");
  await expect(log(page)).toContainText("before making that claim");

  await ask(page, "What is the price?");
  await expect(log(page)).toContainText("Moringa Powder: from ₹250.");

  await ask(page, "Is it available?");
  await expect(log(page)).toContainText("Moringa Powder: Available.");

  await ask(page, "Where is my order?");
  await expect(log(page)).toContainText(
    "I can't see order details myself, but our team can help on WhatsApp",
  );
  await expect(
    log(page)
      .getByRole("link", { name: /Chat with our team on WhatsApp/ })
      .last(),
  ).toHaveAttribute("href", /^https:\/\/wa\.me\/917780262442\?text=/);

  await ask(page, "How do I use this powder?");
  await expect(
    panel(page).getByRole("link", { name: "Moringa Powder: how to use" }),
  ).toHaveAttribute("href", "/products/moringa-powder#how-to-use");

  await ask(page, "do you sell tractors");
  await expect(log(page)).toContainText("Hmm, I don't know that one yet.");
  await expect(
    panel(page).getByRole("list", { name: "Quick replies" }).getByRole("button"),
  ).toHaveText(["Explore the farm", "Discover powders", "Take me shopping"]);
});

test("keyboard: Enter sends, Shift+Enter adds a line, Escape closes and returns focus", async ({
  page,
}) => {
  await openChat(page);
  const box = input(page);
  await box.click();
  await box.type("hello");
  await box.press("Shift+Enter");
  await box.type("there");
  await expect(box).toHaveValue("hello\nthere");
  await expect(log(page).locator("p", { hasText: "hello" })).toHaveCount(0);
  await box.press("Enter");
  await expect(box).toHaveValue("");
  await expect(log(page)).toContainText("hello\nthere");
  // Empty input cannot be sent.
  await expect(panel(page).getByRole("button", { name: "Send" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(panel(page)).toBeHidden();
  await expect(page.getByRole("button", { name: /Open SVARA/ })).toBeFocused();
});

test("answers move SVARA's mood through the shared priorities", async ({ page }) => {
  await openChat(page);
  await recordMoods(page);
  await ask(page, "tell me about the farm");
  await expect.poll(() => moods(page)).toContain("explaining");
  await ask(page, "thank you!");
  await expect(log(page)).toContainText("You're berry welcome!");
  await expect.poll(() => moods(page)).toContain("happy");
  await ask(page, "bye");
  await expect(log(page)).toContainText("See you soon! Keep growing curious. 🌱");
  await expect(mascot(page)).toHaveAttribute("data-state", "goodbye");
  // Chat never shows the concerned (error) pose: that is for real failures.
  expect(await moods(page)).not.toContain("error");
});

test("the panel fits the screen and scrolls its own history", async ({ page }) => {
  await openChat(page);
  for (const text of ["hello", "farm", "powders", "shop", "price", "organic", "thanks"]) {
    await ask(page, text);
  }
  const box = (await panel(page).boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    viewport.width,
  );
  // The newest message is scrolled into view inside the log.
  const atBottom = await log(page).evaluate(
    (element) => element.scrollHeight - element.scrollTop - element.clientHeight < 4,
  );
  expect(atBottom).toBe(true);
  await expect(input(page)).toBeInViewport();
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the conversation works without animating SVARA", async ({ page }) => {
    await openChat(page);
    await ask(page, "what is moringa?");
    await expect(log(page)).toContainText("made from the leaves of the moringa tree");
    const running = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll(".mascot-launcher svg.mascot *")).flatMap((node) =>
          (node as SVGElement).getAnimations(),
        ).length,
    );
    expect(running).toBe(0);
  });
});
