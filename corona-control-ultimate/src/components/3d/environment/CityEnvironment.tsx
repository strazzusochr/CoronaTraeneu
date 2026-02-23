import React, { Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useGameStore } from '@/stores/gameStore';
// Removed StephansplatzGround for Rome update
import { Fountain } from './Fountain';
import Building from './Building';
// import Sidewalk from './Sidewalk';
import InstancedProps from './InstancedProps';
import Vegetation from './Vegetation';
import StreetLight from './StreetLights';
import Interactables from './Interactables';
import Destructibles from './Destructibles';
import GroundDecals from './GroundDecals';
import TrafficSystem from './TrafficSystem';
// import { CityLighting } from './CityLighting';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { PoliceCar } from '@/components/game/entities/PoliceCar';
import { WaterCannon } from '@/components/game/entities/WaterCannon';
import { Ambulance } from '@/components/game/entities/Ambulance';
import ParticleSystem from '@/components/Effects/ParticleSystem';
import AudioManager, { AudioLayer } from '@/managers/AudioManager';
import { ConcertStage } from './ConcertStage';
import { SwedishFire } from './SwedishFire';
import { FlowerBed } from './FlowerBed';
import { WorldItem } from '@/components/WorldItem';
import { WeatherSystem } from '@/rendering/WeatherSystem';


type LevelVehicleType = 'POLICE_CAR' | 'WATER_CANNON' | 'AMBULANCE';

interface LevelVehicleSpawn {
    id: string;
    type: LevelVehicleType;
    position: [number, number, number];
    rotation: [number, number, number];
    isSirenActive: boolean;
}

const LEVEL1_VEHICLES: LevelVehicleSpawn[] = [
    {
        id: 'veh_police_conciliazione',
        type: 'POLICE_CAR',
        position: [120, 0.6, 20],
        rotation: [0, Math.PI / 2, 0],
        isSirenActive: true
    },
    {
        id: 'veh_watercannon_conciliazione',
        type: 'WATER_CANNON',
        position: [100, 0.6, -20],
        rotation: [0, -Math.PI / 2, 0],
        isSirenActive: false
    }
];

const LEVEL1_PROP_INSTANCES: Array<{ id: string; position: [number, number, number]; type: 'trash_can' | 'bench' | 'news_stand' | 'bollard' }> = [
    ...[...Array(12)].map((_, i) => ({ id: `prop_trash_${i}`, position: [12, 0.4, -60 + i * 10] as [number, number, number], type: 'trash_can' as const })),
    ...[...Array(12)].map((_, i) => ({ id: `prop_trash_2_${i}`, position: [-12, 0.4, -60 + i * 10] as [number, number, number], type: 'trash_can' as const })),
    ...[...Array(8)].map((_, i) => ({ id: `prop_bench_${i}`, position: [8, 0.25, -40 + i * 12] as [number, number, number], type: 'bench' as const })),
    ...[...Array(8)].map((_, i) => ({ id: `prop_bench_2_${i}`, position: [-8, 0.25, -40 + i * 12] as [number, number, number], type: 'bench' as const })),
    { id: 'prop_news_stand_east', position: [20, 0.4, 10], type: 'news_stand' as const },
    { id: 'prop_news_stand_west', position: [-20, 0.4, -10], type: 'news_stand' as const }
];

const LEVEL1_VEGETATION: Array<{ id: string; position: [number, number, number]; type: 'tree' | 'bush' }> = [
    // Alleebäume entlang Via della Conciliazione (Nordseite)
    ...[...Array(15)].map((_, i) => ({ id: `via_tree_north_${i}`, position: [80 + i * 15, 0, -18] as [number, number, number], type: 'tree' as const })),
    // Alleebäume entlang Via della Conciliazione (Südseite)
    ...[...Array(15)].map((_, i) => ({ id: `via_tree_south_${i}`, position: [80 + i * 15, 0, 18] as [number, number, number], type: 'tree' as const }))
];

