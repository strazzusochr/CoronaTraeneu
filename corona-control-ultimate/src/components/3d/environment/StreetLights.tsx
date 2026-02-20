import React from 'react';
import * as THREE from 'three';

interface StreetLightProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    intensity?: number;
    color?: string;
}

/**
 * ENV-013: StreetLights
 * Functional street lights with point lights.
 */
export const StreetLight: React.FC<StreetLightProps> = ({ 
    position, 
    rotation = [0, 0, 0],
    intensity = 5,
    color = "#fff5d7"
}) => {
    return (
        <group position={position} rotation={rotation}>
            {/* Pole */}
            <mesh castShadow>
                <cylinderGeometry args={[0.1, 0.15, 6, 8]} />
                <meshStandardMaterial color="#222222" />
            </mesh>
            
            {/* Arm */}
            <mesh position={[0.5, 3, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
                <meshStandardMaterial color="#222222" />
            </mesh>
            
            {/* Lamp Head */}
            <mesh position={[1, 3, 0]}>
                <boxGeometry args={[0.4, 0.2, 0.3]} />
                <meshStandardMaterial color="#333333" />
            </mesh>
            
            {/* The actual light */}
            <pointLight 
                position={[1, 2.8, 0]} 
                intensity={intensity} 
                color={color} 
                distance={15} 
                decay={2}
                castShadow={false}
            />
            
            {/* Emissive part of the lamp */}
            <mesh position={[1, 2.85, 0]}>
                <planeGeometry args={[0.3, 0.2]} />
                <meshStandardMaterial emissive={color} emissiveIntensity={2} />
            </mesh>
        </group>
    );
};

export default StreetLight;
