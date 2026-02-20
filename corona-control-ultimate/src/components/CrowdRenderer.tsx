import React, { useMemo } from 'react';
import { useGameStore } from '@/stores/gameStore';
import NPC from './characters/NPC';
import { InstancedCrowd } from './characters/InstancedCrowd';

const CrowdRenderer: React.FC = () => {
    const npcs = useGameStore(state => state.npcs);
    const playerPos = useGameStore(state => state.player.position);
    const DISTANCE_THRESHOLD = 35;

    // Optimized filtering: Only render top 10 nearest NPCs as high-detail meshes
    const detailedNPCs = useMemo(() => {
        return npcs
            .filter(npc => {
                const dx = playerPos[0] - npc.position[0];
                const dz = playerPos[2] - npc.position[2];
                return (dx * dx + dz * dz) <= DISTANCE_THRESHOLD * DISTANCE_THRESHOLD;
            })
            .slice(0, 10);
    }, [npcs, playerPos, DISTANCE_THRESHOLD]);

    return (
        <group name="CrowdRenderer">
            {/* 1. High Detail NPCs */}
            {detailedNPCs.map(npc => (
                <NPC
                    key={npc.id}
                    id={npc.id}
                    type={npc.type}
                    state={npc.state}
                    position={npc.position}
                    isDetailed={true}
                />
            ))}

            {/* 2. Low Detail Background Crowd (Instanced) */}
            <InstancedCrowd distanceThreshold={DISTANCE_THRESHOLD} />
        </group>
    );
};

export default CrowdRenderer;