const LEVEL1_STREET_LIGHTS: Array<{ id: string; position: [number, number, number]; rotation?: [number, number, number] }> = [
    ...[...Array(12)].map((_, i) => ({ id: `light_east_${i}`, position: [10, 3, -100 + i * 15] as [number, number, number] })),
    ...[...Array(12)].map((_, i) => ({ id: `light_west_${i}`, position: [-10, 3, -100 + i * 15] as [number, number, number], rotation: [0, Math.PI, 0] as [number, number, number] }))
];

const LEVEL1_INTERACTABLES: Array<{ id: string; position: [number, number, number]; type: 'terminal' | 'atm' }> = [
    { id: 'int_terminal_stage', position: [5.5, 1.1, -5], type: 'terminal' as const },
    { id: 'int_atm_west', position: [-5.5, 0.9, 0], type: 'atm' as const }
];

const LEVEL1_DESTRUCTIBLES: Array<{ id: string; position: [number, number, number]; type: 'crate' | 'window'; rotation?: [number, number, number] }> = [
    { id: 'dest_crate_center', position: [0, 0.5, 15], type: 'crate' as const },
    { id: 'dest_window_east', position: [10, 2, -10], type: 'window' as const, rotation: [0, -Math.PI / 2, 0] }
];

const LEVEL1_GROUND_DECALS: Array<{ id: string; position: [number, number, number]; type: 'graffiti' | 'crack' }> = [
    { id: 'decal_graffiti_center', position: [0, 0.03, 5], type: 'graffiti' as const },
    { id: 'decal_crack_south', position: [2, 0.03, -5], type: 'crack' as const }
];

// ========================================================
// SCHWEDENFEUER IM PARK: Strategisch platziert für maximale
// Ausleuchtung. Ring-Formation + Zentrale Feuer.
// Brennen von Abenddämmerung bis Morgengrauen.
// ========================================================
const PARK_FIRES: Array<{ id: string; position: [number, number, number] }> = [
    // === ÄUSSERER RING (8 Feuer) - erhellt den gesamten Parkrand ===
    { id: 'fire_ring_n',  position: [-30, 0.02, 40] },   // Nord
    { id: 'fire_ring_ne', position: [-15, 0.02, 38] },   // Nordost
    { id: 'fire_ring_e',  position: [-10, 0.02, 25] },   // Ost
    { id: 'fire_ring_se', position: [-15, 0.02, 12] },   // Südost
    { id: 'fire_ring_s',  position: [-30, 0.02, 8] },    // Süd
    { id: 'fire_ring_sw', position: [-45, 0.02, 12] },   // Südwest
    { id: 'fire_ring_w',  position: [-50, 0.02, 25] },   // West
    { id: 'fire_ring_nw', position: [-45, 0.02, 38] },   // Nordwest
    
    // === INNERER KREIS (4 Feuer) - erhellt die Parkwege/Sitzbänke ===
    { id: 'fire_inner_1', position: [-25, 0.02, 30] },   // Innerer Nord
    { id: 'fire_inner_2', position: [-20, 0.02, 18] },   // Innerer Ost
    { id: 'fire_inner_3', position: [-35, 0.02, 18] },   // Innerer West
    { id: 'fire_inner_4', position: [-30, 0.02, 28] },   // Zentrum
];

// ======================================================
// ROM STADTRASTER — Konstanten
// ======================================================
const BLOCK_W = 40;   // Breite eines Häuserblocks
const BLOCK_D = 40;   // Tiefe eines Häuserblocks
const STREET_W = 8;   // Straßenbreite (enge Gassen)
const CELL = BLOCK_W + STREET_W; // = 48 Einheiten pro Zelle
const GRID = 9;       // 9x9 Raster = kompakte, dichte Stadt
const HALF = Math.floor(GRID / 2); // 4
const PIAZZA_R = 0;   // Nur 1 zentraler Block frei (48x48 Einheiten)

