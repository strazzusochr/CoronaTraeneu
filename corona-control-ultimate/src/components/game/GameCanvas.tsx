import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
// import { WebGPURenderer } from 'three/webgpu';
import { useEngineLoop } from '@/core/EngineLoopManager';
import DynamicLighting from '@/rendering/DynamicLighting';
import { CityEnvironment } from '@/components/3d/environment/CityEnvironment';
import { InteractionDetector } from './InteractionDetector';
import CrowdRenderer from '@/components/CrowdRenderer';
import { PlayerCharacter } from './entities/PlayerCharacter';
import { PerformanceMonitor } from '@/components/ui/PerformanceMonitor';
import { npcAiManager } from '@/managers/NPCAIManager';
import { useGameStore } from '@/stores/gameStore';
import * as THREE from 'three';
import { PostProcessing } from '@/components/Effects/PostProcessing';
import { Physics } from '@react-three/rapier';

import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

/**
 * V7.0 HYPER AAA MASTER GAME CANVAS
 */

const CameraController = () => {
    const controlsRef = useRef<any>(null);
    const playerPos = useGameStore(state => state.player.position);
    const isPlaying = useGameStore(state => state.gameState.isPlaying);
    const shiftDown = React.useRef(false);

    useFrame(() => {
        if (controlsRef.current && isPlaying) {
            const target = new THREE.Vector3(...playerPos);
            controlsRef.current.target.lerp(target, 0.1);
            controlsRef.current.update();
        }
    });

    React.useEffect(() => {
        const onDown = (e: KeyboardEvent) => {
            if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !shiftDown.current) {
                shiftDown.current = true;
                if (controlsRef.current) {
                    controlsRef.current.mouseButtons.LEFT = THREE.MOUSE.PAN;
                }
            }
        };
        const onUp = (e: KeyboardEvent) => {
            if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && shiftDown.current) {
                shiftDown.current = false;
                if (controlsRef.current) {
                    controlsRef.current.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
                }
            }
        };
        window.addEventListener('keydown', onDown);
        window.addEventListener('keyup', onUp);
        return () => {
            window.removeEventListener('keydown', onDown);
            window.removeEventListener('keyup', onUp);
        };
    }, []);

    return (
        <OrbitControls 
            ref={controlsRef}
            makeDefault 
            enablePan={true}
            panSpeed={1.8}
            screenSpacePanning={true}
            enableRotate={true}
            rotateSpeed={0.9}
            enableZoom={true}
            minDistance={5}
            maxDistance={600}
            zoomSpeed={1.1}
            enableDamping={true}
            dampingFactor={0.08}
            minPolarAngle={0.01}
            maxPolarAngle={Math.PI - 0.01}
            mouseButtons={{
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
            }}
        />
    );
};

const SceneContent = () => {
    const isPlaying = useGameStore(state => state.gameState.isPlaying);

    // V7.0 Engine Loop Hook
    useEngineLoop({
        onPhysics: () => {
            // physics system update here
        },
        onAI: () => {
            // NPC AI Logic Heartbeat (10Hz)
            try {
                if (isPlaying) npcAiManager.update();
            } catch (e) {
                console.error('[EngineLoop] AI Error:', e);
            }
        },
        onEvent: () => {
            if (isPlaying) console.log('[EngineLoop] Event Heartbeat (0.2Hz)');
        }
    });

    return (
        <>
            <DynamicLighting quality="HIGH" castShadows={true} />

            <Physics timeStep="vary">
                <CityEnvironment />
                <Suspense fallback={<LoadingOverlay message="Lade Chunks..." />}>
                    <InteractionDetector />
                    <PlayerCharacter />
                    <CrowdRenderer />
                </Suspense>
            </Physics>

            <PerformanceMonitor position="top-right" />

            <PostProcessing />

            <CameraController />
        </>
    );
};

export const GameCanvas = () => {
    const [error, setError] = React.useState<string | null>(null);
    const [webglSupported, setWebglSupported] = React.useState<boolean | null>(null);

    // Initial check for WebGL
    React.useEffect(() => {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            if (!gl) {
                setWebglSupported(false);
                setError("WebGL wird von deinem Browser oder deiner Hardware nicht unterstützt.");
            } else {
                setWebglSupported(true);
            }
        } catch (e) {
            setWebglSupported(false);
            setError("Fehler bei der WebGL-Initialisierung.");
        }
    }, []);

    // Automatischer Reset bei schwerwiegenden Fehlern
    const handleRetry = () => {
        window.location.reload();
    };

    if (error || webglSupported === false) {
        return (
            <div style={{
                width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', color: 'white', background: '#050505',
                fontFamily: 'Outfit, sans-serif', padding: '20px', textAlign: 'center',
                position: 'fixed', top: 0, left: 0, zIndex: 9999
            }}>
                <div style={{ padding: '40px', border: '1px solid #ff3c3c', background: 'rgba(255,0,0,0.05)', borderRadius: '8px' }}>
                    <h2 style={{ color: '#ff3c3c', letterSpacing: '4px' }}>GRAFIK-FEHLER ERKANNT</h2>
                    <p style={{ opacity: 0.7, maxWidth: '400px', margin: '20px 0' }}>{error || 'Unbekannter Grafikfehler'}</p>
                    <button 
                        onClick={handleRetry}
                        style={{
                            marginTop: '20px', padding: '12px 30px', background: '#ff3c3c', 
                            color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
                            fontWeight: 'bold', letterSpacing: '2px'
                        }}
                    >
                        SYSTEM NEU STARTEN
                    </button>
                </div>
            </div>
        );
    }

    return (
        <Canvas
            shadows
            camera={{ position: [20, 20, 20], fov: 45 }}
            style={{ background: '#050505' }}
            gl={{
                powerPreference: 'high-performance',
                antialias: true,
                preserveDrawingBuffer: false,
                alpha: false,
                stencil: false,
                depth: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                outputColorSpace: THREE.SRGBColorSpace
            }}
            onCreated={({ gl, scene }) => {
                const renderer = gl as any;
                const canvas = renderer.domElement;

                // 1. Context Loss Handling
                canvas.addEventListener('webglcontextlost', (e: any) => {
                    e.preventDefault();
                    console.error('[GameCanvas] WebGL Context Lost');
                    setError("Grafik-Kontext verloren (VRAM Überlastung).");
                }, false);

                // 2. Scene Cleanup
                return () => {
                    console.log('[Build 55] Cleaning up scene...');
                    scene.traverse((obj) => {
                        if (obj instanceof THREE.Mesh) {
                            obj.geometry.dispose();
                            if (obj.material instanceof THREE.Material) {
                                obj.material.dispose();
                            }
                        }
                    });
                };
            }}
        >
            <Suspense fallback={<Html fullscreen><LoadingOverlay message="Initialisiere Wien..." /></Html>}>
                <SceneContent />
            </Suspense>
        </Canvas>
    );
};
