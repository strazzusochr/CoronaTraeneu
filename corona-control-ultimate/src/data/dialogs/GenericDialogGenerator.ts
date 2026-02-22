import { DialogTree } from '@/types/DialogTypes';
import { NPCType } from '@/types/enums';
import { useGameStore } from '@/stores/gameStore';
import { arrestSystem } from '@/systems/ArrestSystem';
import TacticsManager from '@/managers/TacticsManager';

// Helpers
const greetings = [
    "Guten Tag, Officer. Ich hoffe, wir verhalten uns alle ordnungsgemäß.",
    "Hallo! Was gibt es denn? Ich habe nichts falsch gemacht.",
    "Ja, bitte? Ich bin in Eile.",
    "Officer! Ich halte mich an alle Regeln, keine Sorge.",
    "Was wollen Sie von mir? Ich habe meine Papiere dabei."
];

const rudeGreetings = [
    "Schon wieder die Polizei... Was wollen Sie diesmal?",
    "Haben Sie nichts Besseres zu tun, als ehrliche Bürger zu belästigen?",
    "Fassen Sie mich nicht an! Ich kenne meine Rechte!"
];

/**
 * Generates a dynamic dialog tree for a generic civilian.
 */
export function generateGenericDialog(npcId: number, npcType: NPCType, npcName: string): DialogTree {
    const store = useGameStore.getState();
    const tension = store.tensionLevel;
    const hasRadio = store.equipment.mainHand?.id === 'ITEM_RADIO';
    const hasPepperSpray = store.equipment.mainHand?.id === 'ITEM_PEPPER_SPRAY';
    const hasMasks = store.inventory.some(slot => slot.item?.id === 'ITEM_MASK');

    // Decide initial mood based on tension and randomness
    const isHostile = Math.random() < (tension / 100) * 0.5 + 0.1; // 10% to 60% chance to be hostile

    const greetingText = isHostile 
        ? rudeGreetings[Math.floor(Math.random() * rudeGreetings.length)] 
        : greetings[Math.floor(Math.random() * greetings.length)];

    const options: any[] = [
        {
            text: 'Bitte gehen Sie weiter und halten Sie Abstand.',
            nextNodeId: 'response_move_along'
        }
    ];

    // Mask Option
    if (hasMasks) {
        options.push({
            text: 'Sie tragen keine Maske. Hier, setzen Sie diese auf.',
            nextNodeId: 'response_mask'
        });
    } else {
        options.push({
            text: 'Haben Sie keine Maske? Bitte verlassen Sie den Bereich.',
            nextNodeId: 'response_no_mask'
        });
    }

    // Equipment Options
    if (isHostile && hasPepperSpray) {
        options.push({
            text: '[Pfefferspray] Treten Sie zurück oder ich setze Reizgas ein!',
            nextNodeId: 'action_pepperspray'
        });
    }

    if (hasRadio) {
        options.push({
            text: '[Funk] Leitstelle, bitte diese Person überprüfen...',
            nextNodeId: 'response_radio_check'
        });
    }

    return {
        id: `generic_dialog_${npcId}`,
        rootNodeId: 'start',
        nodes: {
            'start': {
                id: 'start',
                type: 'NPC',
                speakerId: npcName,
                text: greetingText,
                emotion: isHostile ? 'ANGRY' : 'NEUTRAL',
                nextNodeId: 'choice_1'
            },
            'choice_1': {
                id: 'choice_1',
                type: 'PLAYER_CHOICE',
                choices: options
            },
            'response_move_along': {
                id: 'response_move_along',
                type: 'NPC',
                speakerId: npcName,
                text: isHostile ? 'Dann lassen Sie mich doch in Ruhe!' : 'Natürlich, ich bin schon weg.',
                emotion: isHostile ? 'ANGRY' : 'HAPPY',
                nextNodeId: undefined // End of dialog
            },
            'response_mask': {
                id: 'response_mask',
                type: 'NPC',
                speakerId: npcName,
                text: isHostile 
                    ? 'Ich setze so einen Fetzen sicher nicht auf! Mein Körper, meine Entscheidung!' 
                    : 'Oh, vielen Dank. Ich hatte meine tatsächlich vergessen.',
                emotion: isHostile ? 'ANGRY' : 'HAPPY',
                nextNodeId: isHostile ? 'hostile_reaction' : 'action_give_mask'
            },
            'response_no_mask': {
                id: 'response_no_mask',
                type: 'NPC',
                speakerId: npcName,
                text: isHostile 
                    ? 'Sie haben mir gar nichts zu befehlen! Ich bleibe, wo ich will!' 
                    : 'Tut mir leid, Sie haben recht. Ich gehe sofort.',
                emotion: isHostile ? 'ANGRY' : 'SAD',
                nextNodeId: isHostile ? 'hostile_reaction' : undefined
            },
            'response_radio_check': {
                id: 'response_radio_check',
                type: 'NPC',
                speakerId: npcName,
                text: 'Was soll das? Ich bin ein freier Bürger! Diktatur!',
                emotion: 'ANGRY',
                nextNodeId: 'hostile_reaction'
            },
            'hostile_reaction': {
                id: 'hostile_reaction',
                type: 'PLAYER_CHOICE',
                choices: [
                    {
                        text: 'Ich warne Sie ein letztes Mal! Leisten Sie den Anweisungen Folge!',
                        nextNodeId: 'dummy',
                        skillCheck: {
                            skillType: 'INTIMIDATION',
                            difficulty: 4 + (tension / 20),
                            successNodeId: 'hostile_submits',
                            failureNodeId: 'action_escalate'
                        }
                    },
                    {
                        text: '[Verhaften] Sie sind vorläufig festgenommen! Hände auf den Rücken!',
                        nextNodeId: 'action_arrest'
                    }
                ]
            },
            'hostile_submits': {
                id: 'hostile_submits',
                type: 'NPC',
                speakerId: npcName,
                text: 'Schon gut, schon gut! Gewalt ist keine Lösung... Ich gehe ja.',
                emotion: 'AFRAID',
                nextNodeId: undefined
            },
            // ACTIONS
            'action_give_mask': {
                id: 'action_give_mask',
                type: 'ACTION',
                nextNodeId: undefined,
                actions: () => {
                    const gameStore = useGameStore.getState();
                    const slotIndex = gameStore.inventory.findIndex(slot => slot.item?.id === 'ITEM_MASK');
                    if (slotIndex !== -1) {
                        gameStore.removeItem(slotIndex, 1);
                        gameStore.adjustKarma(5);
                        gameStore.setPrompt("Maske ausgehändigt. Zivilist ist kooperativ. (+5 Karma)");
                    }
                }
            },
            'action_escalate': {
                id: 'action_escalate',
                type: 'ACTION',
                nextNodeId: undefined,
                actions: () => {
                    const gameStore = useGameStore.getState();
                    gameStore.setPrompt("Verhandlung gescheitert! Der Zivilist flüchtet oder wird aggressiv!");
                    gameStore.setTension(gameStore.tensionLevel + 5);
                    gameStore.updateNpc(npcId, { state: 'FLEE' as any });
                }
            },
            'action_arrest': {
                id: 'action_arrest',
                type: 'ACTION',
                nextNodeId: undefined,
                actions: () => {
                    const gameStore = useGameStore.getState();
                    gameStore.setPrompt("Festnahme eingeleitet.");
                    arrestSystem.startArrest(npcId);
                }
            },
            'action_pepperspray': {
                id: 'action_pepperspray',
                type: 'ACTION',
                nextNodeId: undefined,
                actions: () => {
                    const gameStore = useGameStore.getState();
                    gameStore.setPrompt("Pfefferspray eingesetzt! Ziel ist betäubt.");
                    gameStore.updateNpc(npcId, { state: 'STUNNED' as any });
                    gameStore.adjustKarma(-5);
                    gameStore.setTension(gameStore.tensionLevel + 10);
                    
                    // Timer zum Aufwachen
                    setTimeout(() => {
                        gameStore.updateNpc(npcId, { state: 'IDLE' as any });
                    }, 5000);
                }
            }
        }
    };
}
