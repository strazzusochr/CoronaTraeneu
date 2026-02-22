import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/stores/gameStore';

const ITEM_TEMPLATES: Record<string, { name: string; color: string; type: string; maxStack: number; description: string; icon: string }> = {
    'ITEM_MEDKIT': { name: 'Erste-Hilfe-Set', color: '#ff4444', type: 'CONSUMABLE', maxStack: 5, description: 'Heilt 50 HP.', icon: '💊' },
    'ITEM_SYRINGE': { name: 'Adrenalin-Spritze', color: '#44ff44', type: 'CONSUMABLE', maxStack: 5, description: 'Schnelle Heilung.', icon: '💉' },
    'ITEM_MASK': { name: 'FFP2-Maske', color: '#ffffff', type: 'CONSUMABLE', maxStack: 10, description: 'Schutzmaske für Zivilisten.', icon: '😷' },
    'ITEM_RADIO': { name: 'Funkgerät', color: '#4444ff', type: 'EQUIPMENT', maxStack: 1, description: 'Kontakt zur Leitstelle.', icon: '📻' },
    'ITEM_PEPPER_SPRAY': { name: 'Pfefferspray', color: '#ffaa00', type: 'EQUIPMENT', maxStack: 1, description: 'Betäubt für kurze Zeit.', icon: '🌶️' },
};

interface WorldItemProps {
    id: string;
    itemId: string;
    position: [number, number, number];
}

export const WorldItem: React.FC<WorldItemProps> = ({ id, itemId, position }) => {
    const itemData = ITEM_TEMPLATES[itemId];
    const playerPosition = useGameStore(state => state.player.position);
    const removeWorldItem = useGameStore(state => state.removeWorldItem);
    const addItem = useGameStore(state => state.addItem);
    const setPrompt = useGameStore(state => state.setPrompt);

    const [isHovered, setIsHovered] = useState(false);
    const itemRef = useRef<THREE.Group>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);

    useFrame((state) => {
        if (!itemRef.current) return;

        // Sanfte Rotation
        itemRef.current.rotation.y += 0.01;
        itemRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;

        // 3-Sekunden Pulsieren (Blaues Leuchten)
        if (glowRef.current) {
            const pulse = (Math.sin(state.clock.elapsedTime * (Math.PI * 2 / 3)) + 1) / 2;
            glowRef.current.scale.setScalar(1.2 + pulse * 1.5); // Größerer Puls
            if (glowRef.current.material instanceof THREE.MeshBasicMaterial) {
                glowRef.current.material.opacity = 0.2 + pulse * 0.6;
            }
            if (lightRef.current) {
                lightRef.current.intensity = pulse * 15; // Starkes Aufleuchten
            }
        }

        // Distanz-Check
        const dist = new THREE.Vector3(...position).distanceTo(new THREE.Vector3(...playerPosition));
        const inRange = dist < 3;
        if (inRange !== isHovered) setIsHovered(inRange);
    });

    // Pick-up handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isHovered && e.key.toLowerCase() === 'e') {
                console.log(`Picking up ${itemId}`);
                if (!itemData) return;
                
                const success = addItem({
                    id: itemId,
                    name: itemData.name,
                    type: itemData.type,
                    quantity: 1,
                    maxStack: itemData.maxStack,
                    description: itemData.description,
                    icon: itemData.icon
                });

                if (success) {
                    removeWorldItem(id);
                    setPrompt(`AUFGEHOBEN: ${itemData.name}`);
                } else {
                    setPrompt(`INVENTAR VOLL: Kann ${itemData.name} nicht aufheben.`);
                }
            }
        };

        if (isHovered) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isHovered, id, itemId, itemData, removeWorldItem, setPrompt]);

    if (!itemData) return null;

    return (
        <group position={position}>
            <group ref={itemRef}>
                {/* Das eigentliche Item */}
                <mesh castShadow>
                    <boxGeometry args={[0.4, 0.4, 0.4]} />
                    <meshStandardMaterial 
                        color={itemData.color} 
                        emissive={itemData.color} 
                        emissiveIntensity={0.5} 
                    />
                </mesh>

                {/* Blaues Pulsierendes Leuchten */}
                <mesh ref={glowRef}>
                    <sphereGeometry args={[0.8, 24, 24]} />
                    <meshBasicMaterial color="#00ffff" transparent opacity={0.6} depthWrite={false} />
                </mesh>
                
                {/* Dynamisches Aufleuchten in Echtzeit (3s Zyklus) */}
                <pointLight 
                    ref={lightRef as any}
                    color="#00ffff" 
                    intensity={2} 
                    distance={15} 
                    decay={2} 
                />
            </group>

            {/* Interaction Prompt */}
            {isHovered && (
                <Html position={[0, 1.2, 0]} center>
                    <div style={{ 
                        background: 'rgba(0,0,0,0.85)', 
                        color: 'white', 
                        padding: '6px 12px', 
                        borderRadius: '4px',
                        border: '1px solid #0088ff',
                        fontFamily: 'Outfit, sans-serif',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        boxShadow: '0 0 15px rgba(0,136,255,0.5)'
                    }}>
                        <div style={{ fontWeight: 'bold' }}>{itemData.name}</div>
                        <div style={{ fontSize: '0.85em', opacity: 0.8 }}>[E] Aufheben</div>
                    </div>
                </Html>
            )}
        </group>
    );
};

export default WorldItem;
