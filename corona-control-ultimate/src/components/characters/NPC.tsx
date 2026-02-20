import { NPCType, NPCState } from '@/types/enums';
import { HumanCharacter } from './HumanCharacter';

interface NPCProps {
    id: number;
    type: NPCType;
    state: NPCState;
    position: [number, number, number];
    isDetailed?: boolean; // Prop coming from CrowdRenderer
}

export const NPC: React.FC<NPCProps> = ({ type, position, isDetailed }) => {
    if (!isDetailed) return null;
    // Map Store Type to Component Role
    const roleMap: Record<string, 'polizei' | 'demonstrant' | 'zivilist'> = {
        [NPCType.POLICE]: 'polizei',
        [NPCType.WEGA]: 'polizei',
        [NPCType.DEMONSTRATOR]: 'demonstrant',
        [NPCType.RIOTER]: 'demonstrant',
        [NPCType.CIVILIAN]: 'zivilist',
        [NPCType.TOURIST]: 'zivilist',
        [NPCType.JOURNALIST]: 'zivilist',
        [NPCType.KRAUSE]: 'demonstrant',
        [NPCType.STEFAN]: 'zivilist',
        [NPCType.MARIA]: 'zivilist',
        [NPCType.HEINRICH]: 'zivilist',
        [NPCType.PLAYER]: 'zivilist',
    };

    const role = roleMap[type] || 'zivilist';

    return (
        <group position={position}>
            <HumanCharacter role={role} />
        </group>
    );
};

export default NPC;
