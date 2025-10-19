import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ParsedGCode } from '../../utils/readGCode';
import type { GCodeFileRecord } from '../../context/FileStore';

export type ParsedFile = ParsedGCode & {
  readonly meta: Pick<GCodeFileRecord, 'id' | 'name'>;
};

export type ThreeContext = {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  controls: OrbitControls;
  group: THREE.Group;
  axisLabels: THREE.Group;
  animationId: number | null;
};

export type InitialCameraState = {
  position: THREE.Vector3;
  target: THREE.Vector3;
};
