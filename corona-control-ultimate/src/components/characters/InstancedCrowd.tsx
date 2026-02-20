import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getFeatureState } from '@/core/FeatureFlags';
import { useGameStore } from '@/stores/gameStore';
import { EmotionalState } from '@/types/enums';

/**
 * V7.0 INSTANCED CROWD SYSTEM
 * Hocheffiziente Darstellung von Massen-NPCs basierend auf dem GameStore.
 */
interface InstancedCrowdProps {
    distanceThreshold?: number;
}

export const InstancedCrowd: React.FC<InstancedCrowdProps> = ({ distanceThreshold = 15 }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const npcs = useGameStore(state => state.npcs);
    const playerPos = useGameStore(state => state.player.position);

    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);

    const frameCount = useRef(0);

    useFrame((state) => {
        if (!getFeatureState('CROWD_500')) return;
        if (!meshRef.current) return;
        
        // Update only every 3rd frame to save CPU
        frameCount.current++;
        if (frameCount.current % 3 !== 0) return;

        const time = state.clock.elapsedTime;

        // Reset all matrices to hide unused instances (scale 0)
        for (let i = npcs.length; i < 500; i++) {
            tempObject.position.set(0, -100, 0);
            tempObject.scale.set(0, 0, 0);
            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix);
        }

        npcs.forEach((npc, i) => {
            if (i >= 500) return;

            const dx = npc.position[0] - playerPos[0];
            const dz = npc.position[2] - playerPos[2];
            const distSq = dx * dx + dz * dz;

            // Distance filtering: Only render if outside detailed range
            if (distSq < distanceThreshold * distanceThreshold) {
                tempObject.position.set(0, -100, 0);
                tempObject.scale.set(0, 0, 0);
                tempObject.updateMatrix();
                meshRef.current!.setMatrixAt(i, tempObject.matrix);
                return;
            }

            // 1. Position-Sync
            tempObject.position.set(npc.position[0], npc.position[1], npc.position[2]);
            
            // Animation: Leichtes Wippen/Tanzen vor der Bühne
            const distToStage = Math.sqrt(
                Math.pow(npc.position[0], 2) + 
                Math.pow(npc.position[2] - (-50), 2)
            );
            
            if (distToStage < 40) {
                // Bobbing animation based on distance to stage (simulating rhythm)
                const bob = Math.sin(time * 8 + i) * 0.05;
                tempObject.position.y += Math.max(0, bob);
                
                // Slight swaying
                tempObject.rotation.z = Math.sin(time * 4 + i) * 0.05;
            } else {
                tempObject.rotation.z = 0;
            }

            tempObject.rotation.y = npc.rotation;
            tempObject.scale.set(1, 1, 1);
            tempObject.updateMatrix();
            meshRef.current!.setMatrixAt(i, tempObject.matrix);

            // 2. Emotionale Visualisierung
            if (npc.emotions.current === EmotionalState.AGGRESSIVE) {
                tempColor.set('#ff1111');
            } else if (npc.emotions.current === EmotionalState.STRESSED) {
                tempColor.set('#5555ff');
            } else if (npc.type === 'POLICE') {
                tempColor.set('#001133');
            } else {
                tempColor.set('#cccccc');
            }
            meshRef.current!.setColorAt(i, tempColor);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, 500]} castShadow={false} receiveShadow={false}>
            <capsuleGeometry args={[0.25, 1.2, 2, 4]} />
            <meshStandardMaterial />
        </instancedMesh>
    );
};
