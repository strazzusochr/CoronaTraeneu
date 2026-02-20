import {
  NPCData,
  PlayerState,
  Quest,
  AudioSettings,
  WorldObject
} from '@/types/interfaces';
import {
  GamePhase,
  NPCState,
  NPCType,
  QuestStatus,
  RenderTier,
  AudioBus,
  CutsceneId,
  AchievementId
} from '@/types/enums';

export type MissionType = 'SURVIVE' | 'DISPERSE_RIOTERS' | 'REACH_TARGET';

export type LevelId =
  | 'LEVEL_1_STEPHANSPLATZ'
  | 'LEVEL_2_IMPFZENTRUM'
  | 'LEVEL_3_HELDENPLATZ'
  | 'LEVEL_4_PRATERSTERN'
  | 'LEVEL_5_BALLHAUSPLATZ'
  | 'LEVEL_6_GUERTEL'
  | 'LEVEL_7_ORF_ZENTRUM';

export interface LevelMeta {
  id: LevelId;
  name: string;
  description: string;
}

export const LEVEL_DEFINITIONS: Record<LevelId, LevelMeta> = {
  LEVEL_1_STEPHANSPLATZ: {
    id: 'LEVEL_1_STEPHANSPLATZ',
    name: 'Stephansplatz – Demo 17. März',
    description: 'Innenstadt Wien, Stephansdom, große Demo gegen Corona-Maßnahmen.'
  },
  LEVEL_2_IMPFZENTRUM: {
    id: 'LEVEL_2_IMPFZENTRUM',
    name: 'Level 2 – Impfzentrum',
    description: 'Großes Impfzentrum mit Warteschlangen, Sicherheitskontrollen und medizinischem Personal.'
  },
  LEVEL_3_HELDENPLATZ: {
    id: 'LEVEL_3_HELDENPLATZ',
    name: 'Level 3 – Heldenplatz',
    description: 'Historischer Platz vor der Hofburg, große Kundgebung mit Symbolcharakter.'
  },
  LEVEL_4_PRATERSTERN: {
    id: 'LEVEL_4_PRATERSTERN',
    name: 'Level 4 – Praterstern',
    description: 'Verkehrsknotenpunkt mit Bahnhof, U-Bahn und Demonstrationszügen in Bewegung.'
  },
  LEVEL_5_BALLHAUSPLATZ: {
    id: 'LEVEL_5_BALLHAUSPLATZ',
    name: 'Level 5 – Ballhausplatz',
    description: 'Regierungsviertel mit hoher politischer Brisanz und starkem Medieninteresse.'
  },
  LEVEL_6_GUERTEL: {
    id: 'LEVEL_6_GUERTEL',
    name: 'Level 6 – Gürtel',
    description: 'Stark befahrene Hauptverkehrsader mit Brücken, Unterführungen und Engstellen.'
  },
  LEVEL_7_ORF_ZENTRUM: {
    id: 'LEVEL_7_ORF_ZENTRUM',
    name: 'Level 7 – ORF-Zentrum',
    description: 'Medienzentrum mit TV-Studios, Live-Berichterstattung und kritischer Öffentlichkeit.'
  }
};

export interface LevelRuntimeConfig {
  id: LevelId;
  maxDemoNpcs: number;
  maxPoliceNpcs: number;
  maxTotalNpcs: number;
  maxEscalationStage: 0 | 1 | 2 | 3 | 4 | 5;
  timeOfDay: 'MORNING' | 'DAY' | 'EVENING' | 'NIGHT';
  weather: 'CLEAR' | 'RAIN' | 'SNOW' | 'FOG' | 'STORM';
}

export const LEVEL5_CONFIG: LevelRuntimeConfig = {
  id: 'LEVEL_5_BALLHAUSPLATZ',
  maxDemoNpcs: 400,
  maxPoliceNpcs: 70,
  maxTotalNpcs: 500,
  maxEscalationStage: 4,
  timeOfDay: 'EVENING',
  weather: 'SNOW'
};

export const LEVEL6_CONFIG: LevelRuntimeConfig = {
  id: 'LEVEL_6_GUERTEL',
  maxDemoNpcs: 500,
  maxPoliceNpcs: 80,
  maxTotalNpcs: 600,
  maxEscalationStage: 5,
  timeOfDay: 'EVENING',
  weather: 'FOG'
};

