# gcode-file-viewer

Web-based G-code viewer built with TypeScript, Vite, React, Tailwind CSS, Three.js and the `gcode-parser` package. It lets you upload multiple `.gcode` files, analyse their layers, and visualise toolpaths directly in the browser with multilingual support (English and Italian).

## Requirements

- Node.js >= 18
- npm >= 9

## Installation

```bash
npm install
```

## Available scripts

- `npm run dev` – start the development server on http://localhost:5173
- `npm run build` – create a production build in `dist/`
- `npm run preview` – serve the production build locally
- `npm run lint` – run ESLint with the configured rules
- `npm run format` – apply ESLint auto-fixes
- `npm run start` – alias for `npm run dev`

## Project structure

- `src/App.tsx` – top-level layout (header, sidebar, 3D viewer, info panel)
- `src/context/FileStore.tsx` – global state for uploaded files
- `src/components/*` – UI building blocks (uploader, sidebar, viewer wrapper, language selector)
- `src/utils/readGCode.ts` – G-code parsing with `gcode-parser`
- `src/i18n.ts` – i18next configuration and translation resources (EN/IT)
- `src/service-worker.ts` – static asset caching (enabled in production)
- `src/stubs/*` – lightweight browser stubs for Node.js modules required by `gcode-parser`

## Key features

- Drag & drop or manual upload of multiple `.gcode` files
- Global file management (select, remove, clear list) via sidebar
- Interactive Three.js viewer with layer slider, zoom-to-fit, camera reset, fullscreen
- Detailed metadata panel powered by `react-i18next`, translated in English and Italian
- PWA-ready setup with manifest, icons, and service worker

## Deployment

The project includes a GitHub Actions workflow (`.github/workflows/pages.yml`) that builds the Vite app and publishes the `dist/` output to GitHub Pages. With `base` configured to `/gcode-viewer/` in `vite.config.ts`, the site is publicly available at https://sigpio.github.io/gcode-viewer/. Deployments are triggered by pushing a tag that starts with `v` (for example `v1.2.0`) or by running the workflow manually. The workflow ensures that the tagged commit already lives on `main`; tags made on feature branches exit with a notice instead of publishing. Each successful run also archives the generated `dist/` folder as a downloadable artifact, so you can retrieve the exact bundle for a given release. If the `github-pages` environment has reviewers configured, remember to approve the deploy from the Actions UI once the workflow reaches the deployment step.

### Release checklist

1. Merge the desired changes into `main` through a reviewed pull request (feature → develop → main, following the repository rulesets and CODEOWNERS checks).
2. Run local quality checks (e.g. `npm run lint` and any extra tests).
3. From `main`, bump the version: `npm version <patch|minor|major>` - this creates the version commit and Git tag.
4. Push commit and tag: `git push origin main --tags`.
5. Monitor the `Deploy to GitHub Pages` workflow; approve the deployment if required and confirm the published site updates.

## Notes on `gcode-parser`

Parsing is handled by `gcode-parser`. If you rely on custom commands, extend `src/utils/readGCode.ts` to interpret them and feed the 3D renderer accordingly.

The package depends on Node.js modules (`fs`, `stream`, `events`, `timers`). Minimal browser stubs are provided in `src/stubs/`. File I/O APIs from the Node modules are not available in the browser.

## License

Distributed under the terms described in the `LICENSE` file.
