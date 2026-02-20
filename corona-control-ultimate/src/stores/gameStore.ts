import { create } from 'zustand';
import type { GameStore } from './types';
import { createSettingsSlice } from './slices/settingsSlice';
import { createInventorySlice } from './slices/inventorySlice';
import { createPlayerSlice } from './slices/playerSlice';
import { createGameSlice } from './slices/gameSlice';

// Re-export types for convenience
export * from './types';

export const useGameStore = create<GameStore>((...a) => ({
  ...createSettingsSlice(...a),
  ...createInventorySlice(...a),
  ...createPlayerSlice(...a),
  ...createGameSlice(...a),
}));

// Debug Access
(window as any).gameStore = useGameStore;
(window as any).getState = () => useGameStore.getState();
