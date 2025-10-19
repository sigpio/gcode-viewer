import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import type { GCodeFileRecord } from '../context/FileStore';
import { parseGCode, type ParsedGCode, type ToolpathSegment } from '../utils/readGCode';
import InfoPanel from './InfoPanel';
import { useTranslation } from 'react-i18next';

type ViewerProps = {
  readonly file: GCodeFileRecord | null;
  readonly onToggleSidebar?: () => void;
  readonly isSidebarOpen?: boolean;
};

type ThreeContext = {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  controls: OrbitControls;
  group: THREE.Group;
  axisLabels: THREE.Group;
  animationId: number | null;
};

type ParsedFile = ParsedGCode & {
  readonly meta: Pick<GCodeFileRecord, 'id' | 'name'>;
};

const DEFAULT_TOOLPATH_COLOR = '#3b82f6';

const collectSegments = (data: ParsedFile, maxLayer: number): ToolpathSegment[] => {
  if (data.layers.length === 0) {
    return [];
  }
  return data.layers
    .filter((layer) => layer.index <= maxLayer)
    .flatMap((layer) => layer.segments);
};

const buildGeometry = (segments: ToolpathSegment[], colorHex: string) => {
  const positions: number[] = [];
  const colors: number[] = [];

  const color = new THREE.Color(colorHex);
  const travelColor = color.clone().lerp(new THREE.Color('#94a3b8'), 0.75);

  for (const segment of segments) {
    const tint = segment.extruding ? color : travelColor;
    positions.push(...segment.start, ...segment.end);
    colors.push(tint.r, tint.g, tint.b, tint.r, tint.g, tint.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(new Float32Array(positions), 3)
  );
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(colors), 3));
  return geometry;
};

const fitCameraToBox = (
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  box: THREE.Box3
) => {
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z, 1);

  controls.target.copy(center);

  const distance = maxSize * 1.5;
  camera.position.set(center.x + distance, center.y + distance, center.z + distance);
  camera.near = Math.max(distance / 200, 0.1);
  camera.far = Math.max(distance * 20, 2000);
  camera.updateProjectionMatrix();
  controls.update();
};

const disposeGroupChildren = (group: THREE.Group) => {
  while (group.children.length > 0) {
    const child = group.children[0]!;
    group.remove(child);
    if (child instanceof THREE.LineSegments) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else {
        child.material.dispose();
      }
    } else if (child instanceof THREE.Sprite) {
      if (child.material.map) {
        child.material.map.dispose();
      }
      child.material.dispose();
    }
  }
};

const createAxisLabel = (text: string, color: string, position: THREE.Vector3): THREE.Sprite => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context non disponibile.');
  }
  context.clearRect(0, 0, size, size);
  context.fillStyle = 'rgba(15, 23, 42, 0.85)';
  context.fillRect(0, 0, size, size);
  context.strokeStyle = color;
  context.lineWidth = 6;
  context.strokeRect(12, 12, size - 24, size - 24);
  context.fillStyle = color;
  context.font = 'bold 72px "Segoe UI", sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  const material = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    depthWrite: false,
    transparent: true
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  const spriteScale = 8;
  sprite.scale.set(spriteScale, spriteScale, spriteScale);
  sprite.renderOrder = 5;
  sprite.userData.texture = texture;
  return sprite;
};

