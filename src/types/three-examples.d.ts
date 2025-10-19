import type { Camera, Vector3 } from 'three';
import { EventDispatcher } from 'three';

declare module 'three/examples/jsm/controls/OrbitControls' {
  class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);

    object: Camera;
    domElement: HTMLElement | Document;
    enabled: boolean;
    target: Vector3;
    screenSpacePanning: boolean;
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    zoomSpeed: number;
    enableRotate: boolean;
    rotateSpeed: number;

    update(): boolean;
    saveState(): void;
    reset(): void;
    dispose(): void;
    listenToKeyEvents(domElement: HTMLElement): void;
  }

  export { OrbitControls };
}

declare module 'three/examples/jsm/controls/OrbitControls.js' {
  export * from 'three/examples/jsm/controls/OrbitControls';
}
