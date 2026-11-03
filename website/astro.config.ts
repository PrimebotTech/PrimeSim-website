import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  // `site` / `base` are injected by CI (--site / --base) or by the env vars
  // below when previewing a GitHub Pages sub-path build locally.
  site: process.env.SITE_URL || undefined,
  base: process.env.BASE_PATH || "/",
  image: {
    responsiveStyles: true,
  },
});
