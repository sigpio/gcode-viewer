import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createAxisLabel, disposeGroupChildren } from './sceneUtils';
import type { InitialCameraState, ThreeContext } from './types';

type UseThreeViewerParams = {
  mountRef: React.MutableRefObject<HTMLDivElement | null>;
  wrapperRef: React.MutableRefObject<HTMLDivElement | null>;
};

export const useThreeViewer = ({
  mountRef,
  wrapperRef
}: UseThreeViewerParams): {
  viewerRef: MutableRefObject<ThreeContext | null>;
  initialCameraRef: MutableRefObject<InitialCameraState | null>;
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
    axisLabels.add(createAxisLabel('X', '#f97316', new THREE.Vector3(labelDistance, 0, 0)));
    axisLabels.add(createAxisLabel('Y', '#22c55e', new THREE.Vector3(0, labelDistance, 0)));
    axisLabels.add(createAxisLabel('Z', '#38bdf8', new THREE.Vector3(0, 0, labelDistance)));
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
