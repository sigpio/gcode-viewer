import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileStoreProvider, useFileStore } from './context/FileStore';
import FileUploader from './components/FileUploader';
import Sidebar from './components/Sidebar';
import GCodeViewerWrapper from './components/GCodeViewerWrapper';
import LanguageSelector from './components/LanguageSelector';
import ThemeSelector from './components/ThemeSelector';
import packageJson from '../package.json';

const getInitialPanelState = () => {
  if (typeof window === 'undefined') {
    return true;
  }
  return window.matchMedia('(min-width: 1024px)').matches;
};

const AppLayout = () => {
  const { files, activeFile, setActiveFile } = useFileStore();
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(() => getInitialPanelState());
  const { t } = useTranslation();

  useEffect(() => {
    if (files.length > 0 && !activeFile) {
      setActiveFile(files[0]!.id);
    }
  }, [files, activeFile, setActiveFile]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent) => {
      // Open sidebar on desktop (>= 1024px), close on mobile/tablet (< 1024px)
      setSidebarOpen(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <div className="flex h-screen flex-col bg-mocha-950 text-mocha-100">
      <header className="flex flex-wrap items-start gap-3 border-b border-mocha-800 bg-mocha-900 px-4 py-3">
        <div className="order-1 flex items-baseline gap-2">
          <h1 className="text-lg font-semibold text-white">{t('header.title')}</h1>
          <span className="text-xs text-mocha-500">v{packageJson.version}</span>
        </div>
        <div className="order-2 ml-auto flex items-center gap-3 md:order-3">
          <ThemeSelector />
          <span className="hidden select-none text-mocha-700 md:mr-1 md:inline">|</span>
          <LanguageSelector />
        </div>
        <div className="order-3 w-full md:order-2 md:w-auto">
          <FileUploader />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          id="sidebar"
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="relative flex flex-1 flex-col overflow-hidden">
          {files.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center text-mocha-400">
              <p className="text-lg font-medium text-mocha-300">
                {t('header.noFilesTitle')}
              </p>
              <p className="max-w-md text-sm">{t('header.noFilesDescription')}</p>
            </div>
          ) : !activeFile ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center text-mocha-400">
              <p className="text-lg font-medium text-mocha-300">{t('header.noActiveTitle')}</p>
            </div>
          ) : (
            <GCodeViewerWrapper
              file={activeFile}
              onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
              isSidebarOpen={isSidebarOpen}
            />
          )}
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <FileStoreProvider>
    <AppLayout />
  </FileStoreProvider>
);

export default App;
