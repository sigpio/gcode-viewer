# gcode-file-viewer

Visualizzatore G-code web-based scritto in TypeScript con Vite, React, Tailwind CSS, Three.js e il parser `gcode-parser`. Consente di caricare piu file `.gcode`, analizzarne i layer, gestire la visibilita e visualizzare il percorso di stampa in 3D direttamente dal browser.

## Requisiti

- Node.js >= 18
- npm >= 9

## Installazione

```bash
npm install
```

## Comandi utili

- `npm run dev` avvia l'ambiente di sviluppo su http://localhost:5173
- `npm run build` genera la build di produzione in `dist/`
- `npm run preview` esegue l'anteprima della build prodotta
- `npm run lint` esegue i controlli statici con ESLint
- `npm run format` applica le regole ESLint in modalita fix
- `npm run start` alias di `npm run dev`

## Struttura progetto

- `src/App.tsx` composizione della UI principale (header, sidebar, viewer)
- `src/context/FileStore.tsx` gestione globale dello stato dei file tramite React Context
- `src/components/*` upload, sidebar, wrapper del viewer 3D
- `src/utils/readGCode.ts` parsing dei comandi con `gcode-parser` e costruzione dei layer/toolpath
- `src/service-worker.ts` caching statico (registrato in produzione)

## Caratteristiche principali

- Upload multiplo via drag & drop e input tradizionale
- Gestione visibilita, rimozione e reset dei file caricati
- Colorazione automatica per file multipli e slicing per layer
- Controlli rapidi per zoom-to-fit, reset camera e fullscreen
- Pannello info laterale con metadati estratti dal G-code (generatore, layer totali, bounding box, ecc.)
- Supporto PWA base con manifest e service worker

## Note sull'uso di `gcode-parser`

Il parsing viene eseguito tramite `gcode-parser` con fallback parziale in caso di G-code non standard. Se vengono aggiunti comandi custom, adatta `src/utils/readGCode.ts` per interpretarli correttamente e includerli nel toolpath renderizzato.

Il pacchetto dipende da moduli Node.js (`fs`, `stream`, `events`, `timers`): per l'esecuzione nel browser sono fornite sostituzioni minime in `src/stubs/`. Le funzioni legate a I/O file dei moduli originali non sono disponibili nel client.

## Licenza

Distribuito secondo i termini indicati nel file `LICENSE`.
