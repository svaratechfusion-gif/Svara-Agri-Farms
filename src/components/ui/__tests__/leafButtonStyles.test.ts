import { describe, expect, it } from "vitest";

import { leafButtonClasses, leafLinkClasses } from "../leafButtonStyles";

describe("leafButtonClasses", () => {
  it("defaults to a medium primary leaf", () => {
    expect(leafButtonClasses()).toBe("leaf-btn leaf-btn--primary leaf-btn--md");
  });

  it("composes variant, size, tone, width and extra classes", () => {
    expect(
      leafButtonClasses({
        variant: "outline",
        size: "lg",
        tone: "light",
        fullWidth: true,
        className: "mt-8",
      }),
    ).toBe("leaf-btn leaf-btn--outline leaf-btn--lg leaf-btn--on-dark w-full mt-8");
  });

  it("always keeps the shared silhouette class regardless of variant", () => {
    (["primary", "secondary", "outline"] as const).forEach((variant) =>
      expect(leafButtonClasses({ variant }).split(" ")[0]).toBe("leaf-btn"),
    );
  });
});

describe("leafLinkClasses", () => {
  it("returns the textual leaf link with optional tone and classes", () => {
    expect(leafLinkClasses()).toBe("leaf-link");
    expect(leafLinkClasses({ tone: "light", className: "type-nav" })).toBe(
      "leaf-link leaf-link--on-dark type-nav",
    );
  });
});
