import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer
} from 'react';

export type GCodeFileRecord = {
  readonly id: string;
  readonly name: string;
  readonly text: string;
  readonly addedAt: number;
  readonly visible: boolean;
};

type FileStoreState = {
  readonly files: GCodeFileRecord[];
  readonly activeFileId: string | null;
};

type FileStoreAction =
  | { type: 'add'; payload: { name: string; text: string } }
  | { type: 'remove'; payload: { id: string } }
  | { type: 'toggle'; payload: { id: string } }
  | { type: 'clear' }
  | { type: 'show-all' }
  | { type: 'hide-all' }
  | { type: 'set-active'; payload: { id: string } };

export type FileStoreContextValue = {
  readonly files: GCodeFileRecord[];
  readonly activeFileId: string | null;
  readonly activeFile: GCodeFileRecord | null;
  readonly addFile: (text: string, name: string) => void;
  readonly removeFile: (id: string) => void;
  readonly toggleVisibility: (id: string) => void;
  readonly clearAll: () => void;
  readonly showAll: () => void;
  readonly hideAll: () => void;
  readonly setActiveFile: (id: string) => void;
};

const FileStoreContext = createContext<FileStoreContextValue | null>(null);

const createIdentifier = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const sortByRecent = (files: GCodeFileRecord[]): GCodeFileRecord[] =>
  [...files].sort((a, b) => b.addedAt - a.addedAt);

const reducer = (state: FileStoreState, action: FileStoreAction): FileStoreState => {
  switch (action.type) {
    case 'add': {
      const next: GCodeFileRecord = {
        id: createIdentifier(),
        name: action.payload.name,
        text: action.payload.text,
        addedAt: Date.now(),
        visible: true
      };
      return {
        files: sortByRecent([...state.files, next]),
        activeFileId: next.id
      };
    }
    case 'remove': {
      const remaining = state.files.filter((file) => file.id !== action.payload.id);
      const activeFileId =
        action.payload.id === state.activeFileId
          ? remaining[0]?.id ?? null
          : state.activeFileId && remaining.some((file) => file.id === state.activeFileId)
          ? state.activeFileId
          : remaining[0]?.id ?? null;
      return {
        files: remaining,
        activeFileId
      };
    }
    case 'toggle': {
      const updated = state.files.map((file) =>
        file.id === action.payload.id ? { ...file, visible: !file.visible } : file
      );
      const toggled = updated.find((file) => file.id === action.payload.id);
      const activeFileId =
        toggled && !toggled.visible && toggled.id === state.activeFileId
          ? updated.find((file) => file.visible)?.id ?? null
          : state.activeFileId;
      return {
        files: updated,
        activeFileId
      };
    }
    case 'clear':
      return { files: [], activeFileId: null };
    case 'show-all': {
      const updated = state.files.map((file) => ({ ...file, visible: true }));
      const activeFileId =
        state.activeFileId && updated.some((file) => file.id === state.activeFileId)
          ? state.activeFileId
          : updated[0]?.id ?? null;
      return {
        files: updated,
        activeFileId
      };
    }
    case 'hide-all':
      return {
        files: state.files.map((file) => ({ ...file, visible: false })),
        activeFileId: null
      };
    case 'set-active': {
      const exists = state.files.some((file) => file.id === action.payload.id);
      if (!exists) {
        return state;
      }
      const updated = state.files.map((file) =>
        file.id === action.payload.id ? { ...file, visible: true } : file
      );
      return {
        files: updated,
        activeFileId: action.payload.id
      };
    }
    default:
      return state;
  }
};

const initialState: FileStoreState = { files: [], activeFileId: null };

export const FileStoreProvider = ({ children }: PropsWithChildren<unknown>) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addFile = useCallback((text: string, name: string) => {
    dispatch({ type: 'add', payload: { text, name } });
  }, []);

  const removeFile = useCallback((id: string) => {
    dispatch({ type: 'remove', payload: { id } });
  }, []);

  const toggleVisibility = useCallback((id: string) => {
    dispatch({ type: 'toggle', payload: { id } });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'clear' });
  }, []);

  const showAll = useCallback(() => {
    dispatch({ type: 'show-all' });
  }, []);

  const hideAll = useCallback(() => {
    dispatch({ type: 'hide-all' });
  }, []);

  const setActiveFile = useCallback((id: string) => {
    dispatch({ type: 'set-active', payload: { id } });
  }, []);

  const activeFile = useMemo<GCodeFileRecord | null>(() => {
    if (!state.activeFileId) {
      return null;
    }
    return state.files.find((file) => file.id === state.activeFileId) ?? null;
  }, [state.activeFileId, state.files]);

  const value = useMemo<FileStoreContextValue>(
    () => ({
      files: state.files,
      activeFileId: state.activeFileId,
      activeFile,
      addFile,
      removeFile,
      toggleVisibility,
      clearAll,
      showAll,
      hideAll,
      setActiveFile
    }),
    [
      state.files,
      state.activeFileId,
      activeFile,
      addFile,
      removeFile,
      toggleVisibility,
      clearAll,
      showAll,
      hideAll,
      setActiveFile
    ]
  );

  return <FileStoreContext.Provider value={value}>{children}</FileStoreContext.Provider>;
};

export const useFileStore = (): FileStoreContextValue => {
  const context = useContext(FileStoreContext);
  if (!context) {
    throw new Error('useFileStore must be used within a FileStoreProvider');
  }
  return context;
};
