import { useFileStore } from '../context/FileStore';

type SidebarProps = {
  readonly id?: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

const Sidebar = ({ id, isOpen, onClose }: SidebarProps) => {
  const {
    files,
    activeFileId,
    setActiveFile,
    removeFile,
    clearAll
  } = useFileStore();

  const handleSelect = (id: string) => {
    setActiveFile(id);
  };

  return (
    <aside
      id={id}
      className={`z-20 ${isOpen ? 'flex' : 'hidden'} w-80 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-900 transition-transform duration-300 lg:flex lg:relative lg:translate-x-0`}
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          File caricati
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:text-white lg:hidden"
        >
          Chiudi
        </button>
      </div>

      <div className="scrollbar-brand flex flex-1 flex-col overflow-y-auto">
        {files.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-400">
            Nessun file. Carica un file .gcode per iniziare l&apos;analisi.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {files.map((file) => {
              const isActive = file.id === activeFileId;
              return (
                <li
                  key={file.id}
                  className={`flex items-center gap-3 px-4 py-3 transition ${
                    isActive ? 'bg-slate-800/60' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(file.id)}
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                      isActive
                        ? 'border-brand-light bg-brand/20 text-brand-light'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-brand-light hover:text-brand-light'
                    }`}
                    title="Visualizza file"
                    aria-pressed={isActive}
                  >
                    {isActive ? 'ATT' : 'SEL'}
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-white">{file.name}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(file.addedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="rounded-md border border-transparent px-2 py-1 text-xs text-slate-400 hover:border-red-500 hover:text-red-400"
                    title="Rimuovi file"
                  >
                    Rimuovi
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-slate-800 px-4 py-4">
          <button
            type="button"
            onClick={clearAll}
            className="w-full rounded-md border border-red-500 px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
          >
            Svuota lista
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