export const LEVEL7_CONFIG: LevelRuntimeConfig = {
  id: 'LEVEL_7_ORF_ZENTRUM',
  maxDemoNpcs: 550,
  maxPoliceNpcs: 90,
  maxTotalNpcs: 700,
  maxEscalationStage: 5,
  timeOfDay: 'DAY',
  weather: 'CLEAR'
};

export interface Mission {
  id: number;
  type: MissionType;
  description: string;
  targetAmount?: number;
  currentAmount: number;
  timeLimit?: number;
}

export interface GameState {
  points: number;
  health: number;
  isGameOver: boolean;
  isVictory: boolean;
  dayTime: number;
  currentMissionIndex: number;
  menuState: 'MAIN' | 'PLAYING' | 'PAUSED' | 'SETTINGS';
  previousMenuState?: 'MAIN' | 'PLAYING' | 'PAUSED';
  isPlaying: boolean;
  activeCutscene: CutsceneId | null;
  activePrompt: string | null;
  cutsceneTime: number;
  currentLevelId: LevelId;
}

export interface GameStore {
  gameState: GameState;
  missions: Mission[];
  npcs: NPCData[];
  markedNpcIds: number[];
  player: PlayerState;
  tensionLevel: number;
  moralLevel: number;      // 0-100 (Stimmung der Masse)
  escalationLevel: number; // 0-100 (Eskalationsstufe)
  flags: Record<string, boolean>;
  achievements: AchievementId[];

  // Actions
  startGame: () => void;
  resetGame: () => void;
  setPoints: (points: number) => void;
  addPoints: (amount: number) => void;
  takeDamage: (amount: number) => void;

  // Player & Tension
  setPlayerPosition: (pos: [number, number, number]) => void;
  setPlayerHealth: (hp: number) => void;
  setTension: (tension: number) => void;
  toggleBinoculars: () => void;

  // Mission Actions
  updateMissionProgress: (amount: number) => void;
  nextMission: () => void;
  setGameOver: (isOver: boolean) => void;
  setVictory: (isVictory: boolean) => void;
  setTime: (time: number) => void;

  // Projectiles
  projectiles: Array<{
    id: number;
    type: 'STONE' | 'MOLOTOV';
    position: [number, number, number];
    velocity: [number, number, number];
  }>;
  addProjectile: (position: [number, number, number], velocity: [number, number, number], type?: 'STONE' | 'MOLOTOV') => void;
  removeProjectile: (id: number) => void;

  // World Items
  worldItems: Array<{
    id: string;
    itemId: string;
    position: [number, number, number];
  }>;
  spawnItem: (itemId: string, position: [number, number, number]) => void;
  removeWorldItem: (id: string) => void;

  // Settings (V7.0 aligned)
  settings: AudioSettings & {
    graphicsQuality: RenderTier;
    colorblindMode: 'NONE' | 'DEUTERANOPIA' | 'PROTANOPIA' | 'TRITANOPIA';
    ttsEnabled: boolean;
    largeTextEnabled: boolean;
  };
  setVolume: (bus: AudioBus, value: number) => void;
  setGraphicsQuality: (quality: RenderTier) => void;

  // UI & Prompts
  setPrompt: (text: string | null) => void;
  setFlag: (key: string, enabled: boolean) => void;
  hasFlag: (key: string) => boolean;
  clearFlag: (key: string) => void;

  // NPC Management
  addNPC: (npc: Partial<NPCData> & { id: number, type: NPCType, position: [number, number, number] }) => void;
  spawnWave: (count: number, type: NPCType, faction: any, centerPos?: [number, number, number]) => void;
  triggerScenario: (scenario: 'DEMONSTRATION' | 'POLICE_UNIT' | 'CLASH') => void;
  updateNpc: (id: number, data: Partial<NPCData>) => void;
  batchUpdateNpcs: (updates: Map<number, Partial<NPCData>>) => void;
  markNpc: (id: number) => void;

  // Settings Visibility
  openSettings: () => void;
  closeSettings: () => void;

  // Survival / Save (V7.0)
  saveGame: () => void;
  loadGame: () => boolean;

  // Gameplay Actions (Phase 09)
  arrestNpc: (npcId: number) => void;
  adjustKarma: (amount: number) => void;

  // Cutscenes
  startCutscene: (id: CutsceneId) => void;
  endCutscene: () => void;
  setCutsceneTime: (time: number) => void;

  // Achievements
  unlockAchievement: (id: AchievementId) => void;
  hasAchievement: (id: AchievementId) => boolean;
}
