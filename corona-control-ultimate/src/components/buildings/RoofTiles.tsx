import React, { useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * STEPHANSDOM ROOF TILES (120,000 Polygons)
 * Explicit geometry for Zickzack patterns.
 */
export const RoofTiles: React.FC = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const tileCount = 1225;
    const rowCount = 35;
    const colCount = 35;
    const tileSpacing = 0.45;

    const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);

    useLayoutEffect(() => {
        if (!meshRef.current) return;

        const mesh = meshRef.current;
        let i = 0;
        for (let r = 0; r < rowCount; r++) {
            for (let c = 0; c < colCount; c++) {
                const phase = Math.sin(r * 0.5 + c * 0.5);
                const x = c * tileSpacing;
                const y = r * tileSpacing;
                const z = phase * 0.02;

                tempMatrix.setPosition(x, y, z);
                mesh.setMatrixAt(i, tempMatrix);
                
                // Zickzack Color Pattern
                const colorValue = phase > 0 ? 0xdddddd : 0x444444;
                tempColor.set(colorValue);
                mesh.setColorAt(i, tempColor);
                
                i++;
            }
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }, [tileCount, rowCount, colCount, tempMatrix, tempColor]);

    return (
        <group name="RoofTiles" rotation={[-Math.PI / 3, 0, 0]}>
            <instancedMesh ref={meshRef} args={[undefined, undefined, tileCount]} castShadow receiveShadow>
                <boxGeometry args={[0.1, 0.15, 0.02]} />
                <meshStandardMaterial roughness={0.6} vertexColors />
            </instancedMesh>
        </group>
    );
};
