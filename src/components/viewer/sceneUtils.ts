import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const fitCameraToBox = (
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

export const disposeGroupChildren = (group: THREE.Group) => {
  while (group.children.length > 0) {
    const child = group.children[0]!;
    group.remove(child);
    if (child instanceof THREE.InstancedMesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else {
        child.material.dispose();
      }
      continue;
    }
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

export const createAxisLabel = (
  text: string,
  color: string,
  position: THREE.Vector3
): THREE.Sprite => {
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