const GCodeViewerWrapper = ({ file, onToggleSidebar, isSidebarOpen }: ViewerProps) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<ThreeContext | null>(null);
  const initialCameraRef = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  const [layerSlice, setLayerSlice] = useState<number>(0);
  const [maxLayer, setMaxLayer] = useState<number>(0);
  const [isFullscreen, setFullscreen] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
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

  useEffect(() => {
    if (parsedResult.errorFile) {
      setParseError(t('viewer.parseError', { file: parsedResult.errorFile }));
    } else {
      setParseError(null);
    }
  }, [parsedResult.errorFile, t]);

  useEffect(() => {
    const data = parsedResult.data;
    if (!data) {
      setLayerSlice(0);
      setMaxLayer(0);
      return;
    }
    const highestLayer = data.layers.length > 0 ? data.layers[data.layers.length - 1]!.index : 0;
    setMaxLayer(highestLayer);
    setLayerSlice(highestLayer);
  }, [parsedResult.data]);

  useEffect(() => {
    const mountElement = mountRef.current;
    if (!mountElement || viewerRef.current) {
      return;
    }

    const width = mountElement.clientWidth || 800;
    const height = mountElement.clientHeight || 600;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor('#020617');
    mountElement.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020617');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.up.set(0, 0, 1);
    camera.position.set(200, 200, 220);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.screenSpacePanning = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 1.2;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
    directionalLight.position.set(200, 400, 300);
    scene.add(ambientLight);
    scene.add(directionalLight);

    const grid = new THREE.GridHelper(400, 40, 0x1d4ed8, 0x1f2937);
    const gridMaterial = grid.material as THREE.Material;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.18;
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);

    const axes = new THREE.AxesHelper(80);
    scene.add(axes);

    const axisLabels = new THREE.Group();
    const labelDistance = 90;
    axisLabels.add(
      createAxisLabel('X', '#f97316', new THREE.Vector3(labelDistance, 0, 0))
    );
    axisLabels.add(
      createAxisLabel('Y', '#22c55e', new THREE.Vector3(0, labelDistance, 0))
    );
    axisLabels.add(
      createAxisLabel('Z', '#38bdf8', new THREE.Vector3(0, 0, labelDistance))
    );
    scene.add(axisLabels);

    const group = new THREE.Group();
    scene.add(group);

    const context: ThreeContext = {
      renderer,
      camera,
      scene,
      controls,
      group,
      axisLabels,
      animationId: null
    };
    viewerRef.current = context;
    initialCameraRef.current = {
      position: camera.position.clone(),
      target: controls.target.clone()
    };

    const renderLoop = () => {
      context.animationId = window.requestAnimationFrame(renderLoop);
      controls.update();
      renderer.render(scene, camera);
    };
    renderLoop();

    const handleResize = () => {
      const container = wrapperRef.current;
      if (!container) {
        return;
      }
      const nextWidth = container.clientWidth || width;
      const nextHeight = container.clientHeight || height;
      renderer.setSize(nextWidth, nextHeight);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (context.animationId !== null) {
        window.cancelAnimationFrame(context.animationId);
      }
      controls.dispose();
      disposeGroupChildren(axisLabels);
      disposeGroupChildren(group);
      renderer.dispose();
      scene.clear();
      if (mountElement.contains(renderer.domElement)) {
        mountElement.removeChild(renderer.domElement);
      }
      viewerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) {
      return;
    }
    const element = wrapperRef.current;
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => {
      const viewer = viewerRef.current;
      if (!viewer) {
        return;
      }
      const width = element.clientWidth || 1;
      const height = element.clientHeight || 1;
      viewer.renderer.setSize(width, height);
      viewer.camera.aspect = width / height;
      viewer.camera.updateProjectionMatrix();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === wrapperRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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
    const renderSegments = showTravelMoves ? segments : segments.filter((segment) => segment.extruding);
    if (renderSegments.length === 0) {
      return;
    }
    const geometry = buildGeometry(renderSegments, DEFAULT_TOOLPATH_COLOR);
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.95
    });
    const lines = new THREE.LineSegments(geometry, material);
    lines.name = data.meta.id;
    viewer.group.add(lines);

    const bounds = new THREE.Box3().setFromObject(lines);
    if (!bounds.isEmpty()) {
      fitCameraToBox(viewer.camera, viewer.controls, bounds);
    }
  }, [parsedResult.data, layerSlice, maxLayer, showTravelMoves]);

  const handleLayerChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number.parseInt(event.target.value, 10);
      if (Number.isNaN(nextValue)) {
        setLayerSlice(0);
        return;
      }
      setLayerSlice(Math.max(0, Math.min(nextValue, maxLayer)));
    },
    [maxLayer]
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
  }, []);

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
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!wrapperRef.current) {
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void wrapperRef.current.requestFullscreen();
    }
  }, []);

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
