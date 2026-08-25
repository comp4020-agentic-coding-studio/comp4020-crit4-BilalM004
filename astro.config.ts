import { defineConfig } from "astro/config";

// Written by the course stack skill; values derived from this repo's origin
// remote. The dev server serves under the base too, so a path bug reproduces
// locally instead of only on the live URL. build.format "preserve" maps each
// page to the same output path it had before the conversion --- about.html
// stays /about.html and notes/index.html stays /notes/index.html --- so
// hand-written relative links and asset paths keep working. Astro's default
// ("directory") would move every root page to /about/, and "file" would
// collapse notes/index.html to /notes.html; either way half the pages get a
// URL one level off from the one their relative links were written against.
// compressHTML true because the default ("jsx") strips the space before
// line-broken inline elements in hand-written prose.
export default defineConfig({
  site: "https://comp4020-agentic-coding-studio.github.io",
  base: "/comp4020-crit4-BilalM004",
  build: { format: "preserve" },
  compressHTML: true,
  // This repo lives under /mnt/c (a Windows drive mounted into WSL2), where
  // inotify events from edits don't reliably reach Vite's file watcher --
  // polling is the standard workaround for that filesystem boundary.
  vite: { server: { watch: { usePolling: true, interval: 100 } } },
});
