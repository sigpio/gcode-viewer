import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent
} from 'react';
import * as THREE from 'three';
import type { GCodeFileRecord } from '../context/FileStore';
import { parseGCode } from '../utils/readGCode';
import InfoPanel from './InfoPanel';
import { useTranslation } from 'react-i18next';
import type { ParsedFile } from './viewer/types';
import {
  DEFAULT_TOOLPATH_COLOR,
  EXTRUSION_RADIUS,
  TRAVEL_RADIUS,
  collectSegments,
  createSegmentMesh
} from './viewer/toolpathGeometry';
import { disposeGroupChildren, fitCameraToBox } from './viewer/sceneUtils';
import { useThreeViewer } from './viewer/useThreeViewer';

type ViewerProps = {
  readonly file: GCodeFileRecord | null;
  readonly onToggleSidebar?: () => void;
  readonly isSidebarOpen?: boolean;
};


const GCodeViewerWrapper = ({ file, onToggleSidebar, isSidebarOpen }: ViewerProps) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { viewerRef, initialCameraRef } = useThreeViewer({ mountRef, wrapperRef });

  const [layerSelection, setLayerSelection] = useState<{ fileId: string | null; value: number }>(
    () => ({
      fileId: null,
      value: 0
    })
  );
  const [isFullscreen, setFullscreen] = useState<boolean>(false);
  const [isInfoOpen, setInfoOpen] = useState<boolean>(true);
  const [showTravelMoves, setShowTravelMoves] = useState<boolean>(true);
  const { t } = useTranslation();

  const parsedResult = useMemo(
    (): { data: ParsedFile | null; errorFile: string | null } => {
      if (!file) {
        return { data: null, errorFile: null };
      }
      try {
        const parsed = parseGCode(file.text);
        return {
          data: {
            ...parsed,
            meta: { id: file.id, name: file.name }
          },
          errorFile: null
        };
      } catch (error) {
        console.error(`Failed to parse G-code file ${file.name}`, error);
        return {
          data: null,
          errorFile: file.name
        };
      }
    },
    [file]
  );

  const parseError = useMemo(() => {
    if (!parsedResult.errorFile) {
      return null;
    }
    return t('viewer.parseError', { file: parsedResult.errorFile });
  }, [parsedResult.errorFile, t]);

  const maxLayer = useMemo(() => {
    const data = parsedResult.data;
    if (!data) {
      return 0;
    }
    return data.layers.length > 0 ? data.layers[data.layers.length - 1]!.index : 0;
  }, [parsedResult.data]);

  const currentFileId = file?.id ?? null;
  const layerSlice =
    layerSelection.fileId === currentFileId
      ? Math.max(0, Math.min(layerSelection.value, maxLayer))
      : maxLayer;

  const updateLayerSlice = useCallback(
    (nextValue: number) => {
      setLayerSelection({
        fileId: currentFileId,
        value: Math.max(0, Math.min(nextValue, maxLayer))
      });
    },
    [currentFileId, maxLayer]
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === wrapperRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [wrapperRef]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) {
      return;
    }

    disposeGroupChildren(viewer.group);

    const data = parsedResult.data;
    if (!data) {
      return;
    }

    const targetLayer = Math.min(layerSlice, maxLayer);
    const segments = collectSegments(data, targetLayer);
    if (segments.length === 0) {
      return;
    }
    const extrudingSegments = segments.filter((segment) => segment.extruding);
    const travelSegments =
      showTravelMoves && segments.some((segment) => !segment.extruding)
        ? segments.filter((segment) => !segment.extruding)
        : [];

    const meshes: THREE.Object3D[] = [];

    const extrusionMesh = createSegmentMesh(extrudingSegments, {
      radius: EXTRUSION_RADIUS,
      color: DEFAULT_TOOLPATH_COLOR,
      metalness: 0.25,
      roughness: 0.35
    });
    if (extrusionMesh) {
      extrusionMesh.name = `${data.meta.id}-extrusion`;
      viewer.group.add(extrusionMesh);
      meshes.push(extrusionMesh);
    }

    if (travelSegments.length > 0) {
      const travelColor = new THREE.Color(DEFAULT_TOOLPATH_COLOR).lerp(
        new THREE.Color('#94a3b8'),
        0.7
      );
      const travelMesh = createSegmentMesh(travelSegments, {
        radius: TRAVEL_RADIUS,
        color: travelColor,
        opacity: 0.4,
        metalness: 0.1,
        roughness: 0.75
      });
      if (travelMesh) {
        travelMesh.name = `${data.meta.id}-travel`;
        viewer.group.add(travelMesh);
        meshes.push(travelMesh);
      }
    }

    if (meshes.length === 0) {
      return;
    }

    const bounds = new THREE.Box3();
    meshes.forEach((mesh) => bounds.expandByObject(mesh));
    if (!bounds.isEmpty()) {
      fitCameraToBox(viewer.camera, viewer.controls, bounds);
    }
  }, [parsedResult.data, layerSlice, maxLayer, showTravelMoves, viewerRef]);

  const handleLayerChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number.parseInt(event.target.value, 10);
      if (Number.isNaN(nextValue)) {
        updateLayerSlice(0);
        return;
      }
      updateLayerSlice(nextValue);
    },
    [updateLayerSlice]
  );

  const handleZoomToFit = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) {
      return;
    }
    const bounds = new THREE.Box3();
    let hasBounds = false;
    viewer.group.children.forEach((child) => {
      const objectBounds = new THREE.Box3().setFromObject(child);
      if (!hasBounds) {
        bounds.copy(objectBounds);
        hasBounds = true;
      } else {
        bounds.union(objectBounds);
      }
    });
    if (hasBounds) {
      fitCameraToBox(viewer.camera, viewer.controls, bounds);
    }
  }, [viewerRef]);

  const handleResetCamera = useCallback(() => {
    const viewer = viewerRef.current;
    const initial = initialCameraRef.current;
    if (!viewer || !initial) {
      return;
    }
    viewer.camera.position.copy(initial.position);
    viewer.controls.target.copy(initial.target);
    viewer.camera.updateProjectionMatrix();
    viewer.controls.update();
  }, [initialCameraRef, viewerRef]);

  const toggleFullscreen = useCallback(() => {
    if (!wrapperRef.current) {
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void wrapperRef.current.requestFullscreen();
    }
  }, [wrapperRef]);

  const handleTravelMovesChange = useCallback((visible: boolean) => {
    setShowTravelMoves(visible);
  }, []);

  const maxLayerDisplay = Math.max(maxLayer, 0);
  const infoFiles = useMemo(
    () =>
      parsedResult.data
        ? [
            {
              name: parsedResult.data.meta.name,
              color: DEFAULT_TOOLPATH_COLOR,
              layers: parsedResult.data.layers,
              estimatedHeight: parsedResult.data.estimatedHeight,
              bounds: parsedResult.data.bounds,
              metadata: parsedResult.data.metadata,
              totalCommands: parsedResult.data.totalCommands
            }
          ]
        : [],
    [parsedResult.data]
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-300" htmlFor="layer-range">
              {t('viewer.displayedLayer')}:{' '}
              <span className="font-semibold text-white">{layerSlice}</span> /{' '}
              <span>{maxLayerDisplay}</span>
            </label>
            <input
              id="layer-range"
              type="range"
              min={0}
              max={maxLayerDisplay}
              value={Math.min(layerSlice, maxLayerDisplay)}
              onChange={handleLayerChange}
              className="h-2 w-48 cursor-pointer rounded-lg bg-slate-700 accent-brand-light disabled:cursor-not-allowed"
              disabled={maxLayerDisplay === 0}
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
                {isSidebarOpen
                  ? t('viewer.hideSidebar')
                  : t('viewer.showSidebar')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setInfoOpen((previous) => !previous)}
              aria-expanded={isInfoOpen}
              className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
            >
              {isInfoOpen ? t('viewer.hideInfo') : t('viewer.showInfo')}
            </button>
            <button
              type="button"
              onClick={handleZoomToFit}
              className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
            >
              {t('viewer.zoomToFit')}
            </button>
            <button
              type="button"
              onClick={handleResetCamera}
              className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
            >
              {t('viewer.resetCamera')}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
            >
              {isFullscreen ? t('viewer.exitFullscreen') : t('viewer.fullscreen')}
            </button>
          </div>
        </div>
        <div ref={wrapperRef} className="relative flex flex-1 bg-slate-950">
          <div ref={mountRef} className="h-full w-full" />
          {parseError && (
            <div className="pointer-events-none absolute inset-0 flex items-end justify-start p-4">
              <div className="pointer-events-auto max-w-md rounded-md border border-yellow-500/60 bg-slate-900/90 px-4 py-3 text-xs text-yellow-300">
                {parseError}
              </div>
            </div>
          )}
        </div>
      </div>
      <InfoPanel
        files={infoFiles}
        isOpen={isInfoOpen}
        currentLayer={Math.min(layerSlice, maxLayerDisplay)}
        maxLayer={maxLayerDisplay}
        showTravelMoves={showTravelMoves}
        onTravelMovesChange={handleTravelMovesChange}
      />
    </div>
  );
};

export default GCodeViewerWrapper;
