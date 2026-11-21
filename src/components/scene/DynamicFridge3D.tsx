'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FRIDGE_FINISH_MAP, FRIDGE_MODEL_MAP } from '@/data/fridgeModels';
import { CompartmentZone } from './CompartmentZone';
import type {
  CompartmentId,
  CompartmentMeta,
  CustomFridgeProfile,
  DoorMode,
  FridgeModelType,
  InventoryItem,
} from '@/types/pantry';

interface DynamicFridge3DProps {
  model: FridgeModelType;
  profile: CustomFridgeProfile;
  items: InventoryItem[];
  doorMode: DoorMode;
  selectedCompartmentId: CompartmentId | null;
  highlightedCompartmentId: CompartmentId | null;
  selectedItemId: string | null;
  onSelectCompartment: (id: CompartmentId) => void;
  onSelectItem: (itemId: string) => void;
  onToggleDoor: () => void;
}

export function DynamicFridge3D({
  model,
  profile,
  items,
  doorMode,
  selectedCompartmentId,
  highlightedCompartmentId,
  selectedItemId,
  onSelectCompartment,
  onSelectItem,
  onToggleDoor,
}: DynamicFridge3DProps) {
  const topDoorRef = useRef<THREE.Group>(null);
  const rightDoorRef = useRef<THREE.Group>(null);
  const leftDoorRef = useRef<THREE.Group>(null);
  const drawer1Ref = useRef<THREE.Group>(null);
  const drawer2Ref = useRef<THREE.Group>(null);

  const preset = FRIDGE_MODEL_MAP[model];
  const [W, H, D] = preset.dimensions;
  const isTransparent = doorMode === 'transparent';
  const targetOpenAngle = doorMode === 'open' ? 1.82 : 0;

  const drawer1Meta = preset.compartments.find((c) => c.attachment === 'drawer-1');
  const drawer2Meta = preset.compartments.find((c) => c.attachment === 'drawer-2');
  const doorRightMeta = preset.compartments.find((c) => c.attachment === 'door-right');
  const bodyCompartments = preset.compartments.filter(
    (c) => !c.attachment || c.attachment === 'body',
  );

  const drawer1Open =
    doorMode === 'open' ||
    (drawer1Meta &&
      (selectedCompartmentId === drawer1Meta.id ||
        highlightedCompartmentId === drawer1Meta.id));
  const drawer2Open =
    doorMode === 'open' ||
    (drawer2Meta &&
      (selectedCompartmentId === drawer2Meta.id ||
        highlightedCompartmentId === drawer2Meta.id));

  useFrame((_, delta) => {
    const speed = Math.min(1, delta * 6.5);
    if (topDoorRef.current) {
      topDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        topDoorRef.current.rotation.y,
        targetOpenAngle,
        speed,
      );
    }
    if (rightDoorRef.current) {
      rightDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        rightDoorRef.current.rotation.y,
        targetOpenAngle,
        speed,
      );
    }
    if (leftDoorRef.current) {
      leftDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        leftDoorRef.current.rotation.y,
        -targetOpenAngle,
        speed,
      );
    }
    if (drawer1Ref.current) {
      drawer1Ref.current.position.z = THREE.MathUtils.lerp(
        drawer1Ref.current.position.z,
        drawer1Open ? 0.56 : 0,
        speed,
      );
    }
    if (drawer2Ref.current) {
      drawer2Ref.current.position.z = THREE.MathUtils.lerp(
        drawer2Ref.current.position.z,
        drawer2Open ? 0.56 : 0,
        speed,
      );
    }
  });

  const byZone = (id: CompartmentId) => items.filter((i) => i.compartmentId === id);

  const withCustomLabel = (meta: CompartmentMeta): CompartmentMeta => {
    const customName = profile.customZoneLabels?.[meta.id]?.trim();
    if (!customName) return meta;
    return {
      ...meta,
      shortLabel: customName,
      label: `${profile.brand || preset.name} · ${customName}`,
    };
  };

  const finish = FRIDGE_FINISH_MAP[profile.finishId] ?? FRIDGE_FINISH_MAP.silver;
  const shellColor = finish.shellColor;
  const handleColor = finish.handleColor;
  const interiorColor = '#f4f8fb';
  const glassColor = '#bae6fd';
  const doorMaterialProps = {
    color: isTransparent ? '#bae6fd' : finish.doorColor,
    roughness: isTransparent ? 0.12 : 0.26,
    metalness: isTransparent ? 0.05 : 0.34,
    transparent: isTransparent,
    opacity: isTransparent ? 0.22 : 1,
  };

  const renderDoorRack = (
    comp: CompartmentMeta | undefined,
    rackX: number,
    rackY: number,
    rackW: number,
  ) => {
    if (!comp) return null;
    return (
      <group position={[rackX, rackY, -0.18]}>
        <mesh position={[0, -0.32, 0]}>
          <boxGeometry args={[rackW, 0.04, 0.28]} />
          <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.78} roughness={0.15} />
        </mesh>
        <mesh position={[0, -0.17, -0.13]}>
          <boxGeometry args={[rackW, 0.2, 0.03]} />
          <meshPhysicalMaterial color="#bae6fd" transparent opacity={0.62} roughness={0.15} />
        </mesh>
        <CompartmentZone
          meta={withCustomLabel(comp)}
          items={byZone(comp.id)}
          isSelected={selectedCompartmentId === comp.id}
          isHighlighted={highlightedCompartmentId === comp.id}
          selectedItemId={selectedItemId}
          onSelectCompartment={onSelectCompartment}
          onSelectItem={onSelectItem}
          localPosition={[0, -0.02, 0]}
          localSize={[rackW - 0.1, 0.58, 0.26]}
        />
      </group>
    );
  };

  return (
    <group position={[0, model === 'mini-fridge' ? -0.35 : 0.05, 0]}>
      {/* ================= Outer Shell Carcass ================= */}
      {/* Back wall */}
      <mesh position={[0, 0, -D / 2 + 0.05]} receiveShadow castShadow>
        <boxGeometry args={[W, H, 0.12]} />
        <meshStandardMaterial color={shellColor} roughness={0.35} metalness={0.26} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-W / 2 + 0.06, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.12, H, D]} />
        <meshStandardMaterial color={shellColor} roughness={0.35} metalness={0.26} />
      </mesh>
      {/* Right wall */}
      <mesh position={[W / 2 - 0.06, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.12, H, D]} />
        <meshStandardMaterial color={shellColor} roughness={0.35} metalness={0.26} />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, H / 2 - 0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[W, 0.12, D]} />
        <meshStandardMaterial color={shellColor} roughness={0.35} metalness={0.26} />
      </mesh>
      {/* Bottom base */}
      <mesh position={[0, -H / 2 + 0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[W, 0.14, D]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.45} metalness={0.3} />
      </mesh>
      {/* Interior back liner */}
      <mesh position={[0, 0, -D / 2 + 0.13]} receiveShadow>
        <boxGeometry args={[W - 0.22, H - 0.24, 0.04]} />
        <meshStandardMaterial color={interiorColor} roughness={0.62} />
      </mesh>
      {/* Interior LED light bar */}
      <mesh position={[0, H / 2 - 0.16, 0.3]}>
        <boxGeometry args={[W * 0.55, 0.03, 0.06]} />
        <meshStandardMaterial color="#ffffff" emissive="#e0f2fe" emissiveIntensity={1.2} />
      </mesh>

      {/* ================= Model-Specific Interior Shelves & Dividers ================= */}
      {model === 'top-freezer' && (
        <>
          <mesh position={[0, 0.84, -0.02]}>
            <boxGeometry args={[W - 0.2, 0.1, D - 0.12]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.08, -0.04]}>
            <boxGeometry args={[W - 0.24, 0.045, D - 0.22]} />
            <meshPhysicalMaterial color={glassColor} transparent opacity={0.55} roughness={0.1} />
          </mesh>
          <mesh position={[0, -0.72, -0.04]}>
            <boxGeometry args={[W - 0.24, 0.045, D - 0.22]} />
            <meshPhysicalMaterial color={glassColor} transparent opacity={0.55} roughness={0.1} />
          </mesh>
        </>
      )}

      {model === 'bottom-freezer' && (
        <>
          <mesh position={[0, -0.42, -0.02]}>
            <boxGeometry args={[W - 0.2, 0.1, D - 0.12]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.35} />
          </mesh>
          <mesh position={[0, 1.0, -0.04]}>
            <boxGeometry args={[W - 0.24, 0.045, D - 0.22]} />
            <meshPhysicalMaterial color={glassColor} transparent opacity={0.55} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.28, -0.04]}>
            <boxGeometry args={[W - 0.24, 0.045, D - 0.22]} />
            <meshPhysicalMaterial color={glassColor} transparent opacity={0.55} roughness={0.1} />
          </mesh>
        </>
      )}

      {model === 'side-by-side' && (
        <>
          {/* Central insulated divider */}
          <mesh position={[-0.22, 0, -0.02]}>
            <boxGeometry args={[0.12, H - 0.22, D - 0.12]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.35} />
          </mesh>
          {/* Left freezer shelf */}
          <mesh position={[-0.84, 0.08, -0.04]}>
            <boxGeometry args={[1.1, 0.045, D - 0.22]} />
            <meshPhysicalMaterial color={glassColor} transparent opacity={0.55} />
          </mesh>
          {/* Right fridge shelves */}
          <mesh position={[0.62, 0.62, -0.04]}>
            <boxGeometry args={[1.54, 0.045, D - 0.22]} />
            <meshPhysicalMaterial color={glassColor} transparent opacity={0.55} />
          </mesh>
          <mesh position={[0.62, -0.48, -0.04]}>
            <boxGeometry args={[1.54, 0.045, D - 0.22]} />
            <meshPhysicalMaterial color={glassColor} transparent opacity={0.55} />
          </mesh>
        </>
      )}

      {model === 'french-door' && (
        <>
          {/* Insulated divider above freezer drawers */}
          <mesh position={[0, -0.36, -0.02]}>
            <boxGeometry args={[W - 0.2, 0.1, D - 0.12]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.35} />
          </mesh>
          {/* Panoramic wide glass shelves */}
          <mesh position={[0, 1.02, -0.04]}>
            <boxGeometry args={[W - 0.24, 0.045, D - 0.24]} />
            <meshPhysicalMaterial color={glassColor} transparent opacity={0.55} />
          </mesh>
          <mesh position={[0, 0.26, -0.04]}>
            <boxGeometry args={[W - 0.24, 0.045, D - 0.24]} />
            <meshPhysicalMaterial color={glassColor} transparent opacity={0.55} />
          </mesh>
        </>
      )}

      {model === 'mini-fridge' && (
        <>
          <mesh position={[0, 0.5, -0.04]}>
            <boxGeometry args={[W - 0.24, 0.055, D - 0.22]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.24, -0.04]}>
            <boxGeometry args={[W - 0.24, 0.04, D - 0.24]} />
            <meshPhysicalMaterial color={glassColor} transparent opacity={0.55} />
          </mesh>
        </>
      )}

      {/* ================= Interactive Body Compartments ================= */}
      {bodyCompartments.map((meta) => (
        <CompartmentZone
          key={meta.id}
          meta={withCustomLabel(meta)}
          items={byZone(meta.id)}
          isSelected={selectedCompartmentId === meta.id}
          isHighlighted={highlightedCompartmentId === meta.id}
          selectedItemId={selectedItemId}
          onSelectCompartment={onSelectCompartment}
          onSelectItem={onSelectItem}
        />
      ))}

      {/* ================= Sliding Freezer Drawer 1 (Bottom-Freezer & French-Door) ================= */}
      {drawer1Meta && (
        <group
          ref={drawer1Ref}
          position={[0, drawer1Meta.position[1], 0]}
        >
          <mesh position={[0, -drawer1Meta.size[1] / 2 + 0.02, 0.02]} receiveShadow>
            <boxGeometry args={[drawer1Meta.size[0] + 0.06, 0.05, drawer1Meta.size[2]]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
          </mesh>
          {/* Drawer Front Door Panel */}
          <mesh
            position={[0, 0, D / 2 + 0.02]}
            castShadow
            receiveShadow
            onClick={(e) => {
              e.stopPropagation();
              onSelectCompartment(drawer1Meta.id);
            }}
          >
            <boxGeometry args={[W - 0.04, drawer1Meta.size[1] + 0.14, 0.09]} />
            <meshStandardMaterial {...doorMaterialProps} />
          </mesh>
          {/* Horizontal handle */}
          <mesh position={[0, drawer1Meta.size[1] / 2 - 0.08, D / 2 + 0.1]} castShadow>
            <boxGeometry args={[W * 0.45, 0.05, 0.06]} />
            <meshStandardMaterial color={handleColor} roughness={0.3} metalness={0.72} />
          </mesh>
          <CompartmentZone
            meta={withCustomLabel(drawer1Meta)}
            items={byZone(drawer1Meta.id)}
            isSelected={selectedCompartmentId === drawer1Meta.id}
            isHighlighted={highlightedCompartmentId === drawer1Meta.id}
            selectedItemId={selectedItemId}
            onSelectCompartment={onSelectCompartment}
            onSelectItem={onSelectItem}
            localPosition={[0, 0, 0]}
            localSize={drawer1Meta.size}
          />
        </group>
      )}

      {/* ================= Sliding Freezer Drawer 2 (French-Door) ================= */}
      {drawer2Meta && (
        <group
          ref={drawer2Ref}
          position={[0, drawer2Meta.position[1], 0]}
        >
          <mesh position={[0, -drawer2Meta.size[1] / 2 + 0.02, 0.02]} receiveShadow>
            <boxGeometry args={[drawer2Meta.size[0] + 0.06, 0.05, drawer2Meta.size[2]]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
          </mesh>
          <mesh
            position={[0, 0, D / 2 + 0.02]}
            castShadow
            receiveShadow
            onClick={(e) => {
              e.stopPropagation();
              onSelectCompartment(drawer2Meta.id);
            }}
          >
            <boxGeometry args={[W - 0.04, drawer2Meta.size[1] + 0.14, 0.09]} />
            <meshStandardMaterial {...doorMaterialProps} />
          </mesh>
          <mesh position={[0, drawer2Meta.size[1] / 2 - 0.08, D / 2 + 0.1]} castShadow>
            <boxGeometry args={[W * 0.45, 0.05, 0.06]} />
            <meshStandardMaterial color={handleColor} roughness={0.3} metalness={0.72} />
          </mesh>
          <CompartmentZone
            meta={withCustomLabel(drawer2Meta)}
            items={byZone(drawer2Meta.id)}
            isSelected={selectedCompartmentId === drawer2Meta.id}
            isHighlighted={highlightedCompartmentId === drawer2Meta.id}
            selectedItemId={selectedItemId}
            onSelectCompartment={onSelectCompartment}
            onSelectItem={onSelectItem}
            localPosition={[0, 0, 0]}
            localSize={drawer2Meta.size}
          />
        </group>
      )}

      {/* ================= Model-Specific Swing Doors ================= */}
      {model === 'top-freezer' && (
        <>
          {/* Upper Freezer Door */}
          <group ref={topDoorRef} position={[W / 2 - 0.02, 1.36, D / 2 - 0.02]}>
            <mesh
              position={[-W / 2 + 0.02, 0, 0.05]}
              castShadow
              onClick={(e) => {
                e.stopPropagation();
                onToggleDoor();
              }}
            >
              <boxGeometry args={[W - 0.02, 0.96, 0.1]} />
              <meshStandardMaterial {...doorMaterialProps} />
            </mesh>
            <mesh position={[-W + 0.18, -0.18, 0.14]} castShadow>
              <boxGeometry args={[0.06, 0.44, 0.07]} />
              <meshStandardMaterial color={handleColor} roughness={0.3} metalness={0.7} />
            </mesh>
          </group>

          {/* Lower Main Fridge Door + Door Rack */}
          <group ref={rightDoorRef} position={[W / 2 - 0.02, -0.52, D / 2 - 0.02]}>
            <mesh
              position={[-W / 2 + 0.02, 0, 0.05]}
              castShadow
              onClick={(e) => {
                e.stopPropagation();
                onToggleDoor();
              }}
            >
              <boxGeometry args={[W - 0.02, 2.72, 0.1]} />
              <meshStandardMaterial {...doorMaterialProps} />
            </mesh>
            <mesh position={[-W + 0.18, 0.72, 0.14]} castShadow>
              <boxGeometry args={[0.06, 0.85, 0.07]} />
              <meshStandardMaterial color={handleColor} roughness={0.3} metalness={0.7} />
            </mesh>
            {renderDoorRack(doorRightMeta, -W / 2 + 0.04, 0.18, 1.76)}
          </group>
        </>
      )}

      {model === 'bottom-freezer' && (
        <group ref={rightDoorRef} position={[W / 2 - 0.02, 0.72, D / 2 - 0.02]}>
          <mesh
            position={[-W / 2 + 0.02, 0, 0.05]}
            castShadow
            onClick={(e) => {
              e.stopPropagation();
              onToggleDoor();
            }}
          >
            <boxGeometry args={[W - 0.02, 2.26, 0.1]} />
            <meshStandardMaterial {...doorMaterialProps} />
          </mesh>
          <mesh position={[-W + 0.18, -0.35, 0.14]} castShadow>
            <boxGeometry args={[0.06, 0.82, 0.07]} />
            <meshStandardMaterial color={handleColor} roughness={0.3} metalness={0.7} />
          </mesh>
          {renderDoorRack(doorRightMeta, -W / 2 + 0.04, -0.1, 1.76)}
        </group>
      )}

      {model === 'side-by-side' && (
        <>
          {/* Left Tall Freezer Door */}
          <group ref={leftDoorRef} position={[-W / 2 + 0.02, 0, D / 2 - 0.02]}>
            <mesh
              position={[0.62, 0, 0.05]}
              castShadow
              onClick={(e) => {
                e.stopPropagation();
                onToggleDoor();
              }}
            >
              <boxGeometry args={[1.24, H - 0.06, 0.1]} />
              <meshStandardMaterial {...doorMaterialProps} />
            </mesh>
            <mesh position={[1.12, 0.1, 0.14]} castShadow>
              <boxGeometry args={[0.06, 1.15, 0.07]} />
              <meshStandardMaterial color={handleColor} roughness={0.3} metalness={0.72} />
            </mesh>
          </group>

          {/* Right Tall Fridge Door + Rack */}
          <group ref={rightDoorRef} position={[W / 2 - 0.02, 0, D / 2 - 0.02]}>
            <mesh
              position={[-0.84, 0, 0.05]}
              castShadow
              onClick={(e) => {
                e.stopPropagation();
                onToggleDoor();
              }}
            >
              <boxGeometry args={[1.66, H - 0.06, 0.1]} />
              <meshStandardMaterial {...doorMaterialProps} />
            </mesh>
            <mesh position={[-1.54, 0.1, 0.14]} castShadow>
              <boxGeometry args={[0.06, 1.15, 0.07]} />
              <meshStandardMaterial color={handleColor} roughness={0.3} metalness={0.72} />
            </mesh>
            {renderDoorRack(doorRightMeta, -0.84, 0.1, 1.42)}
          </group>
        </>
      )}

      {model === 'french-door' && (
        <>
          {/* Upper Left Door */}
          <group ref={leftDoorRef} position={[-W / 2 + 0.02, 0.76, D / 2 - 0.02]}>
            <mesh
              position={[W / 4 - 0.02, 0, 0.05]}
              castShadow
              onClick={(e) => {
                e.stopPropagation();
                onToggleDoor();
              }}
            >
              <boxGeometry args={[W / 2 - 0.04, 2.2, 0.1]} />
              <meshStandardMaterial {...doorMaterialProps} />
            </mesh>
            <mesh position={[W / 2 - 0.16, -0.1, 0.14]} castShadow>
              <boxGeometry args={[0.055, 0.9, 0.07]} />
              <meshStandardMaterial color={handleColor} roughness={0.3} metalness={0.72} />
            </mesh>
          </group>

          {/* Upper Right Door + Bottle Rack */}
          <group ref={rightDoorRef} position={[W / 2 - 0.02, 0.76, D / 2 - 0.02]}>
            <mesh
              position={[-W / 4 + 0.02, 0, 0.05]}
              castShadow
              onClick={(e) => {
                e.stopPropagation();
                onToggleDoor();
              }}
            >
              <boxGeometry args={[W / 2 - 0.04, 2.2, 0.1]} />
              <meshStandardMaterial {...doorMaterialProps} />
            </mesh>
            <mesh position={[-W / 2 + 0.16, -0.1, 0.14]} castShadow>
              <boxGeometry args={[0.055, 0.9, 0.07]} />
              <meshStandardMaterial color={handleColor} roughness={0.3} metalness={0.72} />
            </mesh>
            {renderDoorRack(doorRightMeta, -W / 4 + 0.04, -0.1, 1.24)}
          </group>
        </>
      )}

      {model === 'mini-fridge' && (
        <group ref={rightDoorRef} position={[W / 2 - 0.02, 0, D / 2 - 0.02]}>
          <mesh
            position={[-W / 2 + 0.02, 0, 0.05]}
            castShadow
            onClick={(e) => {
              e.stopPropagation();
              onToggleDoor();
            }}
          >
            <boxGeometry args={[W - 0.02, H - 0.06, 0.09]} />
            <meshStandardMaterial {...doorMaterialProps} />
          </mesh>
          <mesh position={[-W + 0.16, 0.3, 0.13]} castShadow>
            <boxGeometry args={[0.055, 0.56, 0.06]} />
            <meshStandardMaterial color="#4f46e5" roughness={0.3} metalness={0.5} />
          </mesh>
          {renderDoorRack(doorRightMeta, -W / 2 + 0.04, -0.06, 1.48)}
        </group>
      )}
    </group>
  );
}
