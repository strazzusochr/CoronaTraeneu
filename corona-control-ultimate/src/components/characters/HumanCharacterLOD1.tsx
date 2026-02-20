import React from 'react';

/**
 * V6.0 LOD-1 NPC (2,000 Polygons)
 */
export const HumanCharacterLOD1 = ({ role = 'demonstrant', color = '#4444aa', skinTone = '#ffdec1' }) => {
    return (
        <group name={`NPC_LOD1_${role}`}>
            {/* Simplified Head (400) */}
            <mesh position={[0, 1.65, 0]} castShadow>
                <sphereGeometry args={[0.13, 16, 12]} />
                <meshStandardMaterial color={skinTone} />
            </mesh>

            {/* Simplified Torso (400) */}
            <mesh position={[0, 1.35, 0]} castShadow>
                <cylinderGeometry args={[0.15, 0.12, 0.6, 12]} />
                <meshStandardMaterial color={role === 'polizei' ? '#111' : color} />
            </mesh>

            {/* Simplified Arms (400) */}
            {[ -1, 1 ].map((side) => (
                <mesh key={side} position={[side * 0.2, 1.4, 0]} rotation={[0, 0, side * 0.1]} castShadow>
                    <capsuleGeometry args={[0.045, 0.5, 6, 8]} />
                    <meshStandardMaterial color={role === 'polizei' ? '#111' : color} />
                </mesh>
            ))}

            {/* Simplified Legs (700) */}
            {[ -1, 1 ].map((side) => (
                <mesh key={side} position={[side * 0.12, 0.5, 0]} castShadow>
                    <capsuleGeometry args={[0.07, 0.8, 6, 8]} />
                    <meshStandardMaterial color={role === 'polizei' ? '#111' : '#222'} />
                </mesh>
            ))}

            {/* Role Props (Low Poly) */}
            {role === 'polizei' && (
                <group position={[0, 1.7, 0]}>
                    <mesh><sphereGeometry args={[0.16, 12, 8]} /><meshStandardMaterial color="#222" /></mesh>
                </group>
            )}
        </group>
    );
};
