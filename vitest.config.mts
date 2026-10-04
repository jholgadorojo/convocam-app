import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// .env.test tiene prioridad sobre .env: los tests usan la BD convocam_test.
const testEnv: Record<string, string> = {};
config({ path: [".env.test", ".env"], processEnv: testEnv, quiet: true });

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    env: testEnv,
  },
});
