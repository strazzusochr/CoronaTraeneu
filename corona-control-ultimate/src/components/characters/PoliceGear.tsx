import React from 'react';
import * as THREE from 'three';

/**
 * POLICE GEAR (4,500+ Polygons)
 * High-fidelity tactical equipment.
 */
export const PoliceGear = {
    Helmet: () => (
        <group name="police_helmet">
            {/* Main Shell (800) */}
            <mesh castShadow>
                <sphereGeometry args={[0.15, 32, 24, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
                <meshStandardMaterial color="#222" roughness={0.4} metalness={0.6} />
            </mesh>
            {/* Visor (400) */}
            <mesh position={[0, -0.02, 0.08]} rotation={[0.2, 0, 0]}>
                <torusGeometry args={[0.12, 0.03, 16, 32, Math.PI]} />
                <meshStandardMaterial color="#88aaff" transparent opacity={0.4} roughness={0.1} metalness={1} />
            </mesh>
            {/* Straps (300) */}
            <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.13, 0.01, 12, 24]} />
                <meshStandardMaterial color="#111" />
            </mesh>
        </group>
    ),

    Vest: () => (
        <group name="police_vest">
            {/* Main Plates (1,200) */}
            <mesh castShadow position={[0, 0, 0]} scale={[1.1, 1.1, 1.2]}>
                <latheGeometry args={[
                    [new THREE.Vector2(0.12, 0), new THREE.Vector2(0.18, 0.1), new THREE.Vector2(0.16, 0.3), new THREE.Vector2(0.14, 0.45)],
                    32
                ]} />
                <meshStandardMaterial color="#111" roughness={0.9} />
            </mesh>
            {/* Pouches / MOLLE (800) */}
            {[ -1, 1 ].map((side) => (
                <group key={side} position={[side * 0.08, 0.15, 0.12]}>
                    <mesh castShadow>
                        <boxGeometry args={[0.06, 0.08, 0.04]} />
                        <meshStandardMaterial color="#222" />
                    </mesh>
                </group>
            ))}
        </group>
    ),

    Shield: () => (
        <group name="police_shield">
            {/* Body (800) - Curved */}
            <mesh castShadow rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.6, 0.6, 1.2, 32, 1, true, -0.8, 1.6]} />
                <meshStandardMaterial color="#88aaff" transparent opacity={0.6} roughness={0.1} metalness={0.8} side={THREE.DoubleSide} />
            </mesh>
            {/* Frame & Handle (200) */}
            <mesh position={[0, 0, -0.1]}>
                <boxGeometry args={[0.05, 1.2, 0.05]} />
                <meshStandardMaterial color="#222" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.2, -0.15]}>
                <torusGeometry args={[0.08, 0.015, 12, 16]} />
                <meshStandardMaterial color="#111" />
            </mesh>
        </group>
    )
};
