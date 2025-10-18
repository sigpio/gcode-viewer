import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      header: {
        title: 'G-code File Viewer',
        noFilesTitle: 'Upload a .gcode file to get started',
        noFilesDescription:
          'Drag multiple files to compare toolpaths, then choose which one to analyse in the 3D viewer and detail panel.',
        noActiveTitle: 'Select a file from the sidebar to display it.'
      },
      uploader: {
        button: 'Upload files',
        hint: 'Drag your .gcode files here',
        readError: 'Error while reading G-code files'
      },
      sidebar: {
        title: 'Uploaded files',
        close: 'Close',
        empty: 'No files yet. Upload a .gcode file to start the analysis.',
        remove: 'Remove',
        clear: 'Clear list',
        view: 'View file',
        activeTag: 'ACT',
        selectTag: 'SEL'
      },
      viewer: {
        displayedLayer: 'Displayed layer',
        hideInfo: 'Hide info',
        showInfo: 'Show info',
        zoomToFit: 'Zoom to fit',
        resetCamera: 'Reset camera',
        fullscreen: 'Fullscreen',
        exitFullscreen: 'Exit fullscreen',
        hideSidebar: 'Hide file list',
        showSidebar: 'Show file list',
        parseError:
          'Unable to parse the file "{{file}}". Some paths may not be visible.'
      },
      infoPanel: {
        title: 'G-code details',
        currentLayer: 'Current layer: {{current}} of {{max}}',
        empty: 'Add a visible file to explore its metadata.',
        totalLayers: 'Total layers (calculated)',
        totalCommands: 'G-code commands',
        estimatedHeight: 'Estimated height',
        boundingBox: 'Bounding box',
        additionalFields: 'Other fields'
      },
      language: {
        label: 'Language',
        english: 'English',
        italian: 'Italian'
      }
    }
  },
  it: {
    translation: {
      header: {
        title: 'Visualizzatore File G-code',
        noFilesTitle: 'Carica un file .gcode per iniziare',
        noFilesDescription:
          'Trascina piu file per confrontare i percorsi e scegli quale analizzare nel viewer 3D e nel pannello dettagli.',
        noActiveTitle: 'Seleziona un file dalla barra laterale per visualizzarlo.'
      },
      uploader: {
        button: 'Carica file',
        hint: 'Trascina qui i tuoi file .gcode',
        readError: 'Errore durante la lettura dei file G-code'
      },
      sidebar: {
        title: 'File caricati',
        close: 'Chiudi',
        empty: 'Nessun file. Carica un file .gcode per iniziare l\'analisi.',
        remove: 'Rimuovi',
        clear: 'Svuota lista',
        view: 'Visualizza file',
        activeTag: 'ATT',
        selectTag: 'SEL'
      },
      viewer: {
        displayedLayer: 'Layer mostrato',
        hideInfo: 'Nascondi info',
        showInfo: 'Mostra info',
        zoomToFit: 'Zoom to fit',
        resetCamera: 'Reset camera',
        fullscreen: 'Fullscreen',
        exitFullscreen: 'Esci fullscreen',
        hideSidebar: 'Nascondi lista file',
        showSidebar: 'Mostra lista file',
        parseError:
          'Impossibile analizzare il file "{{file}}". Alcuni percorsi potrebbero non essere visibili.'
      },
      infoPanel: {
        title: 'Dettagli G-code',
        currentLayer: 'Layer corrente: {{current}} di {{max}}',
        empty: 'Aggiungi un file visibile per esplorare i metadati.',
        totalLayers: 'Layer totali (calcolati)',
        totalCommands: 'Comandi G-code',
        estimatedHeight: 'Altezza stimata',
        boundingBox: 'Bounding box',
        additionalFields: 'Altri campi'
      },
      language: {
        label: 'Lingua',
        english: 'Inglese',
        italian: 'Italiano'
      }
    }
  }
} as const;

type SupportedLanguage = keyof typeof resources;

const fallbackLanguage: SupportedLanguage = 'en';
const supportedLanguages = Object.keys(resources) as SupportedLanguage[];

const normaliseLanguage = (language: string | undefined | null): SupportedLanguage | null => {
  if (!language) {
    return null;
  }
  const normalised = language.split('-')[0]?.toLowerCase();
  if (!normalised) {
    return null;
  }
  return supportedLanguages.find((option) => option === normalised) ?? null;
};

const detectBrowserLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return fallbackLanguage;
  }
  const { language, languages } = navigator;
  const candidates: Array<string | undefined> = [language, ...(languages ?? [])];
  for (const candidate of candidates) {
    const match = normaliseLanguage(candidate);
    if (match) {
      return match;
    }
  }
  return fallbackLanguage;
};

const setDocumentLanguage = (language: string) => {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = language;
  }
};

const initialLanguage = detectBrowserLanguage();
setDocumentLanguage(initialLanguage);

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: fallbackLanguage,
  interpolation: {
    escapeValue: false
  }
});

i18n.on('languageChanged', (lng) => {
  const match = normaliseLanguage(lng) ?? fallbackLanguage;
  setDocumentLanguage(match);
});

export default i18n;
