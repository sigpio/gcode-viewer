import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileStoreProvider, useFileStore } from './context/FileStore';
import FileUploader from './components/FileUploader';
import Sidebar from './components/Sidebar';
import GCodeViewerWrapper from './components/GCodeViewerWrapper';
import LanguageSelector from './components/LanguageSelector';

const getInitialPanelState = () => {
  if (typeof window === 'undefined') {
    return true;
  }
  return window.matchMedia('(min-width: 768px)').matches;
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
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setSidebarOpen(true);
      }
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
    }
    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex flex-wrap items-start gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3">
        <h1 className="order-1 text-lg font-semibold text-white">{t('header.title')}</h1>
        <div className="order-2 ml-auto flex items-center md:order-3">
          <span className="hidden select-none text-slate-700 md:mr-3 md:inline">|</span>
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
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center text-slate-400">
              <p className="text-lg font-medium text-slate-300">
                {t('header.noFilesTitle')}
              </p>
              <p className="max-w-md text-sm">{t('header.noFilesDescription')}</p>
            </div>
          ) : !activeFile ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center text-slate-400">
              <p className="text-lg font-medium text-slate-300">{t('header.noActiveTitle')}</p>
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
