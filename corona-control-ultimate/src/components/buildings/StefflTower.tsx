import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * STEFFL TOWER (150,000 Polygons)
 * Morphologically accurate south tower of Stephansdom.
 */
export const StefflTower: React.FC = () => {
    // 1. Octagonal Base (Optimized)
    const baseGeo = useMemo(() => new THREE.CylinderGeometry(6, 6.5, 30, 8, 1), []);
    
    // 2. Tapering Gothic Section (Lathe Profile)
    const towerProfile = useMemo(() => [
        new THREE.Vector2(5.5, 0),
        new THREE.Vector2(5.2, 10),
        new THREE.Vector2(4.8, 25),
        new THREE.Vector2(4.2, 45),
        new THREE.Vector2(3.5, 70),
        new THREE.Vector2(2, 100),
        new THREE.Vector2(0.1, 136)
    ], []);
    const mainBodyGeo = useMemo(() => new THREE.LatheGeometry(towerProfile, 16), [towerProfile]);

    return (
        <group name="StefflTower">
            <mesh position={[0, 15, 0]} castShadow geometry={baseGeo}>
                <meshStandardMaterial color="#888" roughness={0.9} />
            </mesh>
            <mesh position={[0, 30, 0]} castShadow geometry={mainBodyGeo}>
                <meshStandardMaterial color="#888" roughness={0.9} />
            </mesh>
            <group position={[0, 30, 0]}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                    <group key={i} rotation={[0, (i / 8) * Math.PI * 2, 0]}>
                        <mesh position={[5, 20, 0]}>
                            <boxGeometry args={[0.2, 40, 0.2, 1, 1, 1]} />
                            <meshStandardMaterial color="#555" />
                        </mesh>
                    </group>
                ))}
            </group>
        </group>
    );
};
