import React, { Suspense } from 'react';
import { StephansplatzGround } from '@/world/WienScene';
import { Fountain } from './Fountain';
import Street from './Street';
import Building from './Building';
import Sidewalk from './Sidewalk';
import InstancedProps from './InstancedProps';
import Vegetation from './Vegetation';
import StreetLight from './StreetLights';
import Interactables from './Interactables';
import Destructibles from './Destructibles';
import GroundDecals from './GroundDecals';
import TrafficSystem from './TrafficSystem';
import { CityLighting } from './CityLighting';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { PoliceCar } from '@/components/game/entities/PoliceCar';
import { WaterCannon } from '@/components/game/entities/WaterCannon';
import { Ambulance } from '@/components/game/entities/Ambulance';
import ParticleSystem from '@/components/Effects/ParticleSystem';
import AudioManager, { AudioLayer } from '@/managers/AudioManager';

// Seeded random helper to keep render pure
let citySeed = 42;
const pureRandom = () => {
    citySeed = (citySeed * 16807) % 2147483647;
    return (citySeed - 1) / 2147483646;
};

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
        id: 'veh_police_stephansplatz_front',
        type: 'POLICE_CAR',
        position: [10, 0.6, 20],
        rotation: [0, Math.PI, 0],
        isSirenActive: true
    },
    {
        id: 'veh_watercannon_stage_south',
        type: 'WATER_CANNON',
        position: [-10, 0.6, 30],
        rotation: [0, 0, 0],
        isSirenActive: false
    },
    {
        id: 'veh_ambulance_north_exit',
        type: 'AMBULANCE',
        position: [0, 0.6, -20],
        rotation: [0, Math.PI / 2, 0],
        isSirenActive: true
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
    ...[...Array(10)].map((_, i) => ({ id: `veg_tree_${i}`, position: [15, 0, -80 + i * 15] as [number, number, number], type: 'tree' as const })),
    ...[...Array(10)].map((_, i) => ({ id: `veg_tree_2_${i}`, position: [-15, 0, -80 + i * 15] as [number, number, number], type: 'tree' as const })),
    ...[...Array(5)].map((_, i) => ({ id: `veg_bush_${i}`, position: [5 + i, 0, 10] as [number, number, number], type: 'bush' as const }))
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

    const buildingGrid = React.useMemo(() => {
        const buildings = [];
        const blocks = 6; // Reduziert von 8 (äußere Reihen entfernt)
        const spacing = 60;

        for (let x = -blocks / 2; x < blocks / 2; x++) {
            for (let z = -blocks / 2; z < blocks / 2; z++) {
                // Clear the 2x2 center area for the square (radius 1 blocks = -1 to 1)
                if (Math.abs(x) < 1 && Math.abs(z) < 1) continue;

                const posX = x * spacing;
                const posZ = z * spacing;

                // Simple 2-building block for performance
                buildings.push(
                    <Building
                        key={`b-${x}-${z}-1`}
                        position={[posX - 10, 10, posZ - 10]}
                        width={20}
                        height={20}
                        depth={20}
                        color="#E3D9C6"
                    />
                );
                buildings.push(
                    <Building
                        key={`b-${x}-${z}-2`}
                        position={[posX + 10, 12, posZ + 10]}
                        width={18}
                        height={24}
                        depth={18}
                        color="#D4C5A9"
                    />
                );
            }
        }
        return buildings;
    }, []);

    return (
        <group name="CityEnvironment_V7_0">
            <StephansplatzGround />
            {/* <LandmarkVienna landmarkId="stephansdom" position={[0, 0, -80]} /> */}
            
            {/* REFINE CITY SQUARE (AAA) */}
            <Fountain position={[0, 0, 0]} />
            
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
            
            {[...Array(5)].map((_, i) => (
                <React.Fragment key={`grid-${i}`}>
                    <Street position={[(i - 2) * 50, 0.01, 0]} length={1000} />
                    <Sidewalk position={[(i - 2) * 50 + 6, 0.02, 0]} length={1000} />
                    <Sidewalk position={[(i - 2) * 50 - 6, 0.02, 0]} length={1000} />
                    <Street position={[0, 0.01, (i - 2) * 50]} rotation={[0, Math.PI / 2, 0]} length={1000} />
                    <Sidewalk position={[0, 0.02, (i - 2) * 50 + 6]} rotation={[0, Math.PI / 2, 0]} length={1000} />
                    <Sidewalk position={[0, 0.02, (i - 2) * 50 - 6]} rotation={[0, Math.PI / 2, 0]} length={1000} />
                </React.Fragment>
            ))}
            
            {/* Removed Stage and Barriers as requested */}
            {/* <ConcertStage position={[0, 0, -50]} rotation={[0, 0, 0]} />
            <Barriers position={[-10, 0.6, -35]} type="police" rotation={[0, Math.PI/4, 0]} />
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

            <ParticleSystem />
        </group>
    );
};

export default CityEnvironment;
