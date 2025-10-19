import { ChangeEvent, DragEvent, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFileStore } from '../context/FileStore';

const readFileAsText = (file: File): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

/**
 * FileUploader gestisce l'input tradizionale e drag & drop per file G-code.
 */
const FileUploader = () => {
  const { addFile } = useFileStore();
  const [isDragging, setDragging] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { t } = useTranslation();

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) {
        return;
      }
      const tasks = Array.from(fileList)
        .filter((file) => file.name.toLowerCase().endsWith('.gcode'))
        .map(async (file) => {
          const contents = await readFileAsText(file);
          addFile(contents, file.name);
        });

      try {
        await Promise.all(tasks);
      } catch (error) {
        console.error(t('uploader.readError'), error);
      } finally {
        if (inputRef.current) {
          inputRef.current.value = '';
        }
        setDragging(false);
      }
    },
    [addFile, t]
  );

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      void handleFiles(event.target.files);
    },
    [handleFiles]
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragging(false);
      void handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
  }, []);

  return (
    <div className="flex w-full max-w-sm items-center justify-end">
      <div
        className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm transition-colors ${
          isDragging
            ? 'border-brand-light bg-brand/20 text-brand-light'
            : 'border-slate-700 bg-slate-800 hover:bg-slate-700'
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".gcode"
          multiple
          onChange={onInputChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="font-medium text-white"
        >
          {t('uploader.button')}
        </button>
        <span className="text-xs text-slate-400">{t('uploader.hint')}</span>
      </div>
    </div>
  );
};

export default FileUploader;
