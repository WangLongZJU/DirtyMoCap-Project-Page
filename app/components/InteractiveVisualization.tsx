'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type InteractiveVisualizationProps = {
  meshUrl: string;
  anchorsUrl: string;
};

const INITIAL_OPACITY = 0.35;
const ANCHOR_RADIUS_RATIO = 0.0055;

export default function InteractiveVisualization({
  meshUrl,
  anchorsUrl,
}: InteractiveVisualizationProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const meshMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const resetViewRef = useRef<(() => void) | null>(null);
  const [opacity, setOpacity] = useState(INITIAL_OPACITY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    meshMaterialsRef.current.forEach((material) => {
      material.opacity = opacity;
      material.needsUpdate = true;
    });
  }, [opacity]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let disposed = false;
    let animationFrame = 0;
    let resizeFrame = 0;
    let isVisible = true;
    let dragging = false;
    let previousX = 0;
    let previousY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let modelSize = new THREE.Vector3(1, 1, 1);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xedf1ef, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-label', 'Interactive DirtyMoCap mesh and anchor visualization');
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.tabIndex = 0;
    viewport.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x718078, 2.4));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.7);
    keyLight.position.set(3, 4, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xcfe3da, 1.4);
    rimLight.position.set(-4, 1, -3);
    scene.add(rimLight);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const fitCamera = (observedWidth?: number, observedHeight?: number) => {
      const width = Math.round(observedWidth ?? viewport.clientWidth);
      const height = Math.round(observedHeight ?? viewport.clientHeight);
      if (!width || !height) return;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 700 ? 1.5 : 2));
      renderer.setSize(width, height, false);

      const aspect = width / height;
      const viewHeight = Math.max(
        modelSize.y * 1.2,
        (modelSize.x / Math.max(aspect, 0.01)) * 1.2,
      );
      camera.left = (-viewHeight * aspect) / 2;
      camera.right = (viewHeight * aspect) / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.near = 0.01;
      camera.far = Math.max(modelSize.length() * 12, 20);
      camera.position.z = Math.max(modelSize.length() * 2.5, 5);
      camera.updateProjectionMatrix();
    };

    const resetView = () => {
      targetRotationX = 0;
      targetRotationY = 0;
    };
    resetViewRef.current = resetView;

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.classList.add('is-dragging');
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const deltaX = event.clientX - previousX;
      const deltaY = event.clientY - previousY;
      previousX = event.clientX;
      previousY = event.clientY;
      targetRotationY += deltaX * 0.008;
      targetRotationX = THREE.MathUtils.clamp(
        targetRotationX + deltaY * 0.006,
        -Math.PI * 0.45,
        Math.PI * 0.45,
      );
    };

    const finishDrag = (event: PointerEvent) => {
      dragging = false;
      renderer.domElement.classList.remove('is-dragging');
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const step = 0.12;
      if (event.key === 'ArrowLeft') targetRotationY -= step;
      else if (event.key === 'ArrowRight') targetRotationY += step;
      else if (event.key === 'ArrowUp') targetRotationX -= step;
      else if (event.key === 'ArrowDown') targetRotationX += step;
      else if (event.key.toLowerCase() === 'r') resetView();
      else return;
      event.preventDefault();
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', finishDrag);
    renderer.domElement.addEventListener('pointercancel', finishDrag);
    renderer.domElement.addEventListener('keydown', onKeyDown);

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;

      const boxSize = Array.isArray(entry.contentBoxSize)
        ? entry.contentBoxSize[0]
        : entry.contentBoxSize;
      const width = boxSize?.inlineSize ?? entry.contentRect.width;
      const height = boxSize?.blockSize ?? entry.contentRect.height;

      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        if (!disposed) fitCamera(width, height);
      });
    });
    resizeObserver.observe(viewport);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { rootMargin: '180px', threshold: 0.01 },
    );
    visibilityObserver.observe(viewport);

    const render = () => {
      animationFrame = window.requestAnimationFrame(render);
      if (!isVisible) return;
      modelGroup.rotation.x += (targetRotationX - modelGroup.rotation.x) * 0.12;
      modelGroup.rotation.y += (targetRotationY - modelGroup.rotation.y) * 0.12;
      renderer.render(scene, camera);
    };
    render();

    const loadModels = async () => {
      try {
        const loader = new OBJLoader();
        const [meshObject, anchorObject] = await Promise.all([
          loader.loadAsync(meshUrl),
          loader.loadAsync(anchorsUrl),
        ]);
        if (disposed) return;

        const meshMaterials: THREE.MeshStandardMaterial[] = [];
        meshObject.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const originalGeometry = child.geometry;
          originalGeometry.deleteAttribute('normal');
          const smoothGeometry = mergeVertices(originalGeometry, 1e-5);
          smoothGeometry.computeVertexNormals();
          child.geometry = smoothGeometry;
          if (smoothGeometry !== originalGeometry) originalGeometry.dispose();

          const material = new THREE.MeshStandardMaterial({
            color: 0xb9c7c0,
            roughness: 0.72,
            metalness: 0,
            flatShading: false,
            transparent: true,
            opacity: INITIAL_OPACITY,
            depthWrite: false,
            side: THREE.DoubleSide,
          });
          child.material = material;
          child.renderOrder = 1;
          meshMaterials.push(material);
        });
        meshMaterialsRef.current = meshMaterials;

        anchorObject.updateMatrixWorld(true);
        const anchorPositions: THREE.Vector3[] = [];
        anchorObject.traverse((child) => {
          if (!(child instanceof THREE.Points) && !(child instanceof THREE.Mesh)) return;
          const position = child.geometry.getAttribute('position');
          if (!position) return;
          for (let index = 0; index < position.count; index += 1) {
            const point = new THREE.Vector3().fromBufferAttribute(position, index);
            child.localToWorld(point);
            anchorPositions.push(point);
          }
        });

        const bounds = new THREE.Box3().setFromObject(meshObject);
        anchorPositions.forEach((position) => bounds.expandByPoint(position));
        const center = bounds.getCenter(new THREE.Vector3());
        modelSize = bounds.getSize(new THREE.Vector3());
        meshObject.position.sub(center);

        const radius = Math.max(modelSize.length() * ANCHOR_RADIUS_RATIO, 0.006);
        const anchorGeometry = new THREE.SphereGeometry(radius, 18, 12);
        const anchorMaterial = new THREE.MeshStandardMaterial({
          color: 0xe84e3d,
          emissive: 0x5c0d08,
          emissiveIntensity: 0.12,
          roughness: 0.52,
          metalness: 0,
        });
        const anchors = new THREE.InstancedMesh(
          anchorGeometry,
          anchorMaterial,
          anchorPositions.length,
        );
        const transform = new THREE.Object3D();
        anchorPositions.forEach((position, index) => {
          transform.position.copy(position).sub(center);
          transform.updateMatrix();
          anchors.setMatrixAt(index, transform.matrix);
        });
        anchors.instanceMatrix.needsUpdate = true;
        anchors.renderOrder = 2;

        modelGroup.add(meshObject, anchors);
        fitCamera();
        setIsLoading(false);
      } catch (loadError) {
        console.error(loadError);
        if (!disposed) {
          setError('Unable to load the OBJ visualization.');
          setIsLoading(false);
        }
      }
    };
    void loadModels();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', finishDrag);
      renderer.domElement.removeEventListener('pointercancel', finishDrag);
      renderer.domElement.removeEventListener('keydown', onKeyDown);
      resetViewRef.current = null;
      meshMaterialsRef.current = [];

      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.Points)) return;
        geometries.add(object.geometry);
        const objectMaterials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        objectMaterials.forEach((material) => materials.add(material));
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [anchorsUrl, meshUrl]);

  return (
    <div className="obj-viewer">
      <div className="obj-viewer-toolbar">
        <div className="obj-viewer-legend" aria-label="Visualization legend">
          <span><i className="mesh-swatch" />Mesh</span>
          <span><i className="anchor-swatch" />Anchors</span>
        </div>

        <label className="opacity-control">
          <span>Mesh opacity</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={opacity}
            onChange={(event) => setOpacity(Number(event.target.value))}
            aria-valuetext={`${Math.round(opacity * 100)} percent`}
          />
          <output>{Math.round(opacity * 100)}%</output>
        </label>

        <button
          className="viewer-reset-button"
          type="button"
          onClick={() => resetViewRef.current?.()}
        >
          Reset view
        </button>
      </div>

      <div className="obj-viewer-stage">
        <div ref={viewportRef} className="obj-viewer-viewport" />
        {isLoading && !error && (
          <div className="viewer-stage-message" role="status">
            Loading visualization…
          </div>
        )}
        {error && (
          <div className="viewer-stage-message is-error" role="alert">
            {error}
          </div>
        )}
        <p className="viewer-stage-hint">Drag to rotate · Arrow keys also work</p>
      </div>
    </div>
  );
}
