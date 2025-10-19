import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileStoreProvider, useFileStore } from './context/FileStore';
import FileUploader from './components/FileUploader';
import Sidebar from './components/Sidebar';
import GCodeViewerWrapper from './components/GCodeViewerWrapper';
import LanguageSelector from './components/LanguageSelector';

const AppLayout = () => {
  const { files, activeFile, setActiveFile } = useFileStore();
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (files.length > 0 && !activeFile) {
      setActiveFile(files[0]!.id);
    }
  }, [files, activeFile, setActiveFile]);

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white">{t('header.title')}</h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <FileUploader />
          <span className="select-none text-slate-700">|</span>
          <LanguageSelector />
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
