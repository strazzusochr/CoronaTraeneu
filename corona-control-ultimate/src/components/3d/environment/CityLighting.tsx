import React from 'react';

/**
 * CITY LIGHTING SYSTEM (Phase G-08 - Optimized)
 */
export const CityLighting: React.FC = () => {
    return (
        <group name="CityLighting_Optimized">
            <ambientLight intensity={0.5} />
            <directionalLight
                position={[50, 100, 50]}
                intensity={1.2}
                castShadow
                shadow-mapSize={[512, 512]}
            />
        </group>
    );
};

export default CityLighting;
