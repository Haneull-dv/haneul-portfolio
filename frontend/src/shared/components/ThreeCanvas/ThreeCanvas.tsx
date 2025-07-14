// components/ThreeCanvas.tsx
"use client"; // Next.js 13+ App Router 환경에서는 클라이언트 컴포넌트로 명시해야 합니다.

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// CSS를 컴포넌트 파일에 직접 포함 (또는 별도 CSS 파일로 분리)
const styles = `
  .webgl-canvas-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1; /* 다른 콘텐츠 뒤에 위치하도록 */
  }

  #webgl-canvas {
    width: 100%;
    height: 100%;
    background: radial-gradient(
      circle farthest-corner at center top,
      #071021,
      #19324a
    );
  }
`;

// Stage 클래스 (TypeScript 적용)
class Stage {
  renderParam: { width: number; height: number; };
  cameraParam: { fov: number; lookAt: THREE.Vector3; };
  fogParam: { color: number; start: number; end: number; };
  scene: THREE.Scene | null = null;
  camera: THREE.PerspectiveCamera | null = null;
  renderer: THREE.WebGLRenderer | null = null;
  isInitialized = false;

  constructor() {
    this.renderParam = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    this.cameraParam = {
      fov: 70,
      lookAt: new THREE.Vector3(0, 0, 0)
    };
    this.fogParam = {
      color: 0x000000,
      start: 50,
      end: 2000
    };
  }

  init(canvas: HTMLCanvasElement) {
    this._setScene();
    this._setRender(canvas);
    this._setCamera();
    this._setFog();
    this.isInitialized = true;
  }

  _setScene() {
    this.scene = new THREE.Scene();
  }

  _setRender(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.renderParam.width, this.renderParam.height);
  }

  _setCamera() {
    if (!this.camera) {
      this.camera = new THREE.PerspectiveCamera(
        this.cameraParam.fov,
        this.renderParam.width / this.renderParam.height
      );
      this.camera.lookAt(this.cameraParam.lookAt);
    }
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer?.setSize(window.innerWidth, window.innerHeight);
  }

  _setFog() {
    if (this.scene) {
      // fogParam.fov -> fogParam.color 로 수정 (원본 코드의 오타 수정)
      this.scene.fog = new THREE.Fog(
        this.fogParam.color,
        this.fogParam.start,
        this.fogParam.end
      );
    }
  }

  _render(rot: number) {
    if (!this.camera || !this.renderer || !this.scene) return;
    const radian = (rot * Math.PI) / 180;
    this.camera.position.x = 1000 * Math.sin(radian);
    this.camera.position.z = 1000 * Math.cos(radian);
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this._setCamera();
  }
}

// Mesh 클래스 (TypeScript 적용)
class Mesh {
  stage: Stage;
  mesh: THREE.Points | null = null;

  constructor(stage: Stage) {
    this.stage = stage;
  }

  init() {
    this._setMesh();
  }

  _setMesh() {
    const vertices = [];
    const SIZE = 3000;
    const LENGTH = 3000;
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
      color: 0xffffff
    });

    for (let i = 0; i < LENGTH; i++) {
      const x = SIZE * (Math.random() - 0.5);
      const y = SIZE * (Math.random() - 0.5);
      const z = SIZE * (Math.random() - 0.5);
      vertices.push(x, y, z);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    this.mesh = new THREE.Points(geometry, material);
    this.stage.scene?.add(this.mesh);
  }

  _render() {
    if (this.mesh) {
      this.mesh.rotation.y += 0.001;
    }
  }
}

// React 컴포넌트
const ThreeCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const stage = new Stage();
    stage.init(canvasRef.current);

    const mesh = new Mesh(stage);
    mesh.init();

    let rot = 0;

    const raf = () => {
      rot += 0.1;
      stage._render(rot);
      mesh._render();
      requestAnimationFrame(raf);
    };

    const handleResize = () => {
      stage.onResize();
    };

    window.addEventListener('resize', handleResize);
    raf();

    // Cleanup 함수: 컴포넌트가 언마운트될 때 이벤트 리스너 제거
    return () => {
      window.removeEventListener('resize', handleResize);
      // 필요하다면 renderer, scene 등 리소스 정리 코드를 추가할 수 있습니다.
    };
  }, []); // 빈 배열을 전달하여 컴포넌트 마운트 시 한 번만 실행되도록 함

  return (
    <>
      <style>{styles}</style>
      <div className="webgl-canvas-container">
        <canvas ref={canvasRef} id="webgl-canvas"></canvas>
      </div>
    </>
  );
};

export default ThreeCanvas;