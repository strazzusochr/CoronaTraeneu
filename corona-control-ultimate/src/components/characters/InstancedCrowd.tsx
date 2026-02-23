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
    excludeIds?: Set<number>;
}

export const InstancedCrowd: React.FC<InstancedCrowdProps> = ({ excludeIds = new Set() }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const npcs = useGameStore(state => state.npcs);

    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);

    const frameCount = useRef(0);

    useFrame((state) => {
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

            // Sort-Logik wie in CrowdRenderer simulieren oder vereinfacht:
            // Da CrowdRenderer genau die 10 NÄCHSTEN (bzw. die ersten 10 im Filter) rendert,
            // ist es fehleranfällig, hier einen pauschalen distSq Check zu machen.
            // Bessere Lösung: Rendere hier einfach ALLE instanced, und wer detailliert ist, 
            // überlagert sich halt (Instanced Mesh ohne Shadow, stört kaum) ODER
            // wir beheben das slice(0, 10) im CrowdRenderer und setzen es auf 30.
            
            // Exclude NPCs die bereits detailliert gerendert werden
            if (excludeIds.has(npc.id)) {
                tempObject.position.set(0, -100, 0);
                tempObject.scale.set(0, 0, 0);
                tempObject.updateMatrix();
                meshRef.current!.setMatrixAt(i, tempObject.matrix);
                
                // Color dummy
                tempColor.set('#000000');
                meshRef.current!.setColorAt(i, tempColor);
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

            // 2. Farb-Visualisierung nach Typ & Emotion
            if (npc.emotions.current === EmotionalState.AGGRESSIVE) {
                tempColor.set('#ff1111'); // Rot = Aggressiv
            } else if (npc.type === 'POLICE') {
                tempColor.set('#1a237e'); // Dunkelblau = Polizei
            } else if (npc.type === 'WEGA') {
                tempColor.set('#111111'); // Schwarz = WEGA Spezialeinheit
            } else if (npc.type === 'JOURNALIST') {
                tempColor.set('#ff8f00'); // Orange-Gelb = Presse/Medien
            } else if (npc.type === 'TOURIST') {
                tempColor.set('#81c784'); // Hellgrün = Touristen
            } else if (npc.type === 'DEMONSTRATOR') {
                tempColor.set('#e65100'); // Orange = Demonstranten
            } else if (npc.type === 'RIOTER') {
                tempColor.set('#b71c1c'); // Dunkelrot = Randalierer
            } else if (npc.emotions.current === EmotionalState.STRESSED) {
                tempColor.set('#5555ff'); // Blau = Gestresst
            } else {
                tempColor.set('#cccccc'); // Grau-Weiß = Zivilisten
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
