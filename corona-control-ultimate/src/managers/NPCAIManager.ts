import { EmotionalState, NPCState, NPCType } from '@/types/enums';
import { NPCData } from '@/types/interfaces';
import { EngineLoopRegistry } from '@/core/EngineLoopManager';
import { useGameStore } from '@/stores/gameStore';
import { btManager } from '@/systems/ai/bt/BTManager';

/**
 * NPCAIManager (V7.0)
 * Verwaltet die stats-basierte KI und Behavior Trees für alle NPCs.
 */
export class NPCAIManager {
    private static instance: NPCAIManager;
    private lastUpdate: number = Date.now();

    private constructor() {
        EngineLoopRegistry.ai.push(() => this.update());
        console.log("NPC AI Manager initialized (10Hz)");
    }

    public static getInstance(): NPCAIManager {
        if (!this.instance) {
            this.instance = new NPCAIManager();
        }
        return this.instance;
    }

    /**
     * Zentraler Update-Loop für alle NPCs (10Hz).
     */
    public update() {
        const state = useGameStore.getState();
        if (!state.gameState.isPlaying) return;

        const now = Date.now();
        const dt = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        const npcs = state.npcs;
        const playerPos = state.player.position;
        const npcUpdates = new Map<number, Partial<NPCData>>();

        // 1. Behavior Tree Updates (Movement & Decision Making)
        btManager.update(npcs, playerPos, dt);

        // 2. Stats & Emotions Updates
        npcs.forEach((npc, index) => {
            if (npc.state === NPCState.DEAD || npc.state === NPCState.ARRESTED) return;

            // LOD: Update heavy logic seltener für ferne NPCs
            const distSq = 
                Math.pow(npc.position[0] - playerPos[0], 2) +
                Math.pow(npc.position[2] - playerPos[2], 2);
            
            // Radikale Drosselung: NPCs > 35m werden nur alle 3 Sekunden (30 Ticks) berechnet
            if (distSq > 1225 && (now + index) % 30 !== 0) return;
            // NPCs > 85m werden gar nicht mehr berechnet
            if (distSq > 7225) return;

            // 1. Stress-Berechnung (Nähe zum Spieler oder Chaos)
            const distToPlayer = Math.sqrt(distSq);

            let newStress = npc.emotions.stress;
            if (distToPlayer < 5) newStress += 0.05; // Stress steigt in Spielernähe
            else newStress -= 0.01; // Stress sinkt langsam

            newStress = Math.max(0, Math.min(1, newStress));

            // 2. Aggressions-Logik (Rioter-spezifisch)
            let newAggression = npc.emotions.aggression;
            if (npc.type === NPCType.RIOTER && newStress > 0.5) {
                newAggression += 0.02;
            } else {
                newAggression -= 0.005;
            }
            newAggression = Math.max(0, Math.min(1, newAggression));

            // 3. Emotions-Check
            const nextEmotion = this.calculateEmotion({ ...npc, emotions: { ...npc.emotions, stress: newStress, aggression: newAggression } });

            // 4. Sammle Updates für Batching
            if (nextEmotion !== npc.emotions.current || Math.abs(newStress - npc.emotions.stress) > 0.05) {
                npcUpdates.set(npc.id, {
                    emotions: { ...npc.emotions, current: nextEmotion, stress: newStress, aggression: newAggression }
                });
            }
        });

        // 5. Ein einziger Store-Call für alle NPCs
        if (npcUpdates.size > 0) {
            (state as any).batchUpdateNpcs(npcUpdates);
        }
    }

    public calculateEmotion(npc: Partial<NPCData>): EmotionalState {
        const emotions = npc.emotions;
        if (!emotions) return EmotionalState.NEUTRAL;

        if (emotions.aggression > 0.8) return EmotionalState.AGGRESSIVE;
        if (emotions.stress > 0.7) return EmotionalState.ANGRY;
        if (emotions.fear > 0.6) return EmotionalState.TERRIFIED;
        if (emotions.stress > 0.4) return EmotionalState.STRESSED;

        return EmotionalState.NEUTRAL;
    }
}

export const npcAiManager = NPCAIManager.getInstance();
