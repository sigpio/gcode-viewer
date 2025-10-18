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

## Notes on `gcode-parser`

Parsing is handled by `gcode-parser`. If you rely on custom commands, extend `src/utils/readGCode.ts` to interpret them and feed the 3D renderer accordingly.

The package depends on Node.js modules (`fs`, `stream`, `events`, `timers`). Minimal browser stubs are provided in `src/stubs/`. File I/O APIs from the Node modules are not available in the browser.

## License

Distributed under the terms described in the `LICENSE` file.
