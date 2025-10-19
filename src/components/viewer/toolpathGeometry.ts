import * as THREE from 'three';
import type { ToolpathSegment } from '../../utils/readGCode';
import type { ParsedFile } from './types';

export const DEFAULT_TOOLPATH_COLOR = '#3b82f6';
export const EXTRUSION_RADIUS = 0.4;
export const TRAVEL_RADIUS = EXTRUSION_RADIUS * 0.4;
export const SEGMENT_RADIAL_SEGMENTS = 10;

const UP_AXIS = new THREE.Vector3(0, 1, 0);
const TEMP_START = new THREE.Vector3();
const TEMP_END = new THREE.Vector3();
const TEMP_DIRECTION = new THREE.Vector3();
const TEMP_MIDPOINT = new THREE.Vector3();
const TEMP_QUATERNION = new THREE.Quaternion();
const TEMP_SCALE = new THREE.Vector3();
const TEMP_MATRIX = new THREE.Matrix4();
const TEMP_BOUNDS_START = new THREE.Vector3();
const TEMP_BOUNDS_END = new THREE.Vector3();

export type SegmentMeshConfig = {
  readonly radius: number;
  readonly color: THREE.ColorRepresentation;
  readonly opacity?: number;
  readonly metalness?: number;
  readonly roughness?: number;
};

export const collectSegments = (data: ParsedFile, maxLayer: number): ToolpathSegment[] => {
  if (data.layers.length === 0) {
    return [];
  }
  return data.layers
    .filter((layer) => layer.index <= maxLayer)
    .flatMap((layer) => layer.segments);
};

export const computeSegmentsBounds = (
  segments: ToolpathSegment[],
  padding = 0
): THREE.Box3 => {
  const bounds = new THREE.Box3();
  if (segments.length === 0) {
    return bounds;
  }

  let initialized = false;
  for (const segment of segments) {
    TEMP_BOUNDS_START.fromArray(segment.start);
    TEMP_BOUNDS_END.fromArray(segment.end);

    if (!initialized) {
      bounds.min.copy(TEMP_BOUNDS_START);
      bounds.max.copy(TEMP_BOUNDS_START);
      bounds.expandByPoint(TEMP_BOUNDS_END);
      initialized = true;
      continue;
    }

    bounds.expandByPoint(TEMP_BOUNDS_START);
    bounds.expandByPoint(TEMP_BOUNDS_END);
  }

  if (padding > 0) {
    bounds.expandByScalar(padding);
  }

  return bounds;
};

export const createSegmentMesh = (
  segments: ToolpathSegment[],
  config: SegmentMeshConfig
): THREE.InstancedMesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial> | null => {
  if (segments.length === 0) {
    return null;
  }

  const geometry = new THREE.CylinderGeometry(
    config.radius,
    config.radius,
    1,
    SEGMENT_RADIAL_SEGMENTS,
    1,
    false
  );
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: config.color,
    metalness: config.metalness ?? 0.15,
    roughness: config.roughness ?? 0.55,
    opacity: config.opacity ?? 1,
    transparent: (config.opacity ?? 1) < 1
  });
  material.side = THREE.DoubleSide;

  const mesh = new THREE.InstancedMesh(geometry, material, segments.length);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.castShadow = false;
  mesh.receiveShadow = false;

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    TEMP_START.fromArray(segment.start);
    TEMP_END.fromArray(segment.end);
    TEMP_DIRECTION.subVectors(TEMP_END, TEMP_START);
    const length = TEMP_DIRECTION.length();
    if (length <= Number.EPSILON) {
      TEMP_MATRIX.identity();
      mesh.setMatrixAt(index, TEMP_MATRIX);
      continue;
    }
    TEMP_DIRECTION.normalize();
    TEMP_QUATERNION.setFromUnitVectors(UP_AXIS, TEMP_DIRECTION);
    TEMP_MIDPOINT.addVectors(TEMP_START, TEMP_END).multiplyScalar(0.5);
    TEMP_SCALE.set(1, length, 1);
    TEMP_MATRIX.compose(TEMP_MIDPOINT, TEMP_QUATERNION, TEMP_SCALE);
    mesh.setMatrixAt(index, TEMP_MATRIX);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
};
