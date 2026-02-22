import React from 'react';
import { useGameStore } from '@/stores/gameStore';

export const InventoryUI: React.FC = () => {
    const inventory = useGameStore(state => state.inventory);
    const toggleInventory = useGameStore(state => state.toggleInventory);

    // Filter items with quantity > 0 or that actually exist
    const activeItems = inventory.filter(slot => slot.item);

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            display: 'flex',
            gap: '10px',
            pointerEvents: 'none',
            zIndex: 100
        }}>
            {activeItems.length === 0 ? (
                <div 
                    onClick={toggleInventory}
                    style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: 'rgba(20, 20, 20, 0.5)',
                        border: '2px dashed rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#888',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        pointerEvents: 'auto'
                    }} title="Rucksack öffnen (Taste: [I])">
                    🎒
                </div>
            ) : activeItems.map((slot, index) => (
                <div 
                    key={index}
                    onClick={toggleInventory} 
                    style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: 'rgba(20, 20, 20, 0.85)',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
                        color: 'white',
                        pointerEvents: 'auto',
                        cursor: 'pointer'
                    }}
                    title={`${slot.item?.name} - Klick oder 'I' um Rucksack zu öffnen`}
                >
                    <span style={{ fontSize: '2rem' }}>{slot.item?.icon || '📦'}</span>
                    {slot.item && slot.item.quantity > 0 && (
                        <span style={{
                            position: 'absolute',
                            bottom: '2px',
                            right: '6px',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            color: '#4fc3f7',
                            textShadow: '1px 1px 2px black'
                        }}>
                            x{slot.item.quantity}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};

export default InventoryUI;
