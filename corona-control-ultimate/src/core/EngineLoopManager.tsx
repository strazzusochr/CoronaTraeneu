import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getFeatureState } from './FeatureFlags';
import { useTimeEngine } from './TimeEngine';

/**
 * V7.0 HYPER AAA MULTI-FREQUENCY ENGINE LOOP
 * 
 * PHYSICS: 120Hz (8.33ms) - Fixed Timestep
 * RENDER: 60Hz (16.66ms) - Variable but target 60
 * AI: 10Hz (100ms) - Throttled
 * EVENTS: 0.2Hz (5000ms) - Long Background Events
 */

const PHYSICS_HZ = 60;
const AI_HZ = 5;
const EVENT_HZ = 0.1;

const PHYSICS_STEP = 1 / PHYSICS_HZ;
const AI_STEP = 1 / AI_HZ;
const EVENT_STEP = 1 / EVENT_HZ;

interface EngineLoopCallbacks {
    onPhysics?: (dt: number) => void;
    onAI?: (dt: number) => void;
    onEvent?: () => void;
}

// Global Registry for non-hook access (Legacy & System support)
export class EngineLoopRegistry {
    public static physics: Array<(dt: number) => void> = [];
    public static ai: Array<(dt: number) => void> = [];
    public static event: Array<() => void> = [];

    public static onPhysicsUpdate(cb: (dt: number) => void) {
        this.physics.push(cb);
        return () => { this.physics = this.physics.filter(c => c !== cb); };
    }

    public static onAIUpdate(cb: (dt: number) => void) {
        this.ai.push(cb);
        return () => { this.ai = this.ai.filter(c => c !== cb); };
    }

    public static onGlobalUpdate(cb: () => void) {
        this.event.push(cb);
        return () => { this.event = this.event.filter(c => c !== cb); };
    }
}

export const EngineLoop = EngineLoopRegistry;

export const useEngineLoop = (callbacks?: EngineLoopCallbacks) => {
    const tick = useTimeEngine(state => state.tick);

    // High-performance accumulators
    const accumulators = useRef({
        physics: 0,
        ai: 0,
        event: 0
    });

    useFrame((_state, delta) => {
        // if (!getFeatureState('ENGINE_LOOP')) return; // Removed restrictive check
        
        // 1. Global Time Engine Update
        tick(delta);

        const acc = accumulators.current;
        acc.physics += delta;
        acc.ai += delta;
        acc.event += delta;

        // 2. Fixed Physics Loop (120Hz)
        let panic = 0;
        while (acc.physics >= PHYSICS_STEP) {
            callbacks?.onPhysics?.(PHYSICS_STEP);
            EngineLoopRegistry.physics.forEach(cb => cb(PHYSICS_STEP));
            acc.physics -= PHYSICS_STEP;
            
            // Panic check to prevent "Spiral of Death"
            if (++panic > 10) {
                acc.physics = 0;
                break;
            }
        }

        // 3. AI Update (10Hz)
        if (acc.ai >= AI_STEP) {
            callbacks?.onAI?.(AI_STEP);
            EngineLoopRegistry.ai.forEach(cb => cb(AI_STEP));
            acc.ai -= AI_STEP;
        }

        // 4. Global Event Update (0.2Hz)
        if (acc.event >= EVENT_STEP) {
            callbacks?.onEvent?.();
            EngineLoopRegistry.event.forEach(cb => cb());
            acc.event -= EVENT_STEP;
        }
    });
};