// Römische Erdtöne für Palazzi
const ROME_COLORS = [
    '#d49a6a', '#e8cfa6', '#bba793', '#c6b199', '#e3d0b8',
    '#d4a574', '#c9956b', '#ddc8a9', '#b89f83', '#cbb896'
];

const MissionTrigger = ({ position, radius, missionIndex, label }: { position: [number, number, number], radius: number, missionIndex: number, label: string }) => {
    const playerPos = useGameStore(state => state.player.position);
    const currentMissionIndex = useGameStore(state => state.gameState.currentMissionIndex);
    const updateMissionProgress = useGameStore(state => state.updateMissionProgress);
    const nextMission = useGameStore(state => state.nextMission);
    const [triggered, setTriggered] = React.useState(false);

    useFrame(() => {
        if (currentMissionIndex === missionIndex && !triggered) {
            const dist = Math.sqrt(
                Math.pow(playerPos[0] - position[0], 2) +
                Math.pow(playerPos[2] - position[2], 2)
            );
            if (dist < radius) {
                setTriggered(true);
                updateMissionProgress(1);
                nextMission();
                console.log(`Mission ${missionIndex + 1} completed!`);
            }
        }
    });

    if (currentMissionIndex !== missionIndex || triggered) return null;

    return (
        <group position={position}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                <ringGeometry args={[radius - 0.5, radius, 32]} />
                <meshBasicMaterial color="cyan" transparent opacity={0.5} />
            </mesh>
            <Html position={[0, 2, 0]} center>
                <div style={{ color: 'cyan', background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                    {label}
                </div>
            </Html>
        </group>
    );
};

export const CityEnvironment: React.FC = () => {
    React.useEffect(() => {
        const cityAmbient = AudioManager.playSound('city_ambient', AudioLayer.AMBIENT, { loop: true });
        const concertMusic = AudioManager.playSound('kill_the_bill_live', AudioLayer.MUSIC, { 
            loop: true, 
            volume: 0.8,
            pos: [0, 5, -50]
        });
        
        return () => {
            if (cityAmbient) cityAmbient.pause();
            if (concertMusic) concertMusic.pause();
        };
    }, []);

    const worldItems = useGameStore(state => state.worldItems);

    // Straßen-Elemente: Raster + Diagonalen + S-Kurve
    const streetElements = React.useMemo(() => {
        const seedRand = (s: number) => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
        const streets: React.ReactElement[] = [];
        const totalLen = GRID * CELL + STREET_W * 2;

        // Horizontale Straßen (laufen entlang X, bei jeder Z-Block-Grenze)
        for (let i = 0; i <= GRID; i++) {
            const sz = -HALF * CELL - BLOCK_D / 2 + i * CELL;
            const hOffset = (seedRand(i * 137 + 7) - 0.5) * 4;
            
            // Wenn Straße durch die vergrößerte Wiese verläuft (Z zwischen -70 und +75)
            if (sz > -70 && sz < 75) {
                // Cut the street to make room for the 136x136 park (X from -64 to +72)
                const leftSideLen = (totalLen / 2) - 64; // Distance from left edge to park edge (-64)
                streets.push(
                    <mesh key={`sh_${i}_l`} rotation={[-Math.PI / 2, 0, seedRand(i * 53) * 0.03]} position={[hOffset - 64 - leftSideLen / 2, 0.02, sz]} receiveShadow>
                        <planeGeometry args={[leftSideLen, STREET_W]} />
                        <meshStandardMaterial color="#4a4a4a" roughness={0.85} />
                    </mesh>
                );
                const rightSideLen = (totalLen / 2) - 72; // Distance from park edge (+72) to right edge
                streets.push(
                    <mesh key={`sh_${i}_r`} rotation={[-Math.PI / 2, 0, seedRand(i * 53) * 0.03]} position={[hOffset + 72 + rightSideLen / 2, 0.02, sz]} receiveShadow>
                        <planeGeometry args={[rightSideLen, STREET_W]} />
                        <meshStandardMaterial color="#4a4a4a" roughness={0.85} />
                    </mesh>
                );
            } else {
                streets.push(
                    <mesh key={`sh_${i}`} rotation={[-Math.PI / 2, 0, seedRand(i * 53) * 0.03]} position={[hOffset, 0.02, sz]} receiveShadow>
                        <planeGeometry args={[totalLen, STREET_W]} />
                        <meshStandardMaterial color="#4a4a4a" roughness={0.85} />
                    </mesh>
                );
            }
        }
        
        // Vertikale Straßen (laufen entlang Z, bei jeder X-Block-Grenze)
        for (let i = 0; i <= GRID; i++) {
            const sx = -HALF * CELL - BLOCK_W / 2 + i * CELL;
            const vOffset = (seedRand(i * 211 + 3) - 0.5) * 4;
            
            // Wenn Straße durch die vergrößerte Wiese verläuft (X zwischen -70 und +75)
            if (sx > -70 && sx < 75) {
                // Cut the street for the park (Z from -64 to +72)
                const topSideLen = (totalLen / 2) - 64; // Negative Z part ending at -64
                const bottomSideLen = (totalLen / 2) - 72; // Positive Z part starting at +72
                streets.push(
                    <mesh key={`sv_${i}_t`} rotation={[-Math.PI / 2, 0, seedRand(i * 79) * 0.03]} position={[sx, 0.02, vOffset - 64 - topSideLen / 2]} receiveShadow>
                        <planeGeometry args={[STREET_W, topSideLen]} />
                        <meshStandardMaterial color="#4a4a4a" roughness={0.85} />
                    </mesh>
                );
                streets.push(
                    <mesh key={`sv_${i}_b`} rotation={[-Math.PI / 2, 0, seedRand(i * 79) * 0.03]} position={[sx, 0.02, vOffset + 72 + bottomSideLen / 2]} receiveShadow>
                        <planeGeometry args={[STREET_W, bottomSideLen]} />
                        <meshStandardMaterial color="#4a4a4a" roughness={0.85} />
                    </mesh>
                );
            } else {
                streets.push(
                    <mesh key={`sv_${i}`} rotation={[-Math.PI / 2, 0, seedRand(i * 79) * 0.03]} position={[sx, 0.02, vOffset]} receiveShadow>
                        <planeGeometry args={[STREET_W, totalLen]} />
                        <meshStandardMaterial color="#4a4a4a" roughness={0.85} />
                    </mesh>
                );
            }
        }

        // DIAGONALSTRASSE 1: Von Südwest nach Nordost (45°) - AUßERHALB des Zentrums
        const diagLen = totalLen * 0.5;
        streets.push(
            <mesh key="diag_45_a" rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[CELL * 2.5, 0.025, CELL * 2.5]} receiveShadow>
                <planeGeometry args={[diagLen, STREET_W * 1.5]} />
                <meshStandardMaterial color="#555555" roughness={0.8} />
            </mesh>
        );
        streets.push(
            <mesh key="diag_45_b" rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[-CELL * 2.5, 0.025, -CELL * 2.5]} receiveShadow>
                <planeGeometry args={[diagLen, STREET_W * 1.5]} />
                <meshStandardMaterial color="#555555" roughness={0.8} />
            </mesh>
        );

        // DIAGONALSTRASSE 2: Schräg (-30°) - AUßERHALB des Zentrums
        streets.push(
            <mesh key="diag_m30" rotation={[-Math.PI / 2, 0, -Math.PI / 6]} position={[CELL * 2, 0.025, -CELL * 2]} receiveShadow>
                <planeGeometry args={[diagLen * 0.8, STREET_W * 1.2]} />
                <meshStandardMaterial color="#505050" roughness={0.8} />
            </mesh>
        );

        // S-KURVE: Nur außerhalb des Parkbereichs (|x|>60)
        const sCurveSegs = 16;
        for (let s = 0; s < sCurveSegs; s++) {
            const t = (s / sCurveSegs) * Math.PI * 2;
            const sx = -CELL * 2.5 + (s / sCurveSegs) * CELL * 5;
            const sz = Math.sin(t) * CELL * 1.2;
            // Segmente im Parkbereich überspringen (Park is from X:-64 to +72, Z:-64 to +72)
            if (sx > -65 && sx < 75 && sz > -65 && sz < 75) continue;
            const angle = Math.atan2(
                Math.sin((t + 0.3)) * CELL * 1.2 - sz,
                (CELL * 5 / sCurveSegs)
            );
            streets.push(
                <mesh key={`scurve_${s}`} rotation={[-Math.PI / 2, 0, -angle]} position={[sx, 0.025, sz]} receiveShadow>
                    <planeGeometry args={[CELL * 5 / sCurveSegs + 4, STREET_W]} />
                    <meshStandardMaterial color="#484848" roughness={0.85} />
                </mesh>
            );
        }

        return streets;
    }, []);

    // Häuserblöcke — ORGANISCH: Random Offset, Rotation, Größe
    const buildingGrid = React.useMemo(() => {
        const buildings: React.ReactElement[] = [];
        const prng = { s: 42 };
        const rand = () => { prng.s = (prng.s * 16807) % 2147483647; return (prng.s - 1) / 2147483646; };

        for (let gx = -HALF; gx <= HALF; gx++) {
            for (let gz = -HALF; gz <= HALF; gz++) {
                // Piazza freihalten
                if (Math.abs(gx) <= PIAZZA_R && Math.abs(gz) <= PIAZZA_R) continue;
                // Via della Conciliazione
                if (gz === 0 && gx > PIAZZA_R) continue;

                const baseX = gx * CELL;
                const baseZ = gz * CELL;

                // Gebäude entfernen die exakt im großen Park-Areal (-64 bis +72) stehen
                if (baseX >= -65 && baseX <= 75 && baseZ >= -65 && baseZ <= 75) continue;

                // S-Kurve: Gebäude entfernen die auf der Kurve liegen
                const sCurveZ = Math.sin((baseX / (CELL * 5) + 0.5) * Math.PI * 2) * CELL * 1.2;
                if (Math.abs(baseZ - sCurveZ) < CELL * 0.35 && baseX > -CELL * 2.8 && baseX < CELL * 2.8) continue;

                // ORGANISCHE PLATZIERUNG
                const offX = (rand() - 0.5) * 12;  // ±6 Einheiten Versatz
                const offZ = (rand() - 0.5) * 12;
                const rotY = (rand() - 0.5) * 0.45; // ±~13° Rotation
                const bW = 18 + rand() * 18;        // Breite 18-36
                const bD = 22 + rand() * 16;        // Tiefe 22-38
                const bH = 14 + rand() * 22;        // Höhe 14-36
                const color = ROME_COLORS[Math.floor(rand() * ROME_COLORS.length)];

                buildings.push(
                    <Building
                        key={`blk_${gx}_${gz}`}
                        position={[baseX + offX, bH / 2, baseZ + offZ]}
                        rotation={[0, rotY, 0]}
                        width={bW}
                        height={bH}
                        depth={bD}
                        color={color}
                    />
                );
            }
        }
        return buildings;
    }, []);

    return (
        <group name="CityEnvironment_V7_0">
            {/* BODEN: Dunkles Kopfsteinpflaster für die ganze Welt */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[1200, 1200]} />
                <meshStandardMaterial color="#2d2b2a" roughness={1.0} />
            </mesh>

            {/* PIAZZA: Hellerer Platz im Zentrum */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
                <planeGeometry args={[CELL, CELL]} />
                <meshStandardMaterial color="#4a4643" roughness={0.85} />
            </mesh>

            {/* HAUPT-WIESE (Rechteck innerhalb der Mauern) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0.015, 4]} receiveShadow>
                <planeGeometry args={[135, 135]} />
                <meshStandardMaterial color="#3a6b2a" roughness={0.95} />
            </mesh>

            {/* Entfernte oversized Grünflächen für echtes Rome-Feeling */}

            {/* Schlichte Park-Bäume */}
            {[[-30, 0, -35], [-20, 0, -5], [25, 0, -30], [35, 0, 10], [-35, 0, 15],
              [-10, 0, -40], [15, 0, -40], [40, 0, -20], [-40, 0, -15]].map((pos, i) => (
                <group key={`park_tree_${i}`} position={pos as [number, number, number]}>
                    {/* Stamm */}
                    <mesh position={[0, 3, 0]} castShadow>
                        <cylinderGeometry args={[0.3, 0.5, 6, 6]} />
                        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
                    </mesh>
                    {/* Krone */}
                    <mesh position={[0, 7, 0]} castShadow>
                        <sphereGeometry args={[3, 8, 6]} />
                        <meshStandardMaterial color="#2d5a1e" roughness={0.85} />
                    </mesh>
                </group>
            ))}

            {/* Schlichte Büsche */}
            {[[-25, 0, -20], [30, 0, -15], [-15, 0, 10], [10, 0, -30], [40, 0, -5]].map((pos, i) => (
                <mesh key={`park_bush_${i}`} position={[pos[0], 1, pos[2]]} castShadow>
                    <sphereGeometry args={[1.5, 6, 5]} />
                    <meshStandardMaterial color="#3a6b2e" roughness={0.9} />
                </mesh>
            ))}

            {/* Weitere Sträucher (flacher, breiter) */}
            {[[-50, 0, 40], [40, 0, 50], [-20, 0, -50], [60, 0, -20], [-55, 0, -30]].map((pos, i) => (
                <mesh key={`shrub_${i}`} position={[pos[0], 0.8, pos[2]]} castShadow>
                    <cylinderGeometry args={[2, 2.5, 1.5, 6]} />
                    <meshStandardMaterial color="#2d5a1e" roughness={0.9} />
                </mesh>
            ))}

            {/* Blumenbeete (5 prachtvolle AAA-Beete) */}
            {[
                { pos: [-40, 0.1, -10], rotZ: 0.2 }, 
                { pos: [50, 0.1, 20], rotZ: -0.5 }, 
                { pos: [-10, 0.1, 50], rotZ: 1.2 }, 
                { pos: [20, 0.1, -40], rotZ: 0 }, 
                { pos: [-30, 0.1, 30], rotZ: -1.0 }
            ].map((bed, i) => (
                <FlowerBed key={`flowerbed_${i}`} position={bed.pos as [number, number, number]} rotation={[0, bed.rotZ, 0]} />
            ))}

            {/* Schwedenfeuer (Tag/Nacht Logik ist intern) */}
            {PARK_FIRES.map((fire) => (
                <SwedishFire key={fire.id} position={fire.position} scale={1.2} />
            ))}

            {/* PARK MAUER (Höhe 2 Einheiten) */}
            <group name="Park_Wall">
                {/* Hinten (Z = -63.5), 3 Stücke à 40m, 2 Lücken à 8m */}
                {[-44, 4, 52].map(x => (
                    <mesh key={`wall_back_${x}`} position={[x, 1, -63.5]} castShadow receiveShadow>
                        <boxGeometry args={[40, 2, 1]} />
                        <meshStandardMaterial color="#88837a" roughness={0.95} />
                    </mesh>
                ))}
                
                {/* Links (X = -63.5) */}
                {[-44, 4, 52].map(z => (
                    <mesh key={`wall_left_${z}`} position={[-63.5, 1, z]} castShadow receiveShadow>
                        <boxGeometry args={[1, 2, 40]} />
                        <meshStandardMaterial color="#88837a" roughness={0.95} />
                    </mesh>
                ))}
                
                {/* Rechts (X = 71.5) */}
                {[-44, 4, 52].map(z => (
                    <mesh key={`wall_right_${z}`} position={[71.5, 1, z]} castShadow receiveShadow>
                        <boxGeometry args={[1, 2, 40]} />
                        <meshStandardMaterial color="#88837a" roughness={0.95} />
                    </mesh>
                ))}

                {/* Vorne (Z = 71.5) - Mit großem Schlosstor in der Mitte (X=4) */}
                <mesh position={[-36, 1, 71.5]} castShadow receiveShadow>
                    <boxGeometry args={[56, 2, 1]} />
                    <meshStandardMaterial color="#88837a" roughness={0.95} />
                </mesh>
                <mesh position={[44, 1, 71.5]} castShadow receiveShadow>
                    <boxGeometry args={[56, 2, 1]} />
                    <meshStandardMaterial color="#88837a" roughness={0.95} />
                </mesh>

                {/* SCHLOSSTOR (Zentrum X=4, Z=71.5) */}
                <group position={[4, 0, 71.5]}>
                    <mesh position={[-12, 3, 0]} castShadow>
                        <cylinderGeometry args={[1.5, 1.5, 6, 16]} />
                        <meshStandardMaterial color="#bba895" roughness={0.8} />
                    </mesh>
                    <mesh position={[12, 3, 0]} castShadow>
                        <cylinderGeometry args={[1.5, 1.5, 6, 16]} />
                        <meshStandardMaterial color="#bba895" roughness={0.8} />
                    </mesh>
                    <mesh position={[0, 6, 0]} castShadow>
                        <torusGeometry args={[12, 1.5, 16, 32, Math.PI]} />
                        <meshStandardMaterial color="#2d2d2d" roughness={0.6} />
                    </mesh>
                    
                    {/* Halboffene Eisengitter-Flügel */}
                    <group position={[-12, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
                        {[2, 4, 6, 8, 10].map(x => (
                            <mesh key={`gate_l_${x}`} position={[x, 3, 0]} castShadow>
                                <cylinderGeometry args={[0.15, 0.15, 5.5, 8]} />
                                <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
                            </mesh>
                        ))}
                        <mesh position={[6, 3, 0]} castShadow>
                            <boxGeometry args={[11, 0.3, 0.3]} />
                            <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
                        </mesh>
                    </group>
                    <group position={[12, 0, 0]} rotation={[0, -Math.PI / 4, 0]}>
                        {[-2, -4, -6, -8, -10].map(x => (
                            <mesh key={`gate_r_${x}`} position={[x, 3, 0]} castShadow>
                                <cylinderGeometry args={[0.15, 0.15, 5.5, 8]} />
                                <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
                            </mesh>
                        ))}
                        <mesh position={[-6, 3, 0]} castShadow>
                            <boxGeometry args={[11, 0.3, 0.3]} />
                            <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
                        </mesh>
                    </group>
                </group>
            </group>

            {/* Sichtbare Straßen zwischen den Blöcken */}
            {streetElements}

            {/* Brunnen an historischen Positionen */}
            <Fountain position={[-30, 0, 0]} />
            <Fountain position={[30, 0, 0]} />
            
            <group name="Square_Decoration">
                {/* Benches around the fountain */}
                {[...Array(4)].map((_, i) => (
                    <InstancedProps 
                        key={`square_bench_${i}`}
                        instances={[{ 
                            position: [Math.cos(i * Math.PI/2) * 6, 0.25, Math.sin(i * Math.PI/2) * 6] as [number, number, number], 
                            rotation: [0, i * Math.PI/2, 0] as [number, number, number],
                            type: 'bench' 
                        }]}
                    />
                ))}
            </group>

            <Suspense fallback={null}>
                {buildingGrid}
                
                <InstancedProps 
                    instances={LEVEL1_PROP_INSTANCES}
                />
                
                <group name="Level1_Vegetation">
                    {LEVEL1_VEGETATION.map((veg) => (
                        <Vegetation key={veg.id} position={veg.position} type={veg.type} />
                    ))}
                </group>

                {LEVEL1_INTERACTABLES.map((inter) => (
                    <Interactables key={inter.id} position={inter.position} type={inter.type} />
                ))}

                {LEVEL1_DESTRUCTIBLES.map((dest) => (
                    <Destructibles key={dest.id} position={dest.position} type={dest.type} rotation={dest.rotation} />
                ))}

                {LEVEL1_GROUND_DECALS.map((decal) => (
                    <GroundDecals key={decal.id} position={decal.position} type={decal.type} />
                ))}

            </Suspense>

            <RigidBody type="fixed" colliders={false} position={[0, -0.05, 0]}>
                <CuboidCollider args={[500, 0.05, 500]} />
            </RigidBody>
            
            {/* {[...Array(5)].map((_, i) => (
                <React.Fragment key={`grid-${i}`}>
                    <Street position={[(i - 2) * 50, 0.01, 0]} length={1000} />
                    <Sidewalk position={[(i - 2) * 50 + 6, 0.02, 0]} length={1000} />
                    <Sidewalk position={[(i - 2) * 50 - 6, 0.02, 0]} length={1000} />
                    <Street position={[0, 0.01, (i - 2) * 50]} rotation={[0, Math.PI / 2, 0]} length={1000} />
                    <Sidewalk position={[0, 0.02, (i - 2) * 50 + 6]} rotation={[0, Math.PI / 2, 0]} length={1000} />
                    <Sidewalk position={[0, 0.02, (i - 2) * 50 - 6]} rotation={[0, Math.PI / 2, 0]} length={1000} />
                </React.Fragment>
            ))} */}
            
            {/* Removed Stage and Barriers as requested */}
            <MissionTrigger 
                position={[30, 0, 15]} 
                radius={8} 
                missionIndex={0} 
                label="BEOBACHTUNGSPPOSTEN NORD" 
            />
            
            <ConcertStage position={[0, 0, -25]} rotation={[0, 0, 0]} />

            {/* <Barriers position={[-10, 0.6, -35]} type="police" rotation={[0, Math.PI/4, 0]} />
            <Barriers position={[10, 0.6, -35]} type="police" rotation={[0, -Math.PI/4, 0]} />
            <Barriers position={[0, 0.6, -30]} type="police" rotation={[0, 0, 0]} /> */}
            
            {LEVEL1_STREET_LIGHTS.map((light) => (
                <StreetLight key={light.id} position={light.position} rotation={light.rotation} />
            ))}

            <TrafficSystem />

            {LEVEL1_VEHICLES.map((vehicle) => {
                if (vehicle.type === 'POLICE_CAR') return <PoliceCar key={vehicle.id} position={vehicle.position} rotation={vehicle.rotation} isSirenActive={vehicle.isSirenActive} />;
                if (vehicle.type === 'WATER_CANNON') return <WaterCannon key={vehicle.id} position={vehicle.position} rotation={vehicle.rotation} isSirenActive={vehicle.isSirenActive} />;
                return <Ambulance key={vehicle.id} position={vehicle.position} rotation={vehicle.rotation} isSirenActive={vehicle.isSirenActive} />;
            })}

            {/* Welt-Items (Dynamisch aus dem Store) */}
            {worldItems?.map((item: { id: string; itemId: string; position: [number, number, number] }) => (
                <WorldItem 
                    key={item.id} 
                    id={item.id} 
                    itemId={item.itemId} 
                    position={item.position} 
                />
            ))}

            <ParticleSystem />
            <WeatherSystem />
        </group>
    );
};

export default CityEnvironment;
