import type { ChangeEvent } from 'react';
import type { TFunction } from 'i18next';

type ViewerToolbarProps = {
  readonly layerSlice: number;
  readonly maxLayer: number;
  readonly onLayerChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onToggleInfo: () => void;
  readonly isInfoOpen: boolean;
  readonly onZoomToFit: () => void;
  readonly onResetCamera: () => void;
  readonly onToggleFullscreen: () => void;
  readonly isFullscreen: boolean;
  readonly onToggleSidebar?: () => void;
  readonly isSidebarOpen?: boolean;
  readonly t: TFunction<'translation', undefined>;
};

const ViewerToolbar = ({
  layerSlice,
  maxLayer,
  onLayerChange,
  onToggleInfo,
  isInfoOpen,
  onZoomToFit,
  onResetCamera,
  onToggleFullscreen,
  isFullscreen,
  onToggleSidebar,
  isSidebarOpen,
  t
}: ViewerToolbarProps) => {
  const clampedLayer = Math.min(layerSlice, maxLayer);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-300" htmlFor="layer-range">
          {t('viewer.displayedLayer')}:{' '}
          <span className="font-semibold text-white">{clampedLayer}</span> /{' '}
          <span>{maxLayer}</span>
        </label>
        <input
          id="layer-range"
          type="range"
          min={0}
          max={maxLayer}
          value={clampedLayer}
          onChange={onLayerChange}
          className="h-2 w-48 cursor-pointer rounded-lg bg-slate-700 accent-brand-light disabled:cursor-not-allowed"
          disabled={maxLayer === 0}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-expanded={isSidebarOpen ?? false}
            className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800 lg:hidden"
          >
            {isSidebarOpen ? t('viewer.hideSidebar') : t('viewer.showSidebar')}
          </button>
        )}
        <button
          type="button"
          onClick={onToggleInfo}
          aria-expanded={isInfoOpen}
          className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
        >
          {isInfoOpen ? t('viewer.hideInfo') : t('viewer.showInfo')}
        </button>
        <button
          type="button"
          onClick={onZoomToFit}
          className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
        >
          {t('viewer.zoomToFit')}
        </button>
        <button
          type="button"
          onClick={onResetCamera}
          className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
        >
          {t('viewer.resetCamera')}
        </button>
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
        >
          {isFullscreen ? t('viewer.exitFullscreen') : t('viewer.fullscreen')}
        </button>
      </div>
    </div>
  );
};

export default ViewerToolbar;
