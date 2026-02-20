import React from 'react';
import { HighPolyBuilding } from '../components/buildings/HighPolyBuilding';
import { CityLighting } from '../components/3d/environment/CityLighting';
import { PostProcessingEffects } from '../components/3d/PostProcessingEffects';
import Stephansdom from '../components/buildings/Stephansdom';
import { getPolygonCount } from '../utils/3d/PolygonCounter';
import { useThree } from '@react-three/fiber';

import { RigidBody, CuboidCollider } from '@react-three/rapier';

/**
 * V7.1 WIEN WORLD GENERATOR (AAA RECONSTRUCTION)
 */
export const StephansplatzGround: React.FC = () => (
    <RigidBody type="fixed" colliders={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
            <planeGeometry args={[1000, 1000]} />
            <meshStandardMaterial color="#333" roughness={0.9} />
        </mesh>
        <CuboidCollider args={[500, 0.1, 500]} position={[0, -0.1, 0]} />
    </RigidBody>
);

export const WienScene: React.FC = () => {
    const { scene } = useThree();

    React.useEffect(() => {
        // Wait a bit for all instanced meshes to be ready
        const timer = setTimeout(() => {
            const count = getPolygonCount(scene);
            console.log(`📊 TOTAL POLYGON COUNT: ${count.toLocaleString()} Triangles`);
            if (count < 3000000) {
                console.log("✅ COMPLIANCE: Total polygon count is under 3,000,000.");
            } else {
                console.warn("⚠️ WARNING: Polygon count exceeds 3,000,000!");
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [scene]);

    return (
        <group name="WienScene_AAA">
            <CityLighting />

            {/* Ground */}
            <StephansplatzGround />

            {/* Landmark: Stephansdom (600k Polygons) */}
            <group position={[0, 0, 0]}>
                <Stephansdom />
            </group>

            {/* Modular Blocks */}
            <group position={[-50, 0, -30]}>
                <HighPolyBuilding position={[0, 0, 0]} width={20} floors={6} depth={15} />
            </group>

            <group position={[40, 0, -40]} rotation={[0, -Math.PI / 6, 0]}>
                <HighPolyBuilding position={[0, 0, 0]} width={15} floors={4} depth={20} />
            </group>
        </group>
    );
};
