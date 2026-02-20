import { EmotionalState, Faction, NPCState, NPCType } from '@/types/enums';
import { poiSystem } from '@/systems/POISystem';
import { arrestSystem } from '@/systems/ArrestSystem';
import { NPCData } from '@/types/interfaces';
import type { StateCreator } from 'zustand';
import type { GameStore } from '../types';
import { useDialogStore } from '@/managers/DialogManager';
import { KrauseDialog } from '@/data/dialogs/KrauseDialog';
import { EventManager } from '@/managers/EventManager';
import QuestManager from '@/managers/QuestManager';

import { useNotificationStore } from '../notificationStore';
import { useFeatureFlags } from '@/core/FeatureFlags';
import { GAME_BALANCE } from '@/constants/GameBalance';

export const createGameSlice: StateCreator<GameStore, [], [], Pick<GameStore,
    'gameState' | 'missions' | 'npcs' | 'markedNpcIds' | 'projectiles' | 'worldItems' | 'player' | 'tensionLevel' | 'moralLevel' | 'escalationLevel' |
    'startGame' | 'resetGame' | 'setPoints' | 'addPoints' | 'takeDamage' |
    'updateMissionProgress' | 'nextMission' | 'setGameOver' | 'setVictory' |
    'setPrompt' | 'setTime' | 'spawnWave' | 'addProjectile' |
    'removeProjectile' | 'spawnItem' | 'removeWorldItem' | 'saveGame' | 'loadGame' | 'markNpc' | 'updateNpc' |
    'setPlayerPosition' | 'setPlayerHealth' | 'setTension' | 'toggleBinoculars' |
    'arrestNpc' | 'adjustKarma' | 'startCutscene' | 'endCutscene' | 'setCutsceneTime' | 'unlockAchievement' | 'hasAchievement'
