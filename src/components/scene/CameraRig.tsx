'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { getCompartmentMeta } from '@/data/compartments';
import type {
  CompartmentId,
  FridgeModelType,
  StorageUnitType,
} from '@/types/pantry';

interface CameraRigProps {
  activeUnit: StorageUnitType;
  fridgeModel: FridgeModelType;
  highlightedCompartmentId: CompartmentId | null;
  resetCounter: number;
}

function getDefaultCamera(
  activeUnit: StorageUnitType,
  fridgeModel: FridgeModelType,
): { pos: [number, number, number]; target: [number, number, number] } {
  if (activeUnit === 'cabinet') {
    return { pos: [3.4, 1.25, 5.2], target: [0, 0.05, 0] };
  }
  switch (fridgeModel) {
    case 'side-by-side':
    case 'french-door':
      return { pos: [3.6, 1.4, 5.8], target: [0.1, 0.05, 0] };
    case 'mini-fridge':
      return { pos: [2.6, 0.9, 4.1], target: [0.05, -0.35, 0] };
    default:
      return { pos: [3.2, 1.35, 5.1], target: [0.15, 0.05, 0] };
  }
}

export function CameraRig({
  activeUnit,
  fridgeModel,
  highlightedCompartmentId,
  resetCounter,
}: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const isAnimatingRef = useRef(false);
  const desiredPosRef = useRef(new THREE.Vector3(3.2, 1.35, 5.1));
  const desiredTargetRef = useRef(new THREE.Vector3(0.15, 0.05, 0));

  useEffect(() => {
    const meta = highlightedCompartmentId
      ? getCompartmentMeta(highlightedCompartmentId)
      : undefined;
    if (meta && meta.unit === activeUnit) {
      desiredPosRef.current.set(...meta.cameraPosition);
      desiredTargetRef.current.set(...meta.cameraTarget);
    } else {
      const def = getDefaultCamera(activeUnit, fridgeModel);
      desiredPosRef.current.set(...def.pos);
      desiredTargetRef.current.set(...def.target);
    }
    isAnimatingRef.current = true;
  }, [activeUnit, fridgeModel, highlightedCompartmentId, resetCounter]);

  useFrame((_, delta) => {
    if (!isAnimatingRef.current || !controlsRef.current) return;
    const step = Math.min(1, delta * 4.5);
    camera.position.lerp(desiredPosRef.current, step);
    controlsRef.current.target.lerp(desiredTargetRef.current, step);
    controlsRef.current.update();

    if (
      camera.position.distanceTo(desiredPosRef.current) < 0.04 &&
      controlsRef.current.target.distanceTo(desiredTargetRef.current) < 0.04
    ) {
      isAnimatingRef.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      minDistance={2.3}
      maxDistance={9.5}
      maxPolarAngle={Math.PI * 0.56}
      minPolarAngle={Math.PI * 0.14}
      onStart={() => {
        isAnimatingRef.current = false;
      }}
    />
  );
}
