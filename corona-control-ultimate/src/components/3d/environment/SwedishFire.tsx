import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PointLight, Group } from 'three';
import { useGameStore } from '@/stores/gameStore';

interface SwedishFireProps {
    position: [number, number, number];
    scale?: number;
}

/**
 * Schwedenfeuer mit realistischer Feuerbeleuchtung
 * - Brennt von Abenddämmerung (~18:30) bis Morgengrauen (~6:30)
 * - Sanfter Übergang bei Dämmerung (nicht hartes An/Aus)
 * - Starkes, warmes Licht das den Park wie echtes Feuer erhellt
 * - Flackernde, lebendige Flammen mit mehreren Farb-Layern
 */
export const SwedishFire: React.FC<SwedishFireProps> = ({ position, scale = 1 }) => {
    const mainLightRef = useRef<PointLight>(null);
    const ambientLightRef = useRef<PointLight>(null);
    const fireMeshRef = useRef<Group>(null);
    const emberMeshRef = useRef<Group>(null);
    
    const dayTime = useGameStore((state) => state.gameState.dayTime);
    
    // Stunden berechnen (dayTime ist in Minuten)
    const hours = dayTime / 60;
    
    // Dämmerungsübergang: sanft von 0 bis 1
    // Abends: 18:00 → 0%, 18:30 → 50%, 19:00 → 100%
    // Morgens: 6:00 → 100%, 6:30 → 50%, 7:00 → 0%
    const fireIntensity = useMemo(() => {
        if (hours >= 19 || hours < 6) return 1.0;        // Volle Nacht
        if (hours >= 18 && hours < 19) return (hours - 18); // Abenddämmerung 0→1
        if (hours >= 6 && hours < 7) return (7 - hours);    // Morgendämmerung 1→0
        return 0; // Tag = aus
    }, [hours]);
    
    // Holzstämme (typisches Schwedenfeuer: ein dicker Stamm, aufgeschlitzt)
    const logs = useMemo(() => [
        { pos: [0, 0.35, 0] as [number, number, number], height: 0.7, radius: 0.18 },
        { pos: [0.08, 0.3, 0.06] as [number, number, number], height: 0.6, radius: 0.12 },
        { pos: [-0.06, 0.4, 0.08] as [number, number, number], height: 0.8, radius: 0.10 },
        { pos: [0.04, 0.25, -0.07] as [number, number, number], height: 0.5, radius: 0.09 },
    ], []);

    useFrame((state) => {
        const time = state.clock.elapsedTime;
        // Einzigartiger Offset basierend auf Position für asynchrones Flackern
        const offset = position[0] * 3.7 + position[2] * 2.3;
        
        if (fireIntensity <= 0) {
            // Tag: alles aus
            if (mainLightRef.current) mainLightRef.current.intensity = 0;
            if (ambientLightRef.current) ambientLightRef.current.intensity = 0;
            return;
        }
        
        // === HAUPTLICHT: Starkes, warmes Feuerlicht ===
        if (mainLightRef.current) {
            // Mehrschichtiges Flackern für realistisches Feuer
            const slowFlicker = Math.sin((time + offset) * 3) * 0.15;       // Langsames Grundflackern
            const medFlicker = Math.sin((time + offset) * 8) * 0.1;         // Mittleres Flackern
            const fastFlicker = Math.sin((time + offset) * 18) * 0.05;      // Schnelles Zittern
            const randomPulse = Math.sin((time + offset) * 13.7) * Math.sin((time + offset) * 7.3) * 0.08; // Pseudo-Random
            
            // Basis 4.0 + Flackern = sehr starkes warmes Licht
            const totalFlicker = slowFlicker + medFlicker + fastFlicker + randomPulse;
            mainLightRef.current.intensity = (4.0 + totalFlicker) * fireIntensity;
            
            // Farbtemperatur leicht variieren (orange ↔ goldgelb)
            const colorShift = Math.sin((time + offset) * 5) * 0.03;
            mainLightRef.current.color.setRGB(1.0, 0.45 + colorShift, 0.1);
        }
        
        // === AMBIENT-LICHT: Weicheres, weitreichendes Glühen ===
        if (ambientLightRef.current) {
            const glowPulse = Math.sin((time + offset) * 2) * 0.2;
            ambientLightRef.current.intensity = (1.5 + glowPulse) * fireIntensity;
        }

        // === FLAMMEN-ANIMATION ===
        if (fireMeshRef.current) {
            // Lebendige, asymmetrische Flammenbewegung
            fireMeshRef.current.scale.y = 1 + Math.sin((time + offset) * 12) * 0.25 + Math.sin((time + offset) * 20) * 0.1;
            fireMeshRef.current.scale.x = 1 + Math.sin((time + offset) * 9) * 0.15;
            fireMeshRef.current.scale.z = 1 + Math.cos((time + offset) * 11) * 0.12;
            // Leichte Neigung im Wind
            fireMeshRef.current.rotation.x = Math.sin((time + offset) * 1.5) * 0.08;
            fireMeshRef.current.rotation.z = Math.cos((time + offset) * 1.2) * 0.06;
        }
        
        // === GLUT-ANIMATION (Embers) ===
        if (emberMeshRef.current) {
            emberMeshRef.current.scale.y = 0.8 + Math.sin((time + offset) * 6) * 0.15;
            const emberOpacity = 0.5 + Math.sin((time + offset) * 4) * 0.2;
            emberMeshRef.current.children.forEach(child => {
                if ((child as any).material) {
                    (child as any).material.opacity = emberOpacity * fireIntensity;
                }
            });
        }
    });

    return (
        <group position={position} scale={scale}>
            {/* Holzstämme - angekohlt, dunkelbraun */}
            <group>
                {logs.map((log, i) => (
                    <mesh key={i} position={log.pos} rotation={[0.05 * i, i * 0.8, 0.03 * i]} castShadow>
                        <cylinderGeometry args={[log.radius * 0.9, log.radius, log.height, 8]} />
                        <meshStandardMaterial 
                            color={fireIntensity > 0 ? '#1a0a00' : '#3d2817'} 
                            roughness={0.95} 
                            emissive={fireIntensity > 0 ? '#330a00' : '#000000'}
                            emissiveIntensity={fireIntensity * 0.3}
                        />
                    </mesh>
                ))}
                {/* Basis-Plattform (Steinring) */}
                <mesh position={[0, 0.02, 0]} receiveShadow>
                    <cylinderGeometry args={[0.35, 0.4, 0.04, 12]} />
                    <meshStandardMaterial color="#555555" roughness={0.9} />
                </mesh>
            </group>

            {/* ========== FEUER UND LICHT (Dämmerung bis Morgen) ========== */}
            {fireIntensity > 0 && (
                <group position={[0, 0.85, 0]}>
                    {/* HAUPTLICHT: Starkes, nahes Feuerlicht */}
                    <pointLight
                        ref={mainLightRef}
                        color="#ff7722"
                        distance={25}
                        decay={1.5}
                        intensity={4.0}
                        castShadow={false}
                    />
                    
                    {/* AMBIENT-GLÜHEN: Weitreichendes, weiches Licht */}
                    <pointLight
                        ref={ambientLightRef}
                        color="#ff9944"
                        distance={40}
                        decay={2}
                        intensity={1.5}
                        position={[0, 0.5, 0]}
                        castShadow={false}
                    />
                    
                    {/* FLAMMEN: Mehrere Schichten für Tiefe */}
                    <group ref={fireMeshRef}>
                        {/* Äußere Flamme (groß, orange-rot) */}
                        <mesh position={[0, 0.15, 0]}>
                            <coneGeometry args={[0.22, 0.7, 6]} />
                            <meshBasicMaterial color="#ff4400" transparent opacity={0.75 * fireIntensity} />
                        </mesh>
                        {/* Mittlere Flamme (hell orange) */}
                        <mesh position={[0.03, 0.1, 0.02]}>
                            <coneGeometry args={[0.16, 0.55, 5]} />
                            <meshBasicMaterial color="#ff8800" transparent opacity={0.85 * fireIntensity} />
                        </mesh>
                        {/* Innere Flamme (gelb-weiß, heißester Punkt) */}
                        <mesh position={[-0.02, 0.05, -0.02]}>
                            <coneGeometry args={[0.10, 0.4, 5]} />
                            <meshBasicMaterial color="#ffcc44" transparent opacity={0.9 * fireIntensity} />
                        </mesh>
                        {/* Kern (fast weiß) */}
                        <mesh position={[0, -0.05, 0]}>
                            <coneGeometry args={[0.06, 0.2, 4]} />
                            <meshBasicMaterial color="#ffeeaa" transparent opacity={0.7 * fireIntensity} />
                        </mesh>
                    </group>
                    
                    {/* GLUT am Fuß des Feuers */}
                    <group ref={emberMeshRef} position={[0, -0.3, 0]}>
                        <mesh>
                            <sphereGeometry args={[0.2, 6, 4]} />
                            <meshBasicMaterial color="#ff3300" transparent opacity={0.4 * fireIntensity} />
                        </mesh>
                        <mesh position={[0.1, -0.05, 0.08]}>
                            <sphereGeometry args={[0.12, 5, 3]} />
                            <meshBasicMaterial color="#cc2200" transparent opacity={0.3 * fireIntensity} />
                        </mesh>
                    </group>
                </group>
            )}
        </group>
    );
};
