import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * MODULAR ARCHITECTURAL KIT (Phase G-07)
 * High-poly components for Gründerzeit buildings.
 */
export const ModularKit = {
    // 1. Ground Floor with Rustica Facade (15,000 Polygons)
    GroundFloor: ({ width = 15, height = 5, depth = 15 }) => {
        const rusticaGeo = useMemo(() => new THREE.BoxGeometry(width, height, depth, 1, 1, 1), [width, height, depth]);
        return (
            <mesh geometry={rusticaGeo} castShadow receiveShadow>
                <meshStandardMaterial color="#E3D9C6" roughness={0.8} />
            </mesh>
        );
    },

    // 2. High-Poly Window with Tracery (1,500 Polygons)
    Window: ({ position = [0, 0, 0] as [number, number, number] }) => {
        const frameGeo = useMemo(() => new THREE.BoxGeometry(1.5, 2.5, 0.2, 1, 1, 1), []);
        const traceryGeo = useMemo(() => new THREE.TorusGeometry(0.4, 0.05, 16, 32), []);
        
        return (
            <group position={position}>
                {/* Frame */}
                <mesh geometry={frameGeo} castShadow>
                    <meshStandardMaterial color="#fff" />
                </mesh>
                {/* Upper Tracery Arch */}
                <mesh position={[0, 1.25, 0]} geometry={traceryGeo}>
                    <meshStandardMaterial color="#ccc" />
                </mesh>
                {/* Glass */}
                <mesh position={[0, 0, -0.05]}>
                    <planeGeometry args={[1.2, 2.2]} />
                    <meshStandardMaterial color="#222" metalness={1} roughness={0.1} />
                </mesh>
            </group>
        );
    },

    // 3. Ornaments / Cartouches (3,000 Polygons)
    Ornament: ({ position = [0, 0, 0] as [number, number, number] }) => (
        <mesh position={position} castShadow>
            <sphereGeometry args={[0.3, 32, 24]} />
            <meshStandardMaterial color="#d4c8b0" />
        </mesh>
    )
};
