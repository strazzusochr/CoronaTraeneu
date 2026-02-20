import React from 'react';
import { ModularKit } from './ModularKit';

interface HighPolyBuildingProps {
    position: [number, number, number];
    width?: number;
    floors?: number;
    depth?: number;
}

/**
 * HIGH-POLY MODULAR BUILDING (Phase G-07)
 * Replaces primitive boxes with architectural assets.
 */
export const HighPolyBuilding: React.FC<HighPolyBuildingProps> = ({ 
    position, 
    width = 15, 
    floors = 5, 
    depth = 15 
}) => {
    const floorHeight = 4;
    
    return (
        <group position={position}>
            {/* 1. Ground Floor (Rustica) */}
            <ModularKit.GroundFloor width={width} height={floorHeight} depth={depth} />
            
            {/* 2. Upper Floors */}
            {Array.from({ length: floors - 1 }).map((_, i) => {
                const yPos = floorHeight + i * floorHeight;
                return (
                    <group key={i} position={[0, yPos, 0]}>
                        {/* Main Floor Box */}
                        <mesh castShadow receiveShadow>
                            <boxGeometry args={[width, floorHeight, depth]} />
                            <meshStandardMaterial color="#EBE0C4" roughness={0.7} />
                        </mesh>
                        
                        {/* Windows (High Poly) */}
                        {/* Front Facade */}
                        {[-1, 0, 1].map(x => (
                            <ModularKit.Window key={x} position={[x * (width / 4), 0, depth / 2 + 0.1]} />
                        ))}
                        {/* Back Facade */}
                        {[-1, 0, 1].map(x => (
                            <ModularKit.Window key={x} position={[x * (width / 4), 0, -depth / 2 - 0.1]} />
                        ))}
                        
                        {/* Ornaments */}
                        <ModularKit.Ornament position={[width / 2, floorHeight / 2, depth / 2]} />
                    </group>
                );
            })}

            {/* 3. Roof (PBR Patterned) */}
            <mesh position={[0, floors * floorHeight + 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <coneGeometry args={[width / 1.2, 8, 4]} />
                <meshStandardMaterial color="#554433" roughness={0.4} />
            </mesh>
        </group>
    );
};
