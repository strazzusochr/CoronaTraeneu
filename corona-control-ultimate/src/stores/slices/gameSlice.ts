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
import { interactionSystem } from '@/systems/InteractionSystem';

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
        currentLevelId: 'LEVEL_1_STEPHANSPLATZ',
        activeInteraction: null
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
        maxHealth: GAME_BALANCE.player.maxHealth,
        stamina: GAME_BALANCE.player.maxStamina,
        maxStamina: GAME_BALANCE.player.maxStamina,
        armor: GAME_BALANCE.player.baseArmor,
        maxArmor: GAME_BALANCE.player.baseArmor,
        karma: 0,
        inventory: [],
        isGrounded: true,
        isSprinting: false,
        isJumping: false,
        isDead: false,
        currentEquipmentSlot: 1,
        isUsingBinoculars: false
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

        // ═══════════════════════════════════════════════════════
        // NPC SPAWN SYSTEM - Logische Verteilung (~100 NPCs)
        // Bühne bei [0, 0, -50], Park bei [-30, 0, 20]
        // Stephansdom bei [50, 0, -30]
        // ═══════════════════════════════════════════════════════
        const crowd: NPCData[] = [];
        let npcId = 2000;

        // ── GRUPPE 1: Zuschauer vor der Bühne (25 NPCs) ──────────
        // Halbkreis vor der Bühne [0, 0, -50], Richtung Bühne schauend
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI; // Halbkreis
            const radius = 4 + Math.random() * 30; // 4m-34m Abstand
            const posX = Math.sin(angle - Math.PI / 2) * radius;
            const posZ = -50 + Math.cos(angle - Math.PI / 2) * radius;
            // Richtung zur Bühne schauen
            const rotation = Math.atan2(-posX, -(-50 - posZ));
            crowd.push({
                id: npcId++,
                type: NPCType.CIVILIAN,
                position: [posX, 1, posZ],
                velocity: [0, 0, 0],
                rotation,
                state: NPCState.IDLE,
                faction: Faction.CIVILIAN,
                emotions: { current: EmotionalState.NEUTRAL, stress: 0, aggression: 0, fear: 0 },
                lodLevel: 2, hairColor: '#553311', outfitId: 'casual_01'
            });
        }

        // ── GRUPPE 2: Polizei-Absperrung & Patrouillen (13 NPCs) ──
        // Absperrungslinie vor der Bühne (5 NPCs in Reihe)
        for (let i = 0; i < 5; i++) {
            const posX = -12 + i * 6; // Reihe von links nach rechts (weiter gestreckt)
            const posZ = -50 + 35; // 35m vor der Bühne = Absperrung
            crowd.push({
                id: npcId++,
                type: NPCType.POLICE,
                position: [posX, 1, posZ],
                velocity: [0, 0, 0],
                rotation: Math.PI, // Richtung Publikum
                state: NPCState.IDLE,
                faction: Faction.POLICE,
                emotions: { current: EmotionalState.NEUTRAL, stress: 0, aggression: 0, fear: 0 },
                lodLevel: 1, hairColor: '#111111', outfitId: 'uniform_01'
            });
        }
        // Polizei-Patrouillen in der Stadt (8 NPCs, 4 Zweier-Gruppen)
        const policePatrolPoints: [number, number][] = [
            [30, 10], [30, 12], // Gruppe 1: Hauptstraße Ost
            [-25, -20], [-23, -20], // Gruppe 2: Westlicher Eingang
            [50, -25], [52, -25], // Gruppe 3: Beim Stephansdom
            [-40, 30], [-38, 30], // Gruppe 4: Park-Eingang
        ];
        policePatrolPoints.forEach(([px, pz]) => {
            crowd.push({
                id: npcId++,
                type: NPCType.POLICE,
                position: [px, 1, pz],
                velocity: [0, 0, 0],
                rotation: Math.random() * Math.PI * 2,
                state: NPCState.IDLE,
                faction: Faction.POLICE,
                emotions: { current: EmotionalState.NEUTRAL, stress: 0, aggression: 0, fear: 0 },
                lodLevel: 2, hairColor: '#111111', outfitId: 'uniform_01'
            });
        });

        // ── GRUPPE 3: Demonstranten (15 NPCs) ────────────────────
        // In Gruppen formiert, teils aggressiv
        for (let i = 0; i < 15; i++) {
            // 3 Cluster: links der Bühne, rechts der Bühne, am Eingang
            let posX: number, posZ: number;
            if (i < 6) {
                // Cluster 1: Links der Bühne
                posX = -25 + (Math.random() - 0.5) * 12;
                posZ = -45 + (Math.random() - 0.5) * 12;
            } else if (i < 11) {
                // Cluster 2: Rechts der Bühne
                posX = 25 + (Math.random() - 0.5) * 12;
                posZ = -45 + (Math.random() - 0.5) * 12;
            } else {
                // Cluster 3: Beim U-Bahn-Eingang
                posX = 25 + (Math.random() - 0.5) * 10;
                posZ = -30 + (Math.random() - 0.5) * 10;
            }
            crowd.push({
                id: npcId++,
                type: i < 10 ? NPCType.DEMONSTRATOR : NPCType.RIOTER,
                position: [posX, 1, posZ],
                velocity: [0, 0, 0],
                rotation: Math.random() * Math.PI * 2,
                state: NPCState.IDLE,
                faction: i < 10 ? Faction.CIVILIAN : Faction.RIOTER,
                emotions: { 
                    current: i >= 10 ? EmotionalState.AGGRESSIVE : EmotionalState.STRESSED, 
                    stress: i >= 10 ? 60 : 30, aggression: i >= 10 ? 50 : 10, fear: 0 
                },
                lodLevel: 2, hairColor: '#332211', outfitId: 'casual_01'
            });
        }

        // ── GRUPPE 4: Stadt-Bewohner auf Gehwegen (20 NPCs) ──────
        for (let i = 0; i < 20; i++) {
            // Auf Straßenraster verteilt (alle 50m)
            const gridX = Math.floor((Math.random() - 0.5) * 4); // -2 bis 1
            const gridZ = Math.floor((Math.random() - 0.5) * 4);
            const sidewalkOffset = 6; // Gehweg 6m neben Straße
            
            let posX: number, posZ: number;
            if (Math.random() > 0.5) {
                posX = gridX * 50 + (Math.random() > 0.5 ? sidewalkOffset : -sidewalkOffset);
                posZ = (Math.random() - 0.5) * 200;
            } else {
                posX = (Math.random() - 0.5) * 200;
                posZ = gridZ * 50 + (Math.random() > 0.5 ? sidewalkOffset : -sidewalkOffset);
            }
            
            // Nicht in der Bühnen-Zone spawnen
            const distToStage = Math.sqrt(posX * posX + (posZ + 50) * (posZ + 50));
            if (distToStage < 40) {
                posX += 50;
                posZ += 50;
            }

            crowd.push({
                id: npcId++,
                type: NPCType.CIVILIAN,
                position: [posX, 1, posZ],
                velocity: [0, 0, 0],
                rotation: Math.random() * Math.PI * 2,
                state: Math.random() > 0.7 ? NPCState.WALK : NPCState.IDLE,
                faction: Faction.CIVILIAN,
                emotions: { current: EmotionalState.NEUTRAL, stress: 0, aggression: 0, fear: 0 },
                lodLevel: 2, hairColor: Math.random() > 0.5 ? '#664422' : '#221100', outfitId: 'casual_01'
            });
        }

        // ── GRUPPE 5: Park-Besucher (10 NPCs) ────────────────────
        // Park liegt bei [-30, 0, 20], mit Bänken und Spazierwegen
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 3 + Math.random() * 20;
            const posX = -30 + Math.cos(angle) * radius;
            const posZ = 20 + Math.sin(angle) * radius;
            crowd.push({
                id: npcId++,
                type: NPCType.CIVILIAN,
                position: [posX, 1, posZ],
                velocity: [0, 0, 0],
                rotation: Math.random() * Math.PI * 2,
                state: i < 4 ? NPCState.SITTING : NPCState.WALK,
                faction: Faction.CIVILIAN,
                emotions: { current: EmotionalState.CALM, stress: 0, aggression: 0, fear: 0 },
                lodLevel: 2, hairColor: '#774433', outfitId: 'casual_01'
            });
        }

        // ── GRUPPE 6: Radio & TV-Teams / Journalisten (5 NPCs) ──
        // 1 Team à 3 Personen + 2 Einzelreporter
        const mediaPositions: { pos: [number, number]; facing: number }[] = [
            // TV-Team: Front-links der Bühne (Kameramann + Reporter + Techniker)
            { pos: [-15, -25], facing: Math.PI * 0.8 },
            { pos: [-13, -25], facing: Math.PI * 0.8 },
            { pos: [-14, -23], facing: Math.PI * 0.8 },
            // Einzelreporter
            { pos: [5, -30], facing: Math.PI },           // Mitte, Richtung Bühne
            { pos: [40, -15], facing: Math.PI * 1.5 },    // Bei Demonstranten rechts
        ];
        mediaPositions.forEach(({ pos: [px, pz], facing }) => {
            crowd.push({
                id: npcId++,
                type: NPCType.JOURNALIST,
                position: [px, 1, pz],
                velocity: [0, 0, 0],
                rotation: facing,
                state: NPCState.IDLE,
                faction: Faction.JOURNALIST,
                emotions: { current: EmotionalState.NEUTRAL, stress: 10, aggression: 0, fear: 0 },
                lodLevel: 1, hairColor: '#333333', outfitId: 'press_01'
            });
        });

        // ── GRUPPE 7: Touristen beim Dom / Haas Haus (8 NPCs) ───
        for (let i = 0; i < 8; i++) {
            // Cluster um den Stephansdom [50, 0, -30]
            const posX = 50 + (Math.random() - 0.5) * 20;
            const posZ = -30 + (Math.random() - 0.5) * 20;
            crowd.push({
                id: npcId++,
                type: NPCType.TOURIST,
                position: [posX, 1, posZ],
                velocity: [0, 0, 0],
                rotation: Math.random() * Math.PI * 2,
                state: Math.random() > 0.5 ? NPCState.WALK : NPCState.IDLE,
                faction: Faction.CIVILIAN,
                emotions: { current: EmotionalState.NEUTRAL, stress: 0, aggression: 0, fear: 0 },
                lodLevel: 2, hairColor: '#886644', outfitId: 'tourist_01'
            });
        }

        // ── GRUPPE 8: WEGA Sicherheitskräfte (5 NPCs) ──────────
        // Strategisch an Eingängen (Einzelposten)
        const wegaPositions: [number, number][] = [
            [0, -80],    // Hinter der Bühne (Backstage)
            [-50, 0],    // Westlicher Stadt-Eingang
            [70, 0],     // Östlicher Eingang
            [0, 50],     // Nördlicher Eingang  
            [30, -60],   // Süd-Ost Flanke
        ];
        wegaPositions.forEach(([px, pz]) => {
            crowd.push({
                id: npcId++,
                type: NPCType.WEGA,
                position: [px, 1, pz],
                velocity: [0, 0, 0],
                rotation: Math.random() * Math.PI * 2,
                state: NPCState.IDLE,
                faction: Faction.POLICE,
                emotions: { current: EmotionalState.NEUTRAL, stress: 0, aggression: 0, fear: 0 },
                lodLevel: 1, hairColor: '#111111', outfitId: 'wega_01'
            });
        });

        // V7.0: Register all NPCs in the POI system
        [krause, ...crowd].forEach(npc => {
            const isKrause = npc.type === NPCType.KRAUSE;
            poiSystem.registerPOI({
                id: `npc_${npc.id}`,
                type: 'PERSON',
                position: npc.position as [number, number, number],
                interactionRadius: 4, // Erhöht auf 4m
                label: isKrause ? "Mit Krause sprechen" : "Interagieren",
                action: () => {
                    if (isKrause) {
                        if (get().gameState.currentMissionIndex === 1) {
                            get().updateMissionProgress(1);
                            get().nextMission();
                        }
                        useDialogStore.getState().startDialog(KrauseDialog);
                    } else {
                        interactionSystem.handleInteraction(npc.id);
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
            : [...state.achievements, 'ACH_001']) as unknown as any[]; // Temporary fix for type mismatch

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
                { id: 'item1', itemId: 'ITEM_MEDKIT', position: [32, 0.5, 30] },
                { id: 'item2', itemId: 'ITEM_SYRINGE', position: [30, 0.5, 32] },
                { id: 'item3', itemId: 'ITEM_MASK', position: [28, 0.5, 30] },
                { id: 'item4', itemId: 'ITEM_RADIO', position: [30, 0.5, 28] },
                { id: 'item5', itemId: 'ITEM_PEPPER_SPRAY', position: [32, 0.5, 32] },
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
    setInteractionMenu: (npcId, title, options) => set((state) => ({
        gameState: { ...state.gameState, activeInteraction: { npcId, title, options } }
    })),
    closeInteractionMenu: () => set((state) => ({
        gameState: { ...state.gameState, activeInteraction: null }
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
                interactionRadius: 4, // Erhöht auf 4m
                label: type === NPCType.POLICE ? "Polizei" : "Bürger",
                action: () => interactionSystem.handleInteraction(id)
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
            } catch {
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

    setTension: (tension) => set({ tensionLevel: Math.max(0, Math.min(100, tension)) }),

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
