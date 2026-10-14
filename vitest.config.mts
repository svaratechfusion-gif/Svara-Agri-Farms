import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/commerce/**/*.ts",
        "src/lib/motion/scrollProgress.ts",
        "src/content/field-notes.ts",
        "src/components/ui/leafButtonStyles.ts",
        "src/components/botanical/journeyVeinGeometry.ts",
        "src/lib/mascot/definition.ts",
        "src/lib/mascot/gaze.ts",
        "src/lib/mascot/follow.ts",
        "src/lib/mascot/moodPriority.ts",
        "src/lib/mascot/noteRules.ts",
        "src/lib/mascot/moodController.ts",
        "src/lib/mascot/welcome.ts",
        "src/lib/mascot/curiosity.ts",
        "src/lib/mascot/chat/*.ts",
        "src/content/mascot-notes.ts",
        "src/lib/flow/flowLayout.ts",
      ],
      exclude: ["src/**/__tests__/**", "src/lib/commerce/types.ts"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
