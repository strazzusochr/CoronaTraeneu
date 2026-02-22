import { useGameStore } from '@/stores/gameStore';
import { NPCState, NPCType } from '@/types/enums';
import { arrestSystem } from './ArrestSystem';
import TacticsManager from '@/managers/TacticsManager';
import { useDialogStore } from '@/managers/DialogManager';
import { KrauseDialog } from '@/data/dialogs/KrauseDialog';
import { generateGenericDialog } from '@/data/dialogs/GenericDialogGenerator';
import type { DialogTree } from '@/types/DialogTypes';

/**
 * InteractionSystem (V7.0)
 * Verwaltet kontextsensitive Interaktionen zwischen Spieler und NPCs.
 */
export class InteractionSystem {
    private static instance: InteractionSystem;

    private constructor() {}

    public static getInstance(): InteractionSystem {
        if (!this.instance) {
            this.instance = new InteractionSystem();
        }
        return this.instance;
    }

    /**
     * Hauptmethode für Interaktionen mit einem NPC.
     * Entscheidet basierend auf dem Status des NPC und der Ausrüstung des Spielers,
     * welche Aktionen möglich sind.
     */
    public handleInteraction(npcId: number) {
        const state = useGameStore.getState();
        const npc = state.npcs.find(n => n.id === npcId);
        if (!npc) return;

        const inventory = state.inventory;
        const mainHandItem = state.equipment.mainHand;

        // Verfügbare Aktionen sammeln
        const actions: { label: string; action: () => void }[] = [];

        // 1. Reden (Immer möglich, außer bei Randalierern im Kampf)
        if (npc.state !== NPCState.ATTACK && npc.state !== NPCState.RIOT) {
            actions.push({
                label: `Mit ${this.getNpcName(npc.type)} sprechen`,
                action: () => this.startDialog(npcId)
            });
        }

        // 2. Verhaften (Für alle Zivilisten/Randalierer, die noch nicht verhaftet sind)
        if (npc.type !== NPCType.POLICE && npc.state !== NPCState.ARRESTED) {
            actions.push({
                label: "Verhaften",
                action: () => arrestSystem.startArrest(npcId)
            });
        }

        // 3. Medizinische Hilfe (Wenn verletzt)
        if (npc.state === NPCState.INJURED) {
            const hasMedkit = inventory.find(slot => slot.item?.id === 'ITEM_MEDKIT');
            const hasSyringe = inventory.find(slot => slot.item?.id === 'ITEM_SYRINGE');

            if (hasMedkit || hasSyringe) {
                actions.push({
                    label: "Erste Hilfe leisten",
                    action: () => this.applyMedicalAid(npcId, !!hasSyringe)
                });
            }
        }

        // 4. Maske verteilen (Wenn Civilian ohne Maske - falls wir das tracken)
        const hasMask = inventory.find(slot => slot.item?.id === 'ITEM_MASK');
        if (hasMask && npc.type === NPCType.CIVILIAN) {
            actions.push({
                label: "Maske aushändigen",
                action: () => this.giveMask(npcId)
            });
        }

        // 5. Taktische Ausrüstung (Radio / Funk)
        if (mainHandItem?.id === 'ITEM_RADIO') {
            actions.push({
                label: "Verstärkung anfordern",
                action: () => this.callReinforcements()
            });
        }

        // 6. Pfefferspray (Gegen aggressive NPCs)
        if (mainHandItem?.id === 'ITEM_PEPPER_SPRAY') {
            actions.push({
                label: "Pfefferspray einsetzen",
                action: () => this.usePepperSpray(npcId)
            });
        }

        // Aktion ausführen
        if (actions.length === 1) {
            actions[0].action();
        } else if (actions.length > 1) {
            // Mehrere Optionen -> Öffne HUD Interaction Menu (Phase 4)
            this.showInteractionMenu(npcId, actions);
        } else {
            state.setPrompt("Keine Interaktion möglich.");
        }
    }

    private getNpcName(type: NPCType): string {
        switch (type) {
            case NPCType.KRAUSE: return "Martin Krause";
            case NPCType.MARIA: return "Maria";
            case NPCType.STEFAN: return "Stefan";
            case NPCType.HEINRICH: return "Heinrich";
            default: return "Bürger";
        }
    }

    private startDialog(npcId: number) {
        console.log(`Starte Dialog mit NPC ${npcId}`);
        const state = useGameStore.getState();
        const npc = state.npcs.find(n => n.id === npcId);
        if (!npc) return;

        if (npc.type === NPCType.KRAUSE) {
            useDialogStore.getState().startDialog(KrauseDialog);
        } else {
            // Dynamischer Standard-Dialog für Zivilisten und andere NPCs
            const genericDialog = generateGenericDialog(npcId, npc.type, this.getNpcName(npc.type));
            useDialogStore.getState().startDialog(genericDialog);
        }
    }

    private applyMedicalAid(npcId: number, use_syringe: boolean) {
        const state = useGameStore.getState();
        const itemId = use_syringe ? 'ITEM_SYRINGE' : 'ITEM_MEDKIT';
        
        // Item verbrauchen
        const slotIndex = state.inventory.findIndex(slot => slot.item?.id === itemId);
        if (slotIndex !== -1) {
            state.removeItem(slotIndex, 1);
            state.updateNpc(npcId, { state: NPCState.IDLE });
            state.adjustKarma(use_syringe ? 5 : 3);
            state.setPrompt(`Medizinische Hilfe geleistet (${use_syringe ? 'Spritze' : 'Medkit'})`);
        }
    }

    private giveMask(_npcId: number) {
        const state = useGameStore.getState();
        const slotIndex = state.inventory.findIndex(slot => slot.item?.id === 'ITEM_MASK');
        if (slotIndex !== -1) {
            state.removeItem(slotIndex, 1);
            state.adjustKarma(2);
            state.setPrompt("Maske ausgehändigt. (+2 Karma)");
            // NPC visuell ändern? (z.B. OutfitId anpassen)
        }
    }

    private usePepperSpray(npcId: number) {
        const state = useGameStore.getState();
        state.updateNpc(npcId, { state: NPCState.STUNNED });
        state.adjustKarma(-1);
        state.setPrompt("Ziel betäubt!");
        
        // Timer zum Aufwachen
        setTimeout(() => {
            state.updateNpc(npcId, { state: NPCState.IDLE });
        }, 5000);
    }

    private callReinforcements() {
        console.log("Leitstelle: Verstärkung ist unterwegs.");
        TacticsManager.getInstance().commandCharge(1); // Squad 1 stürmt vor
        useGameStore.getState().setPrompt("Verstärkung angefordert!");
    }

    private showInteractionMenu(npcId: number, actions: { label: string; action: () => void }[]) {
        // Hier wird nun das richtige UI-Menü getriggert anstatt nur geloggt
        const npc = useGameStore.getState().npcs.find(n => n.id === npcId);
        const title = this.getNpcName(npc?.type || NPCType.CIVILIAN);
        useGameStore.getState().setInteractionMenu(npcId, title, actions);
    }
}

export const interactionSystem = InteractionSystem.getInstance();
