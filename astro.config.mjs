import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://jennifer-qj.github.io",
  base: "/wenxianxue-lab",
  output: "static",
  integrations: [react()],
});
