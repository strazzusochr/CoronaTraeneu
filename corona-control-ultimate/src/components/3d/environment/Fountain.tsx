import React from 'react';
import * as THREE from 'three';

export const Fountain: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    return (
        <group position={position}>
            {/* Base */}
            <mesh receiveShadow castShadow>
                <cylinderGeometry args={[4, 4.5, 0.5, 16]} />
                <meshStandardMaterial color="#666" roughness={0.4} />
            </mesh>
            {/* Middle Pillar */}
            <mesh position={[0, 1, 0]} castShadow>
                <cylinderGeometry args={[0.5, 0.8, 2, 8]} />
                <meshStandardMaterial color="#555" />
            </mesh>
            {/* Upper Bowl */}
            <mesh position={[0, 2, 0]} castShadow>
                <cylinderGeometry args={[2, 0.5, 0.5, 12]} />
                <meshStandardMaterial color="#444" />
            </mesh>
            {/* Water Surface */}
            <mesh position={[0, 0.3, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <circleGeometry args={[3.8, 16]} />
                <meshStandardMaterial color="#44aaff" transparent opacity={0.6} metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Water Jets (Simple Particles or Meshes) */}
            {[...Array(8)].map((_, i) => (
                <mesh key={i} position={[Math.cos(i * Math.PI/4) * 1.5, 1.8, Math.sin(i * Math.PI/4) * 1.5]}>
                    <sphereGeometry args={[0.1, 4, 4]} />
                    <meshStandardMaterial color="#fff" transparent opacity={0.8} />
                </mesh>
            ))}
        </group>
    );
};
