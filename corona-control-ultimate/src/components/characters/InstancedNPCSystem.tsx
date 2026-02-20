import React, { useMemo } from 'react';
import { Instances, Instance } from '@react-three/drei';
import { HumanCharacter } from './HumanCharacter';

interface InstancedNPCSystemProps {
    npcs: Array<{ position: [number, number, number], role: 'polizei' | 'demonstrant' | 'zivilist', color: string }>;
}

/**
 * INSTANCED NPC SYSTEM (Phase G-05)
 * Mandatory implementation for high-performance agent rendering.
 */
export const InstancedNPCSystem: React.FC<InstancedNPCSystemProps> = ({ npcs }) => {
    // Separate NPCs by role for better draw-call grouping
    const police = useMemo(() => npcs.filter(n => n.role === 'polizei'), [npcs]);
    const demonstrators = useMemo(() => npcs.filter(n => n.role === 'demonstrant'), [npcs]);
    const civilians = useMemo(() => npcs.filter(n => n.role === 'zivilist'), [npcs]);

    return (
        <group name="InstancedPopulation">
            {/* 1. Police Group */}
            {police.length > 0 && (
                <Instances range={police.length}>
                    <HumanCharacter role="polizei" />
                    {police.map((n, i) => (
                        <Instance key={i} position={n.position} />
                    ))}
                </Instances>
            )}

            {/* 2. Demonstrator Group */}
            {demonstrators.length > 0 && (
                <Instances range={demonstrators.length}>
                    <HumanCharacter role="demonstrant" />
                    {demonstrators.map((n, i) => (
                        <Instance key={i} position={n.position} />
                    ))}
                </Instances>
            )}

            {/* 3. Civilian Group */}
            {civilians.length > 0 && (
                <Instances range={civilians.length}>
                    <HumanCharacter role="zivilist" />
                    {civilians.map((n, i) => (
                        <Instance key={i} position={n.position} />
                    ))}
                </Instances>
            )}
        </group>
    );
};
