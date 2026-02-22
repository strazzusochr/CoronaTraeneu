import React, { Suspense, useEffect } from 'react';
import { HUD } from '@/components/ui/HUD';
import { MiniMap } from '@/components/ui/MiniMap';
import { NotificationSystem } from '@/components/ui/NotificationSystem';
import { MainMenu } from '@/components/ui/MainMenu';
import { GameCanvas } from '@/components/game/GameCanvas';
import { DebugOverlay } from '@/components/debug/DebugOverlay';
import { useGameStore } from '@/stores/gameStore';
import { GraphicsErrorBoundary } from '@/components/utility/GraphicsErrorBoundary';

import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import DialogUI from '@/components/ui/DialogUI';
import Inventory from '@/components/ui/Inventory';
import PauseMenu from '@/components/ui/PauseMenu';
import SettingsMenu from '@/components/ui/SettingsMenu';
import { useTimeEngine } from '@/core/TimeEngine';
import '@/systems/MasterTimeline';

/**
 * V6.0 MASTER APP
 */
export default function App(): React.ReactElement {
  const menuState = useGameStore(state => state.gameState.menuState);
  const startGame = useGameStore(state => state.startGame);

  console.log('--- V6 MASTER APP RENDERING ---');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const state = useGameStore.getState().gameState;
        if (state.menuState === 'PLAYING') {
          useGameStore.setState(s => ({
            gameState: {
              ...s.gameState,
              menuState: 'PAUSED',
              isPlaying: false
            }
          }));
        } else if (state.menuState === 'PAUSED') {
          useGameStore.setState(s => ({
            gameState: {
              ...s.gameState,
              menuState: 'PLAYING',
              isPlaying: true
            }
          }));
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const paused = menuState !== 'PLAYING';
    useTimeEngine.getState().setPaused(paused);
  }, [menuState]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      <GraphicsErrorBoundary>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}>
          <GameCanvas />
        </div>

        {menuState === 'MAIN' && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 }}>
            <MainMenu onStart={() => startGame()} />
          </div>
        )}

        {menuState !== 'MAIN' && (
          <Suspense fallback={<LoadingOverlay message="Initialisiere Wien (Build 55)..." />}>
            <HUD />
            <MiniMap />
            <NotificationSystem />
            <DialogUI />
            <Inventory />
          </Suspense>
        )}

        {menuState === 'PAUSED' && <PauseMenu />}
        {menuState === 'SETTINGS' && <SettingsMenu />}

        {/* Mandatory Debug Layer (GSCP Spec) */}
        <DebugOverlay />
      </GraphicsErrorBoundary>
    </div>
  );
}
