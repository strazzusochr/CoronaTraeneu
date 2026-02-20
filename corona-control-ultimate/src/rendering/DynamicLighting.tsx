/**
 * Corona Control Ultimate - Dynamic Lighting System
 * Gemäß V6.0 Spezifikation: 24-Stunden Beleuchtungszyklus
 * 
 * Implementiert:
 * - Sonnenaufgangs-Transition (Anhang C)
 * - Tageszeit-basierte Beleuchtung
 * - Laternen-Steuerung
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';
import TimeSystem from '@/core/TimeSystem';
import { useTimeEngine } from '@/core/TimeEngine';


interface DynamicLightingProps {
    quality: 'LOW' | 'MEDIUM' | 'HIGH';
    castShadows?: boolean;
}

/**
 * Berechnet Sonnenposition basierend auf Spielzeit
 */
/**
 * Berechnet Sonnenposition basierend auf Spielzeit
 * V6.0 Table C Alignment: 06:00:00 (T=0) -> T=5.0s
 */
function calculateSunPosition(gameMinutes: number): [number, number, number] {
    const hour = gameMinutes / 60;

    // SUNRISE TABLE C OVERRIDE (06:00:00 - 06:00:05)
    if (gameMinutes >= 360 && gameMinutes <= 360.0833) { // 360.0833 min = 5 game seconds
        const t = (gameMinutes - 360) * 60; // seconds 0-5
        const elevationTable = [-18, -12, -6, -3, 0, 3];
        const idx = Math.floor(t);
        const frac = t % 1;
        const elevation = THREE.MathUtils.lerp(elevationTable[idx], elevationTable[idx + 1] || 3, frac);

        const azimuth = Math.PI / 2; // East
        const dist = 100;
        const elRad = THREE.MathUtils.degToRad(elevation);
        return [
            Math.cos(azimuth) * Math.cos(elRad) * dist,
            Math.sin(elRad) * dist,
            Math.sin(azimuth) * Math.cos(elRad) * dist
        ];
    }

    // Normal calculation... (simplified fallback)
    const azimuth = ((hour - 6) / 24) * Math.PI * 2;
    let elevation: number;
    if (hour >= 6 && hour <= 18) {
        elevation = Math.sin(((hour - 6) / 12) * Math.PI) * 70;
    } else {
        elevation = -30;
    }

    const dist = 100;
    const elRad = THREE.MathUtils.degToRad(elevation);
    return [
        Math.cos(azimuth) * Math.cos(elRad) * dist,
        Math.sin(elRad) * dist,
        Math.sin(azimuth) * Math.cos(elRad) * dist
    ];
}

/**
 * Berechnet Lichtintensität basierend auf Tageszeit
 * V6.0 Table C Alignment
 */
function calculateLightIntensity(gameMinutes: number): {
    directional: number;
    ambient: number;
    starsOpacity: number;
    streetLights: boolean;
    flicker: boolean;
} {
    const hour = gameMinutes / 60;
    let flicker = false;

    // SUNRISE TABLE C OVERRIDE
    if (gameMinutes >= 360 && gameMinutes <= 360.0833) {
        const t = (gameMinutes - 360) * 60;
        const luxTable = [0, 50, 500, 2000, 5000, 15000];
        const idx = Math.floor(t);
        const frac = t % 1;
        const lux = THREE.MathUtils.lerp(luxTable[idx], luxTable[idx + 1] || 15000, frac);

        const directional = (lux / 10000); // 1.5 intensity at 15k lux approx
        const ambient = 0.05 + (lux / 30000);
        const streetLights = t < 5;
        flicker = t >= 3 && t < 4;

        return { directional, ambient, starsOpacity: Math.max(0, 1 - t / 2), streetLights, flicker };
    }

    const res = {
        directional: hour >= 6 && hour <= 18 ? 0.5 + Math.sin(((hour - 6) / 12) * Math.PI) * 1.5 : 0.15,
        ambient: hour >= 6 && hour <= 18 ? 0.4 + Math.sin(((hour - 6) / 12) * Math.PI) * 0.4 : 0.2, // Higher minimum ambient
        starsOpacity: hour >= 20 || hour < 5 ? 1 : 0,
        streetLights: hour >= 18 || hour < 6, // Turn on at 18:00
        flicker: false
    };

    return res;
}

