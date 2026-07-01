import { defineConfig } from "@wagmi/cli";
import { foundry, react } from "@wagmi/cli/plugins";

/**
 * @wagmi/cli configuration
 *
 * This config hooks into the Foundry compilation output directory
 * (../contracts/out/) and generates type-safe React hooks and ABI
 * constants into src/generated.ts.
 *
 * Run generation with:
 *   npx wagmi generate
 *
 * Or use the Makefile at the project root:
 *   make wagmi-gen
 */
export default defineConfig({
  /**
   * Output file for generated TypeScript code.
   * Relative to this config file's directory.
   */
  out: "src/generated.ts",

  /**
   * Explicit contract imports (optional — the Foundry plugin
   * will discover all .sol files from the project directory).
   */
  contracts: [],

  plugins: [
    foundry({
      /**
       * Path to the Foundry project. Compiled artifacts are read
       * from <project>/out/.
       */
      project: "../contracts",

      /**
       * Only include the ManualNFT contract.
       */
      include: ["ManualNFT.json"],

      /**
       * Exclude any test or script artifacts.
       */
      exclude: ["*test*", "*script*", "*Test*", "*Script*"],
    }),
    react(),
  ],
});
