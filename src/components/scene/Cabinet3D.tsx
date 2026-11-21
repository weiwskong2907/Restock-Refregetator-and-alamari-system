'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CABINET_COMPARTMENTS } from '@/data/compartments';
import { CompartmentZone } from './CompartmentZone';
import type { CompartmentId, DoorMode, InventoryItem } from '@/types/pantry';

interface Cabinet3DProps {
  items: InventoryItem[];
  doorMode: DoorMode;
  selectedCompartmentId: CompartmentId | null;
  highlightedCompartmentId: CompartmentId | null;
  selectedItemId: string | null;
  onSelectCompartment: (id: CompartmentId) => void;
  onSelectItem: (itemId: string) => void;
  onToggleDoor: () => void;
}

export function Cabinet3D({
  items,
  doorMode,
  selectedCompartmentId,
  highlightedCompartmentId,
  selectedItemId,
  onSelectCompartment,
  onSelectItem,
  onToggleDoor,
}: Cabinet3DProps) {
  const leftDoorRef = useRef<THREE.Group>(null);
  const rightDoorRef = useRef<THREE.Group>(null);
  const drawerRef = useRef<THREE.Group>(null);

  const isTransparent = doorMode === 'transparent';
  const drawerShouldSlideOut =
    doorMode === 'open' ||
    selectedCompartmentId === 'cabinet-drawer' ||
    highlightedCompartmentId === 'cabinet-drawer';

  useFrame((_, delta) => {
    const speed = Math.min(1, delta * 6.5);
    const targetOpen = doorMode === 'open' ? 1.85 : 0;

    if (leftDoorRef.current) {
      leftDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        leftDoorRef.current.rotation.y,
        -targetOpen,
        speed,
      );
    }
    if (rightDoorRef.current) {
      rightDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        rightDoorRef.current.rotation.y,
        targetOpen,
        speed,
      );
    }
    if (drawerRef.current) {
      const targetZ = drawerShouldSlideOut ? 0.52 : 0;
      drawerRef.current.position.z = THREE.MathUtils.lerp(
        drawerRef.current.position.z,
        targetZ,
        speed,
      );
    }
  });

  const byZone = (id: CompartmentId) => items.filter((i) => i.compartmentId === id);
  const bodyComps = CABINET_COMPARTMENTS.filter((c) => c.id !== 'cabinet-drawer');
  const drawerComp = CABINET_COMPARTMENTS.find((c) => c.id === 'cabinet-drawer')!;

  const woodOuter = '#c79f72';
  const woodShelf = '#e6d3b8';
  const doorFace = '#f3ece0';
  const brass = '#b45309';

  return (
    <group position={[0, 0.08, 0]}>
      {/* Outer Timber Carcass */}
      <mesh position={[0, 0, -0.62]} receiveShadow castShadow>
        <boxGeometry args={[2.56, 3.44, 0.1]} />
        <meshStandardMaterial color={woodOuter} roughness={0.62} />
      </mesh>
      <mesh position={[-1.23, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.1, 3.44, 1.32]} />
        <meshStandardMaterial color={woodOuter} roughness={0.62} />
      </mesh>
      <mesh position={[1.23, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.1, 3.44, 1.32]} />
        <meshStandardMaterial color={woodOuter} roughness={0.62} />
      </mesh>
      <mesh position={[0, 1.67, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.62, 0.1, 1.38]} />
        <meshStandardMaterial color="#b98e5e" roughness={0.55} />
      </mesh>
      <mesh position={[0, -1.7, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.56, 0.12, 1.32]} />
        <meshStandardMaterial color="#8c6239" roughness={0.65} />
      </mesh>

      {/* Shelves */}
      <mesh position={[0, 0.62, -0.02]} receiveShadow castShadow>
        <boxGeometry args={[2.38, 0.06, 1.2]} />
        <meshStandardMaterial color={woodShelf} roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.3, -0.02]} receiveShadow castShadow>
        <boxGeometry args={[2.38, 0.06, 1.2]} />
        <meshStandardMaterial color={woodShelf} roughness={0.55} />
      </mesh>
      <mesh position={[0, -1.18, -0.02]} receiveShadow castShadow>
        <boxGeometry args={[2.38, 0.06, 1.24]} />
        <meshStandardMaterial color={woodShelf} roughness={0.55} />
      </mesh>

      {/* 3 Main Shelves */}
      {bodyComps.map((meta) => (
        <CompartmentZone
          key={meta.id}
          meta={meta}
          items={byZone(meta.id)}
          isSelected={selectedCompartmentId === meta.id}
          isHighlighted={highlightedCompartmentId === meta.id}
          selectedItemId={selectedItemId}
          onSelectCompartment={onSelectCompartment}
          onSelectItem={onSelectItem}
        />
      ))}

      {/* Bottom Sliding Drawer */}
      <group ref={drawerRef} position={[0, -1.42, 0]}>
        <mesh position={[0, -0.18, 0.02]} receiveShadow castShadow>
          <boxGeometry args={[2.28, 0.05, 1.12]} />
          <meshStandardMaterial color={woodShelf} roughness={0.6} />
        </mesh>
        <mesh position={[-1.12, 0, 0.02]}>
          <boxGeometry args={[0.05, 0.34, 1.12]} />
          <meshStandardMaterial color={woodOuter} roughness={0.6} />
        </mesh>
        <mesh position={[1.12, 0, 0.02]}>
          <boxGeometry args={[0.05, 0.34, 1.12]} />
          <meshStandardMaterial color={woodOuter} roughness={0.6} />
        </mesh>
        <mesh
          position={[0, 0, 0.6]}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onSelectCompartment('cabinet-drawer');
          }}
        >
          <boxGeometry args={[2.38, 0.42, 0.07]} />
          <meshStandardMaterial
            color={isTransparent ? '#fde68a' : doorFace}
            roughness={isTransparent ? 0.15 : 0.45}
            transparent={isTransparent}
            opacity={isTransparent ? 0.28 : 1}
          />
        </mesh>
        <mesh position={[0, 0.02, 0.67]} castShadow>
          <boxGeometry args={[0.56, 0.05, 0.06]} />
          <meshStandardMaterial color={brass} roughness={0.3} metalness={0.75} />
        </mesh>

        <CompartmentZone
          meta={drawerComp}
          items={byZone('cabinet-drawer')}
          isSelected={selectedCompartmentId === 'cabinet-drawer'}
          isHighlighted={highlightedCompartmentId === 'cabinet-drawer'}
          selectedItemId={selectedItemId}
          onSelectCompartment={onSelectCompartment}
          onSelectItem={onSelectItem}
          localPosition={[0, 0.02, 0.02]}
          localSize={[2.16, 0.34, 1.02]}
        />
      </group>

      {/* Left & Right Doors */}
      <group ref={leftDoorRef} position={[-1.22, 0.23, 0.64]}>
        <mesh
          position={[0.6, 0, 0.03]}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onToggleDoor();
          }}
        >
          <boxGeometry args={[1.18, 2.74, 0.07]} />
          <meshStandardMaterial
            color={isTransparent ? '#fef3c7' : doorFace}
            roughness={isTransparent ? 0.12 : 0.48}
            transparent={isTransparent}
            opacity={isTransparent ? 0.22 : 1}
          />
        </mesh>
        <mesh position={[1.06, -0.15, 0.1]} castShadow>
          <boxGeometry args={[0.05, 0.42, 0.06]} />
          <meshStandardMaterial color={brass} roughness={0.3} metalness={0.75} />
        </mesh>
      </group>

      <group ref={rightDoorRef} position={[1.22, 0.23, 0.64]}>
        <mesh
          position={[-0.6, 0, 0.03]}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onToggleDoor();
          }}
        >
          <boxGeometry args={[1.18, 2.74, 0.07]} />
          <meshStandardMaterial
            color={isTransparent ? '#fef3c7' : doorFace}
            roughness={isTransparent ? 0.12 : 0.48}
            transparent={isTransparent}
            opacity={isTransparent ? 0.22 : 1}
          />
        </mesh>
        <mesh position={[-1.06, -0.15, 0.1]} castShadow>
          <boxGeometry args={[0.05, 0.42, 0.06]} />
          <meshStandardMaterial color={brass} roughness={0.3} metalness={0.75} />
        </mesh>
      </group>
    </group>
  );
}
