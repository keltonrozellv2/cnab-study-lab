# CNAB / CNT Study Lab

Prep app for the Computer Network Assessment Battery. Installable, works offline, updates itself.

**Open it:** https://keltonrozellv2.github.io/cnab-study-lab/

- Progress is saved in your browser. Use Progress → Profile code (or Export) to move it between devices.
- When a new build is published, you'll see "Reload to update" the next time you're online.

## Developing
- Source is `src/app.html` (one file). Built output at the root is generated — don't edit it directly.
- `tools/test.sh` runs every check; `tools/build.sh vNN` stamps a version and rebuilds `index.html` / `sw.js` / `VERSION`.
- Work happens on the `dev` branch; `main` is what users get, and a new version on `main` triggers their update banner.
- `CLAUDE.md` has the full working notes.
