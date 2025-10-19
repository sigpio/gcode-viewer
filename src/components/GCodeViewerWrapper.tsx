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
  computeSegmentsBounds,
  createSegmentMesh
} from './viewer/toolpathGeometry';
import { disposeGroupChildren, fitCameraToBox } from './viewer/sceneUtils';
import { useThreeViewer } from './viewer/useThreeViewer';
import ViewerToolbar from './viewer/ViewerToolbar';
import ParseErrorBanner from './viewer/ParseErrorBanner';

type ViewerProps = {
  readonly file: GCodeFileRecord | null;
  readonly onToggleSidebar?: () => void;
  readonly isSidebarOpen?: boolean;
};


const GCodeViewerWrapper = ({ file, onToggleSidebar, isSidebarOpen }: ViewerProps) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { viewerRef, initialCameraRef } = useThreeViewer({ mountRef, wrapperRef });
  const boundsRef = useRef<THREE.Box3 | null>(null);
  const shouldAutoFitRef = useRef<boolean>(true);

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
    shouldAutoFitRef.current = true;
  }, [currentFileId]);

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
      boundsRef.current = null;
      return;
    }

    disposeGroupChildren(viewer.group);

    const data = parsedResult.data;
    if (!data) {
      boundsRef.current = null;
      return;
    }

    const targetLayer = Math.min(layerSlice, maxLayer);
    const segments = collectSegments(data, targetLayer);
    if (segments.length === 0) {
      boundsRef.current = null;
      return;
    }
    const extrudingSegments = segments.filter((segment) => segment.extruding);
    const travelSegments =
      showTravelMoves && segments.some((segment) => !segment.extruding)
        ? segments.filter((segment) => !segment.extruding)
        : [];

    const visibleSegments =
      travelSegments.length > 0 ? [...extrudingSegments, ...travelSegments] : extrudingSegments;
    if (visibleSegments.length === 0) {
      boundsRef.current = null;
      return;
    }

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
      boundsRef.current = null;
      return;
    }

    const hasExtrusionSegments = visibleSegments.some((segment) => segment.extruding);
    const hasTravelSegments = visibleSegments.some((segment) => !segment.extruding);
    let boundsPadding = 0;
    if (hasExtrusionSegments && hasTravelSegments) {
      boundsPadding = Math.max(EXTRUSION_RADIUS, TRAVEL_RADIUS);
    } else if (hasExtrusionSegments) {
      boundsPadding = EXTRUSION_RADIUS;
    } else if (hasTravelSegments) {
      boundsPadding = TRAVEL_RADIUS;
    }

    const segmentBounds = computeSegmentsBounds(visibleSegments, boundsPadding);
    if (!segmentBounds.isEmpty()) {
      boundsRef.current = segmentBounds.clone();
      if (shouldAutoFitRef.current) {
        fitCameraToBox(viewer.camera, viewer.controls, segmentBounds);
        shouldAutoFitRef.current = false;
      }
    } else {
      boundsRef.current = null;
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
    const bounds = boundsRef.current;
    if (!viewer || !bounds || bounds.isEmpty()) {
      return;
    }
    fitCameraToBox(viewer.camera, viewer.controls, bounds);
    shouldAutoFitRef.current = false;
  }, [boundsRef, viewerRef]);

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

  const toggleInfoPanel = useCallback(() => {
    setInfoOpen((previous) => !previous);
  }, [setInfoOpen]);

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
        <ViewerToolbar
          layerSlice={layerSlice}
          maxLayer={maxLayerDisplay}
          onLayerChange={handleLayerChange}
          onToggleInfo={toggleInfoPanel}
          isInfoOpen={isInfoOpen}
          onZoomToFit={handleZoomToFit}
          onResetCamera={handleResetCamera}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          onToggleSidebar={onToggleSidebar}
          isSidebarOpen={isSidebarOpen}
          t={t}
        />
        <div ref={wrapperRef} className="relative flex flex-1 bg-slate-950">
          <div ref={mountRef} className="h-full w-full" />
          {parseError && <ParseErrorBanner message={parseError} />}
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