/**
 * Berechnet Himmelfarben basierend auf Tageszeit
 */
function calculateSkyColors(gameMinutes: number): {
    turbidity: number;
    rayleigh: number;
    sunColor: THREE.Color;
} {
    if (gameMinutes >= 360 && gameMinutes <= 360.0833) {
        const t = (gameMinutes - 360) * 60;
        // Fog/turbidity interpolation
        // Table C: T=0:0.008, T=2:0.007, T=3:0.006, T=4:0.005, T=5:0.004
        const fogTable = [0.008, 0.008, 0.007, 0.006, 0.005, 0.004];
        const idx = Math.floor(t);
        const frac = t % 1;
        const fog = THREE.MathUtils.lerp(fogTable[idx], fogTable[idx + 1] || 0.004, frac);

        return {
            turbidity: 20 * (fog / 0.008),
            rayleigh: 1.0 - (fog / 0.008) + 0.1,
            sunColor: new THREE.Color(0xFFAA44).lerp(new THREE.Color(0xFFFFF0), t / 5)
        };
    }

    const gameTimeSeconds = useTimeEngine.getState().gameTimeSeconds;
    const hour = gameTimeSeconds / 3600;

    // Simplistic phase logic for sky colors
    let phase: 'MORNING' | 'MIDDAY' | 'EVENING' | 'NIGHT' = 'NIGHT';
    if (hour >= 6 && hour < 12) phase = 'MORNING';
    else if (hour >= 12 && hour < 18) phase = 'MIDDAY';
    else if (hour >= 18 && hour < 22) phase = 'EVENING';
    switch (phase) {
        case 'MORNING': return { turbidity: 6, rayleigh: 1.0, sunColor: new THREE.Color(0xFFAA44) };
        case 'MIDDAY': return { turbidity: 8, rayleigh: 0.5, sunColor: new THREE.Color(0xFFFFF0) };
        case 'EVENING': return { turbidity: 10, rayleigh: 2.0, sunColor: new THREE.Color(0xFF6633) };
        case 'NIGHT':
        default: return { turbidity: 20, rayleigh: 0.1, sunColor: new THREE.Color(0x4466AA) };
    }
}

/**
 * Dynamisches Beleuchtungs-System Komponente
 */
const DynamicLighting: React.FC<DynamicLightingProps> = ({ quality, castShadows = false }) => {
    const directionalLightRef = useRef<THREE.DirectionalLight>(null);

    const gameTimeSeconds = useTimeEngine(state => state.gameTimeSeconds);
    const gameMinutes = gameTimeSeconds / 60;
    
    // Memoize calculations to prevent heavy work on every render
    const sunPosition = useMemo(() => calculateSunPosition(gameMinutes), [gameMinutes]);
    const intensity = useMemo(() => calculateLightIntensity(gameMinutes), [gameMinutes]);
    const skyColors = useMemo(() => calculateSkyColors(gameMinutes), [gameMinutes]);

    useFrame(() => {
        if (directionalLightRef.current) {
            directionalLightRef.current.position.set(...sunPosition);
            directionalLightRef.current.intensity = intensity.directional;
            directionalLightRef.current.color.copy(skyColors.sunColor);
        }
    });

    return (
        <group name="DynamicLighting_System">
            <hemisphereLight args={[0xB4D4FF, 0x504030, intensity.ambient]} />

            <directionalLight
                ref={directionalLightRef}
                position={sunPosition}
                intensity={intensity.directional}
                castShadow={castShadows && quality === 'HIGH'}
                shadow-mapSize={[1024, 1024]}
            />

            <ambientLight intensity={intensity.ambient * 0.5} color={0xFFFFFF} />

            <Sky 
                distance={450000} 
                sunPosition={sunPosition}
                turbidity={skyColors.turbidity}
                rayleigh={skyColors.rayleigh}
            />
            
            {intensity.starsOpacity > 0.1 && (
                <Stars
                    radius={300}
                    depth={60}
                    count={2000}
                    factor={4}
                    saturation={0.5}
                />
            )}
        </group>
    );
};

export const DynamicSky: React.FC = () => null;

export default DynamicLighting;
