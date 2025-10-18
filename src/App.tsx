import { useEffect, useState } from 'react';
import { FileStoreProvider, useFileStore } from './context/FileStore';
import FileUploader from './components/FileUploader';
import Sidebar from './components/Sidebar';
import GCodeViewerWrapper from './components/GCodeViewerWrapper';

const AppLayout = () => {
  const { files, activeFile, setActiveFile } = useFileStore();
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    if (files.length > 0 && !activeFile) {
      setActiveFile(files[0]!.id);
    }
  }, [files, activeFile, setActiveFile]);

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white">G-code File Viewer</h1>
        </div>
        <FileUploader />
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
                Carica un file .gcode per iniziare
              </p>
              <p className="max-w-md text-sm">
                Trascina piu file contemporaneamente per confrontare percorsi di
                stampa e seleziona dalla barra laterale quello che vuoi analizzare
                nel viewer 3D e nel pannello di dettaglio.
              </p>
            </div>
          ) : !activeFile ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center text-slate-400">
              <p className="text-lg font-medium text-slate-300">
                Seleziona un file dalla barra laterale per visualizzarlo.
              </p>
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
