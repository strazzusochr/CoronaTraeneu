import React, { useMemo } from 'react';
import { useGameStore } from '@/stores/gameStore';
import NPC from './characters/NPC';
import { InstancedCrowd } from './characters/InstancedCrowd';

const CrowdRenderer: React.FC = () => {
    const npcs = useGameStore(state => state.npcs);
    const playerPos = useGameStore(state => state.player.position);
    // Optimized filtering: Determine which NPCs get high-detail meshes.
    // Set a wider threshold to ensure we don't drop them unnecessarily, but cap at 20-30 for performance.
    const DISTANCE_THRESHOLD = 50;

    const detailedNPCs = useMemo(() => {
        return npcs
            .filter(npc => {
                const dx = playerPos[0] - npc.position[0];
                const dz = playerPos[2] - npc.position[2];
                return (dx * dx + dz * dz) <= DISTANCE_THRESHOLD * DISTANCE_THRESHOLD;
            })
            .sort((a, b) => {
                const da = Math.pow(a.position[0] - playerPos[0], 2) + Math.pow(a.position[2] - playerPos[2], 2);
                const db = Math.pow(b.position[0] - playerPos[0], 2) + Math.pow(b.position[2] - playerPos[2], 2);
                return da - db;
            })
            .slice(0, 25); // Erhöht auf 25, damit direkte Umgebungen stabiler bleiben
    }, [npcs, playerPos, DISTANCE_THRESHOLD]);

    // IDs der detaillierten NPCs, um sie aus der InstancedCrowd auszuschließen
    const detailedIds = useMemo(() => new Set(detailedNPCs.map(n => n.id)), [detailedNPCs]);

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
            <InstancedCrowd excludeIds={detailedIds} />
        </group>
    );
};

export default CrowdRenderer;
