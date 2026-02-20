import React from 'react';

/**
 * V6.0 LOD-3 NPC (200 Polygons)
 * Simple capsule for far distance.
 */
export const HumanCharacterLOD3 = ({ role = 'demonstrant', color = '#4444aa' }) => {
    return (
        <group name={`NPC_LOD3_${role}`}>
            <mesh position={[0, 0.9, 0]}>
                <capsuleGeometry args={[0.2, 1.5, 2, 4]} />
                <meshStandardMaterial color={role === 'polizei' ? '#000' : color} />
            </mesh>
        </group>
    );
};
