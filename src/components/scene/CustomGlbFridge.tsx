'use client';

import { useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface CustomGlbFridgeProps {
  url: string;
  fileName: string;
  onErrorFallback: () => void;
}

export function CustomGlbFridge({
  url,
  fileName,
  onErrorFallback,
}: CustomGlbFridgeProps) {
  const [sceneObj, setSceneObj] = useState<THREE.Group | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSceneObj(null);
    setErrorMsg(null);

    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        if (cancelled) return;
        const root = gltf.scene.clone(true);

        // Enable shadows on all meshes
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Auto-normalize size & center to fit our 3D stage cleanly
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        const scale = 3.5 / maxDim;

        const wrapper = new THREE.Group();
        root.position.set(-center.x, -center.y, -center.z);
        wrapper.add(root);
        wrapper.scale.setScalar(scale);

        // Re-align bottom to y = -1.85 so it sits cleanly on the shadow plane
        const scaledBox = new THREE.Box3().setFromObject(wrapper);
        wrapper.position.y -= scaledBox.min.y + 1.85;

        setSceneObj(wrapper);
      },
      undefined,
      () => {
        if (cancelled) return;
        setErrorMsg('模型解析失败，请确认上传的是有效的 .glb 或 .gltf 文件。');
      },
    );

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (errorMsg) {
    return (
      <Html center>
        <div className="w-64 rounded-2xl border border-red-300 bg-white p-4 text-center shadow-xl">
          <p className="text-xs font-bold text-red-700">{errorMsg}</p>
          <button
            type="button"
            onClick={onErrorFallback}
            className="mt-3 rounded-xl bg-teal-700 px-3 py-1.5 text-xs font-bold text-white"
          >
            切回内置交互 3D 冰箱
          </button>
        </div>
      </Html>
    );
  }

  if (!sceneObj) {
    return (
      <Html center>
        <div className="rounded-xl bg-white/95 px-4 py-2 text-xs font-bold text-stone-700 shadow-md">
          正在载入您的 3D 模型「{fileName}」…
        </div>
      </Html>
    );
  }

  return <primitive object={sceneObj} />;
}