>> = (set, get) => ({
    gameState: {
        points: 0,
        health: GAME_BALANCE.player.maxHealth,
        isGameOver: false,
        isVictory: false,
        dayTime: GAME_BALANCE.world.initialDayTimeMinutes,
        currentMissionIndex: 0,
        menuState: 'MAIN',
        isPlaying: false,
        activeCutscene: null,
        activePrompt: null,
        cutsceneTime: 0,
        currentLevelId: 'LEVEL_1_STEPHANSPLATZ'
    },
    npcs: [],
    markedNpcIds: [],
    missions: [
        { id: 1, type: 'REACH_TARGET', description: 'Beobachtungsposten Nordseite erreichen', targetAmount: 1, currentAmount: 0 },
        { id: 2, type: 'REACH_TARGET', description: 'Martin Krause identifizieren die Menge filmen', targetAmount: 1, currentAmount: 0 },
        { id: 3, type: 'DISPERSE_RIOTERS', description: 'Situation deeskalieren oder Randalierer zerstreuen', targetAmount: 5, currentAmount: 0 }
    ],

    projectiles: [],
    worldItems: [],

    player: {
        id: 'player_01',
        position: [30, 1, 30],
        rotation: 0,
        health: GAME_BALANCE.player.maxHealth,
        stamina: GAME_BALANCE.player.maxStamina,
        armor: GAME_BALANCE.player.baseArmor,
        karma: 0,
        inventory: []
    },
    tensionLevel: GAME_BALANCE.crowd.initialTension,
    moralLevel: GAME_BALANCE.crowd.initialMoral,
    escalationLevel: GAME_BALANCE.crowd.initialEscalation,
    flags: {},
    achievements: [],

    startGame: () => set((state) => {
        // Enable Features for Phase 14
        useFeatureFlags.getState().enablePhase(14);

        const krause: NPCData = {
            id: 9999,
            type: NPCType.KRAUSE,
            position: [0.0, 2.5, -48.0], // Direkt auf/vor der Bühne
            velocity: [0, 0, 0],
            rotation: 0,
            state: NPCState.IDLE,
            faction: Faction.KRAUSE_FOLLOWERS,
            emotions: { current: EmotionalState.NEUTRAL, stress: 0, aggression: 0, fear: 0 },
            lodLevel: 0,
            hairColor: '#ffffff',
            outfitId: 'suit_01'
        };

        // Crowd-Spawning: Optimized for performance/density balance
        const crowd: NPCData[] = Array.from({ length: 200 }, (_, i) => {
            let posX, posZ;
            
            if (i < 350) {
                // 350 NPCs vor der Bühne [0, 0, -50]
                const angle = Math.random() * Math.PI; // Halbkreis vor der Bühne
                const radius = 5 + Math.random() * 40; // 5m bis 45m Abstand
                posX = Math.sin(angle - Math.PI/2) * radius;
                posZ = -50 + Math.cos(angle - Math.PI/2) * radius;
            } else {
                // 150 NPCs verteilt in der Stadt auf Gehwegen/Straßen
                // Wir nutzen das Straßenraster (alle 50m eine Straße)
                const gridX = Math.floor((Math.random() - 0.5) * 6); // -3 bis 2
                const gridZ = Math.floor((Math.random() - 0.5) * 6);
                
                const onSidewalk = Math.random() > 0.3;
                const offset = onSidewalk ? 6 : 0; // 6m Offset für Gehweg
                
                if (Math.random() > 0.5) {
                    // Auf einer Nord-Süd Straße/Gehweg
                    posX = gridX * 50 + (Math.random() > 0.5 ? offset : -offset);
                    posZ = (Math.random() - 0.5) * 400;
                } else {
                    // Auf einer Ost-West Straße/Gehweg
                    posX = (Math.random() - 0.5) * 400;
                    posZ = gridZ * 50 + (Math.random() > 0.5 ? offset : -offset);
                }

                // Sicherheitscheck: Nicht im Bühnenbereich [0,0,-50] spawnen
                const distToStage = Math.sqrt(posX * posX + (posZ + 50) * (posZ + 50));
                if (distToStage < 30) {
                    posX += 40;
                    posZ += 40;
                }
            }

            return {
                id: 2000 + i,
                type: Math.random() > 0.8 ? NPCType.RIOTER : NPCType.CIVILIAN,
                position: [posX, 1, posZ] as [number, number, number],
                velocity: [0, 0, 0] as [number, number, number],
                rotation: Math.random() * Math.PI * 2,
                state: NPCState.IDLE,
                faction: Faction.CIVILIAN,
                emotions: { current: EmotionalState.NEUTRAL, stress: 0, aggression: 0, fear: 0 },
                lodLevel: 2,
                hairColor: '#442211',
                outfitId: 'casual_01'
            };
        });

        // V7.0: Register all NPCs in the POI system
        [krause, ...crowd].forEach(npc => {
            const isKrause = npc.type === NPCType.KRAUSE;
            poiSystem.registerPOI({
                id: `npc_${npc.id}`,
                type: 'PERSON',
                position: npc.position as [number, number, number],
                interactionRadius: 2,
                label: isKrause ? "Mit Krause sprechen" : "Bürger verhaften",
                action: () => {
                    if (isKrause) {
                        useDialogStore.getState().startDialog(KrauseDialog);
                    } else {
                        arrestSystem.startArrest(npc.id);
                    }
                }
            });
        });

        useNotificationStore.getState().addNotification("Einsatz begonnen: Sichern Sie den Stephansplatz.", "INFO");
        setTimeout(() => {
            useNotificationStore.getState().addNotification("WARNUNG: Erhöhte Aggressivität in Sektor 4 gemeldet.", "WARNING");
        }, 3000);

        const achievements = (state.achievements.includes('ACH_001')
            ? state.achievements
            : [...state.achievements, 'ACH_001']) as any[]; // Temporary fix for type mismatch

        return {
            gameState: {
                ...state.gameState,
                menuState: 'PLAYING',
                isPlaying: true,
                isGameOver: false,
                isVictory: false,
                health: GAME_BALANCE.player.maxHealth,
                points: 0,
                currentMissionIndex: 0,
                activePrompt: achievements.includes('ACH_001')
                    ? `ACHIEVEMENT FREIGESCHALTET: ACH_001`
                    : state.gameState.activePrompt
            },
            missions: state.missions.map(m => ({ ...m, currentAmount: 0 })),
            tensionLevel: GAME_BALANCE.crowd.initialTension,
            worldItems: [
                { id: 'item1', itemId: 'medkit', position: [2, 0.5, 5] },
                { id: 'item2', itemId: 'stone', position: [-2, 0.5, 5] },
            ],
            projectiles: [],
            npcs: [krause, ...crowd],
            achievements
        };
    }),

    resetGame: () => set((state) => ({
        gameState: {
            ...state.gameState,
            menuState: 'MAIN',
            previousMenuState: undefined,
            isPlaying: false,
            isGameOver: false,
            isVictory: false
        }
    })),

    setPoints: (points) => set((state) => ({
        gameState: { ...state.gameState, points }
    })),

    addPoints: (amount) => set((state) => ({
        gameState: { ...state.gameState, points: state.gameState.points + amount }
    })),

    takeDamage: (amount) => set((state) => {
        const newHealth = Math.max(0, state.gameState.health - amount);
        return {
            gameState: {
                ...state.gameState,
                health: newHealth,
                isGameOver: newHealth <= 0
            }
        };
    }),

    updateMissionProgress: (amount) => set((state) => {
        const currentMission = state.missions[state.gameState.currentMissionIndex];
        if (!currentMission) return {};

        const newMissions = state.missions.map((m, i) => {
            if (i === state.gameState.currentMissionIndex) {
                return { ...m, currentAmount: m.currentAmount + amount };
            }
            return m;
        });

        return { missions: newMissions };
    }),

    nextMission: () => set((state) => ({
        gameState: {
            ...state.gameState,
            currentMissionIndex: Math.min(state.gameState.currentMissionIndex + 1, state.missions.length)
        }
    })),

    setGameOver: (isOver) => set((state) => ({
        gameState: { ...state.gameState, isGameOver: isOver }
    })),

    setVictory: (isVictory) => set((state) => ({
        gameState: { ...state.gameState, isVictory: isVictory }
    })),

    setTime: (time) => set((state) => ({
        gameState: { ...state.gameState, dayTime: time }
    })),

    setPrompt: (text: string | null) => set((state) => ({
        gameState: { ...state.gameState, activePrompt: text }
    })),
    startCutscene: (id) => set((state) => ({
        gameState: { ...state.gameState, activeCutscene: id, cutsceneTime: 0 }
    })),
    endCutscene: () => set((state) => {
        const isEnding = state.gameState.isGameOver || state.gameState.isVictory;
        return {
            gameState: {
                ...state.gameState,
                activeCutscene: null,
                cutsceneTime: 0,
                ...(isEnding ? { isPlaying: false, menuState: 'MAIN' } : {})
            }
        };
    }),
    setCutsceneTime: (time) => set((state) => ({
        gameState: { ...state.gameState, cutsceneTime: time }
    })),
    unlockAchievement: (id) => set((state) => {
        if (state.achievements.includes(id)) return {};
        useNotificationStore.getState().addNotification(`Achievement freigeschaltet: ${id}`, "SUCCESS", 6000);
        return {
            achievements: [...state.achievements, id],
            gameState: { ...state.gameState, activePrompt: `ACHIEVEMENT FREIGESCHALTET: ${id}` }
        };
    }),
    hasAchievement: (id) => {
        return get().achievements.includes(id);
    },
    setFlag: (key, enabled) => {
        set((state) => ({
            flags: { ...state.flags, [key]: enabled }
        }));
        EventManager.getInstance().onFlag(key);
        QuestManager.getInstance().onFlag(key);
    },
    hasFlag: (key) => {
        return !!get().flags[key];
    },
    clearFlag: (key) => set((state) => {
        const next = { ...state.flags };
        delete next[key];
        return { flags: next };
    }),
    // Notify managers on flag changes
    // Note: keep outside set(...) to avoid nested set loops
    // Callbacks should be invoked after state mutation (synchronous here)
    // Consumers can call useGameStore.getState().setFlag(...) which triggers these hooks
    // We wrap to ensure manager reactions occur alongside the flag set
    // (no comments in code; this is only explanation for the summary)

    triggerScenario: (scenario) => {
        const { spawnWave } = get();
        console.log(`[GameStore] Triggering Scenario: ${scenario}`);
        
        switch (scenario) {
            case 'DEMONSTRATION':
                // 50 Demonstranten an einem Punkt
                spawnWave(50, NPCType.RIOTER, Faction.RIOTER, [20, 1, 20]);
                break;
            case 'POLICE_UNIT':
                // 50 Polizisten (Hundertschaft)
                spawnWave(50, NPCType.POLICE, Faction.POLICE, [-20, 1, -20]);
                break;
            case 'CLASH':
                // 25 vs 25 Clash
                spawnWave(25, NPCType.RIOTER, Faction.RIOTER, [5, 1, 5]);
                spawnWave(25, NPCType.POLICE, Faction.POLICE, [-5, 1, 5]);
                break;
        }
    },

    spawnWave: (count, type, faction, centerPos) => set((state) => {
        const newNpcs: NPCData[] = Array.from({ length: count }, (_, i) => {
            const id = Date.now() + i;
            const pos: [number, number, number] = centerPos 
                ? [centerPos[0] + (Math.random() - 0.5) * 10, 1, centerPos[2] + (Math.random() - 0.5) * 10]
                : [(Math.random() - 0.5) * 100, 1, (Math.random() - 0.5) * 100];
            
            const npc: NPCData = {
                id,
                type,
                position: pos,
                velocity: [0, 0, 0],
                rotation: Math.random() * Math.PI * 2,
                state: NPCState.IDLE,
                faction,
                emotions: { current: EmotionalState.NEUTRAL, stress: 0, aggression: 0, fear: 0 },
                lodLevel: 2,
                hairColor: '#442211',
                outfitId: 'uniform_01'
            };

            // Register POI for each new NPC
            poiSystem.registerPOI({
                id: `npc_${id}`,
                type: 'PERSON',
                position: pos,
                interactionRadius: 2,
                label: type === NPCType.POLICE ? "Polizei" : "Bürger",
                action: () => arrestSystem.startArrest(id)
            });

            return npc;
        });

        return { npcs: [...state.npcs, ...newNpcs] };
    }),

    addNPC: (npc) => set((state) => {
        if (state.npcs.some(n => n.id === npc.id)) {
            return {};
        }
        const fullNpc: NPCData = {
            velocity: [0, 0, 0],
            rotation: 0,
            state: NPCState.IDLE,
            faction: Faction.CIVILIAN,
            emotions: { current: EmotionalState.NEUTRAL, stress: 0, aggression: 0, fear: 0 },
            lodLevel: 0,
            hairColor: '#442211',
            outfitId: 'default',
            ...npc
        };
        return {
            npcs: [...state.npcs, fullNpc]
        };
    }),

    markNpc: (id: number) => set((state) => ({
        markedNpcIds: [...state.markedNpcIds, id]
    })),

    updateNpc: (id: number, data: Partial<NPCData>) => set((state) => ({
        npcs: state.npcs.map(npc => npc.id === id ? { ...npc, ...data } : npc)
    })),

    addProjectile: (position, velocity, type = 'STONE') => set((state) => ({
        projectiles: [
            ...state.projectiles,
            { id: Date.now() + Math.random(), position, velocity, type }
        ]
    })),

    removeProjectile: (id) => set((state) => ({
        projectiles: state.projectiles.filter(p => p.id !== id)
    })),

    spawnItem: (itemId, position) => set((state) => ({
        worldItems: [
            ...state.worldItems,
            { id: Math.random().toString(36).substr(2, 9), itemId, position }
        ]
    })),

    removeWorldItem: (id) => set((state) => ({
        worldItems: state.worldItems.filter(item => item.id !== id)
    })),

    saveGame: () => {
        const state = get();
        const dataToSave = {
            gameState: state.gameState,
            missions: state.missions,
            npcs: state.npcs,
            player: state.player,
            worldItems: state.worldItems,
            achievements: state.achievements
        };
        localStorage.setItem('corona_control_save_v7', JSON.stringify(dataToSave));
        console.log("Game Saved (V7)!");
    },

    loadGame: () => {
        const saved = localStorage.getItem('corona_control_save_v7');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                set((state) => ({
                    ...state,
                    gameState: data.gameState,
                    missions: data.missions,
                    npcs: data.npcs || [],
                    player: { ...state.player, ...data.player },
                    worldItems: data.worldItems || [],
                    achievements: data.achievements || []
                }));
                return true;
            } catch (_) {
                return false;
            }
        }
        return false;
    },

    setPlayerPosition: (pos) => set((state) => ({
        player: { ...state.player, position: pos }
    })),

    setPlayerHealth: (hp) => set((state) => ({
        player: { ...state.player, health: hp }
    })),

    setTension: (tension) => set({ tensionLevel: tension }),

    toggleBinoculars: () => {
        console.log("Toggle Fernglas");
    },

    arrestNpc: (npcId) => {
        set((state) => ({
            npcs: state.npcs.map(npc =>
                npc.id === npcId ? { ...npc, state: NPCState.ARRESTED } : npc
            )
        }));
        get().adjustKarma(10); // Verhaftung gibt positives Karma
    },

    adjustKarma: (amount) => {
        set((state) => ({
            player: { ...state.player, karma: Math.max(-100, Math.min(100, state.player.karma + amount)) }
        }));
    },

    batchUpdateNpcs: (updates: Map<number, Partial<NPCData>>) => set((state) => ({
        npcs: state.npcs.map(npc => {
            const update = updates.get(npc.id);
            return update ? { ...npc, ...update } : npc;
        })
    }))
});
