import React from 'react';

/**
 * V6.0 LOD-2 NPC (800 Polygons)
 */
export const HumanCharacterLOD2 = ({ role = 'demonstrant', color = '#4444aa', skinTone = '#ffdec1' }) => {
    return (
        <group name={`NPC_LOD2_${role}`}>
            {/* Extremely Simplified Body (Merged Shapes) */}
            <mesh position={[0, 1.4, 0]}>
                <capsuleGeometry args={[0.15, 1.2, 4, 4]} />
                <meshStandardMaterial color={role === 'polizei' ? '#111' : color} />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[0.3, 0.8, 0.2]} />
                <meshStandardMaterial color="#222" />
            </mesh>
        </group>
    );
};
