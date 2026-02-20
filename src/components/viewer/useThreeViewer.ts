import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createAxisLabel, disposeGroupChildren } from './sceneUtils';
import type { InitialCameraState, ThreeContext } from './types';
import { getThreeColors } from '../../theme/getThreeColors';

type UseThreeViewerParams = {
  mountRef: React.RefObject<HTMLDivElement | null>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
};

export const useThreeViewer = ({
  mountRef,
  wrapperRef
}: UseThreeViewerParams): {
  viewerRef: React.RefObject<ThreeContext | null>;
  initialCameraRef: React.RefObject<InitialCameraState | null>;
} => {
  const viewerRef = useRef<ThreeContext | null>(null);
  const initialCameraRef = useRef<InitialCameraState | null>(null);

  useEffect(() => {
    const mountElement = mountRef.current;
    if (!mountElement || viewerRef.current) {
      return;
    }

    const width = mountElement.clientWidth || 800;
    const height = mountElement.clientHeight || 600;

    // Get current theme colors
    const colors = getThreeColors();

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(colors.bg);
    mountElement.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = colors.bg.clone();

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

    // Create grid with helper function to recreate it on theme changes
    const createGrid = () => {
      const gridColors = getThreeColors();
      const newGrid = new THREE.GridHelper(400, 40, gridColors.grid, gridColors.grid);
      const gridMaterial = newGrid.material as THREE.Material;
      if (Array.isArray(gridMaterial)) {
        gridMaterial.forEach((mat) => {
          mat.transparent = true;
          mat.opacity = 0.18;
        });
      } else {
        gridMaterial.transparent = true;
        gridMaterial.opacity = 0.18;
      }
      newGrid.rotation.x = Math.PI / 2;
      return newGrid;
    };

    const grid = createGrid();
    scene.add(grid);

    const axes = new THREE.AxesHelper(80);
    scene.add(axes);

    const axisLabels = new THREE.Group();
    const labelDistance = 90;

    const createAxisLabels = () => {
      const labelColors = getThreeColors();
      return [
        createAxisLabel('X', labelColors.axisX.getHexString(), new THREE.Vector3(labelDistance, 0, 0)),
        createAxisLabel('Y', labelColors.axisY.getHexString(), new THREE.Vector3(0, labelDistance, 0)),
        createAxisLabel('Z', labelColors.axisZ.getHexString(), new THREE.Vector3(0, 0, labelDistance))
      ];
    };

    createAxisLabels().forEach((label) => axisLabels.add(label));
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

    // Function to update scene colors when theme changes
    const updateSceneColors = () => {
      const newColors = getThreeColors();
      renderer.setClearColor(newColors.bg);
      if (scene.background instanceof THREE.Color) {
        scene.background.copy(newColors.bg);
      }
      
      // Update grid material directly - GridHelper has material property
      const gridMaterial = grid.material as THREE.Material;
      if (gridMaterial) {
        if (Array.isArray(gridMaterial)) {
          gridMaterial.forEach((mat) => {
            if (mat instanceof THREE.LineBasicMaterial) {
              mat.color.copy(newColors.grid);
            }
          });
        } else if (gridMaterial instanceof THREE.LineBasicMaterial) {
          gridMaterial.color.copy(newColors.grid);
        }
      }
      
      // Update mesh materials in the group (toolpath and travel meshes)
      group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            if (mat instanceof THREE.MeshPhysicalMaterial || mat instanceof THREE.MeshStandardMaterial) {
              // Update color based on mesh type
              if (child.name.includes('extrusion')) {
                mat.color.copy(getThreeColors().toolpath);
              } else if (child.name.includes('travel')) {
                mat.color.copy(getThreeColors().travel);
              } else {
                mat.color.copy(newColors.mesh);
              }
            }
          });
        }
      });

      // Recreate axis labels with new colors
      disposeGroupChildren(axisLabels);
      createAxisLabels().forEach((label) => axisLabels.add(label));
    };

    // Listen for theme changes on html element
    const themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // Use requestAnimationFrame to ensure DOM has updated before reading CSS
          window.requestAnimationFrame(() => {
            updateSceneColors();
          });
        }
      });
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      themeObserver.disconnect();
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
  }, [mountRef, wrapperRef]);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
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
  }, [wrapperRef]);

  return { viewerRef, initialCameraRef };
};
