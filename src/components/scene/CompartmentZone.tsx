'use client';

import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { getItemHealthStatus, getStatusHex } from '@/lib/inventoryUtils';
import type { CompartmentMeta, InventoryItem } from '@/types/pantry';

interface CompartmentZoneProps {
  meta: CompartmentMeta;
  items: InventoryItem[];
  isSelected: boolean;
  isHighlighted: boolean;
  selectedItemId: string | null;
  onSelectCompartment: (id: CompartmentMeta['id']) => void;
  onSelectItem: (itemId: string) => void;
  localPosition?: [number, number, number];
  localSize?: [number, number, number];
}

function ItemMesh3D({
  item,
  position,
  isFocused,
  onClick,
}: {
  item: InventoryItem;
  position: [number, number, number];
  isFocused: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const health = getItemHealthStatus(item);
  const baseColor = getStatusHex(health.color);

  useFrame((state) => {
    if (!groupRef.current) return;
    const baseY = position[1];
    if (isFocused) {
      groupRef.current.position.y =
        baseY + 0.06 + Math.sin(state.clock.elapsedTime * 5.2) * 0.038;
      groupRef.current.rotation.y += 0.028;
    } else {
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        hovered ? baseY + 0.035 : baseY,
        0.16,
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        0,
        0.12,
      );
    }
  });

  const renderShape = () => {
    switch (item.category) {
      case 'produce':
        return (
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.125, 16, 14]} />
            <meshStandardMaterial
              color={baseColor}
              roughness={0.35}
              metalness={0.05}
              emissive={isFocused || hovered ? baseColor : '#000000'}
              emissiveIntensity={isFocused ? 0.5 : hovered ? 0.22 : 0}
            />
          </mesh>
        );
      case 'seasoning':
      case 'beverage':
        return (
          <group>
            <mesh castShadow receiveShadow position={[0, 0.03, 0]}>
              <cylinderGeometry args={[0.08, 0.09, 0.26, 14]} />
              <meshStandardMaterial
                color={baseColor}
                roughness={0.28}
                metalness={0.12}
                emissive={isFocused || hovered ? baseColor : '#000000'}
                emissiveIntensity={isFocused ? 0.5 : hovered ? 0.22 : 0}
              />
            </mesh>
            <mesh castShadow position={[0, 0.19, 0]}>
              <cylinderGeometry args={[0.038, 0.05, 0.075, 10]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.4} />
            </mesh>
          </group>
        );
      case 'dairy':
        return (
          <group>
            <mesh castShadow receiveShadow position={[0, 0.02, 0]}>
              <boxGeometry args={[0.18, 0.24, 0.15]} />
              <meshStandardMaterial
                color={baseColor}
                roughness={0.32}
                metalness={0.05}
                emissive={isFocused || hovered ? baseColor : '#000000'}
                emissiveIntensity={isFocused ? 0.5 : hovered ? 0.22 : 0}
              />
            </mesh>
            <mesh position={[0, 0.155, 0]}>
              <boxGeometry args={[0.15, 0.038, 0.11]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
          </group>
        );
      default:
        return (
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.22, 0.19, 0.17]} />
            <meshStandardMaterial
              color={baseColor}
              roughness={0.38}
              metalness={0.08}
              emissive={isFocused || hovered ? baseColor : '#000000'}
              emissiveIntensity={isFocused ? 0.5 : hovered ? 0.22 : 0}
            />
          </mesh>
        );
    }
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {renderShape()}

      {isFocused && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.105, 0]}>
          <ringGeometry args={[0.14, 0.21, 24]} />
          <meshBasicMaterial color="#0f766e" side={THREE.DoubleSide} />
        </mesh>
      )}

      {(hovered || isFocused) && (
        <Html
          position={[0, 0.34, 0]}
          center
          distanceFactor={6}
          style={{ pointerEvents: 'none' }}
        >
          <div className="whitespace-nowrap rounded-full border border-stone-300 bg-white/95 px-2.5 py-1 text-xs font-bold text-stone-900 shadow-md backdrop-blur-sm">
            <span className="mr-1">{item.emoji}</span>
            <span>{item.name}</span>
            <span className="ml-1.5 text-[10px] font-extrabold" style={{ color: baseColor }}>
              {item.quantity}
              {item.unit}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

export function CompartmentZone({
  meta,
  items,
  isSelected,
  isHighlighted,
  selectedItemId,
  onSelectCompartment,
  onSelectItem,
  localPosition,
  localSize,
}: CompartmentZoneProps) {
  const [hovered, setHovered] = useState(false);
  const pulseMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const pos = localPosition ?? meta.position;
  const size = localSize ?? meta.size;
  const active = isSelected || isHighlighted;

  // Smooth blinking highlight pulse when compartment is focused from list
  useFrame((state) => {
    if (!pulseMatRef.current) return;
    if (active) {
      pulseMatRef.current.emissiveIntensity =
        0.55 + Math.sin(state.clock.elapsedTime * 5.5) * 0.35;
      pulseMatRef.current.opacity =
        0.65 + Math.sin(state.clock.elapsedTime * 5.5) * 0.2;
    } else {
      pulseMatRef.current.emissiveIntensity = 0.25;
      pulseMatRef.current.opacity = 0.5;
    }
  });

  const cols = Math.max(1, Math.min(items.length, Math.floor(size[0] / 0.34)));
  const rows = Math.max(1, Math.ceil(items.length / cols));

  return (
    <group position={pos}>
      {/* Interactive clickable zone volume */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelectCompartment(meta.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[size[0] - 0.04, size[1] - 0.04, size[2] - 0.04]} />
        <meshStandardMaterial
          color={active ? '#0d9488' : hovered ? '#38bdf8' : '#ffffff'}
          transparent
          opacity={active ? 0.22 : hovered ? 0.14 : 0.01}
          depthWrite={false}
        />
      </mesh>

      {/* Pulsing highlight floor plate when active or hovered */}
      {(active || hovered) && (
        <mesh position={[0, -size[1] / 2 + 0.015, 0]}>
          <boxGeometry args={[size[0] - 0.06, 0.026, size[2] - 0.06]} />
          <meshStandardMaterial
            ref={pulseMatRef}
            color={active ? '#0f766e' : '#0284c7'}
            emissive={active ? '#14b8a6' : '#38bdf8'}
            emissiveIntensity={0.55}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}

      {/* Floating compartment label */}
      {(active || hovered) && (
        <Html
          position={[-size[0] / 2 + 0.24, size[1] / 2 - 0.1, size[2] / 2]}
          center
          distanceFactor={7}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-bold shadow-sm"
            style={{
              backgroundColor: active ? '#0f766e' : 'rgba(17, 24, 39, 0.85)',
              color: '#ffffff',
            }}
          >
            {meta.shortLabel} ({items.length})
          </div>
        </Html>
      )}

      {/* Render items neatly inside this shelf/drawer */}
      {items.map((item, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const usableW = Math.max(0.18, size[0] - 0.34);
        const usableD = Math.max(0.16, size[2] - 0.34);

        const x =
          cols === 1 ? 0 : -usableW / 2 + (col / (cols - 1)) * usableW;
        const z =
          rows === 1 ? 0.06 : -usableD / 2 + (row / (rows - 1)) * usableD;
        const y = -size[1] / 2 + 0.15;

        return (
          <ItemMesh3D
            key={item.id}
            item={item}
            position={[x, y, z]}
            isFocused={selectedItemId === item.id}
            onClick={() => onSelectItem(item.id)}
          />
        );
      })}
    </group>
  );
}
