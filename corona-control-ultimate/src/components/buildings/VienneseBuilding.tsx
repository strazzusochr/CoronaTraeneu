import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Detailed } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { createBrickTexture, createConcreteTexture, createBrickNormalMap } from '@/utils/ProceduralTextures';

const SEGMENTS = {
    WINDOW_FRAME: 2,
    BALCONY: 6,
    ORNAMENT: 4,
    COLUMN: 8,
    CORNICE: 8,
};

interface VienneseBuildingProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    floors?: number;
    width?: number;
    depth?: number;
    style?: 'classic' | 'ornate' | 'corner' | 'rustika';
}

function WindowModule({
    width = 1.2,
    height = 1.8,
    position
}: {
    width?: number,
    height?: number,
    position: [number, number, number]
}) {
    const frameDepth = 0.12;
    const frameWidth = 0.08;
    const sillDepth = 0.2;

    const frameTopGeo = useMemo(() => new THREE.BoxGeometry(width + frameWidth * 2, frameWidth, frameDepth, SEGMENTS.WINDOW_FRAME, 2, 2), [width]);
    const frameSideGeo = useMemo(() => new THREE.BoxGeometry(frameWidth, height, frameDepth, 2, SEGMENTS.WINDOW_FRAME, 2), [height]);
    const frameBottomGeo = useMemo(() => new THREE.BoxGeometry(width + frameWidth * 2, frameWidth, frameDepth, SEGMENTS.WINDOW_FRAME, 2, 2), [width]);

    const sillGeo = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(-width / 2 - 0.08, 0);
        shape.lineTo(width / 2 + 0.08, 0);
        shape.lineTo(width / 2 + 0.08, sillDepth);
        shape.lineTo(-width / 2 - 0.08, sillDepth);
        shape.closePath();
        return new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 3 });
    }, [width, sillDepth]);

    const pedimentGeo = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(-width / 2 - 0.12, 0);
        shape.lineTo(0, 0.18);
        shape.lineTo(width / 2 + 0.12, 0);
        shape.closePath();
        return new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.015, bevelSegments: 3 });
    }, [width]);

    const glassGeo = useMemo(() => new THREE.PlaneGeometry(width, height, 8, 12), [width, height]);
    const crossVertGeo = useMemo(() => new THREE.BoxGeometry(0.025, height * 0.95, 0.02, 2, 12, 2), [height]);
    const crossHorzGeo = useMemo(() => new THREE.BoxGeometry(width * 0.95, 0.025, 0.02, 12, 2, 2), [width]);

    const frameMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xF5F0E6, roughness: 0.55 }), []);
    const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({ map: createConcreteTexture(512), color: 0xD8CDB8, roughness: 0.75 }), []);
    const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: 0xE8F4EC, transmission: 0.88, roughness: 0.05, metalness: 0, ior: 1.48, thickness: 0.01 }), []);

    return (
        <group position={position}>
            <mesh geometry={frameTopGeo} material={frameMat} position={[0, height / 2 + frameWidth / 2, 0]} castShadow />
            <mesh geometry={frameBottomGeo} material={frameMat} position={[0, -height / 2 - frameWidth / 2, 0]} castShadow />
            <mesh geometry={frameSideGeo} material={frameMat} position={[-width / 2 - frameWidth / 2, 0, 0]} castShadow />
            <mesh geometry={frameSideGeo} material={frameMat} position={[width / 2 + frameWidth / 2, 0, 0]} castShadow />
            <mesh geometry={crossVertGeo} material={frameMat} position={[0, 0, 0.01]} castShadow />
            <mesh geometry={crossHorzGeo} material={frameMat} position={[0, height * 0.12, 0.01]} castShadow />
            <mesh geometry={glassGeo} material={glassMat} position={[0, 0, -0.02]} />
            <mesh geometry={sillGeo} material={stoneMat} position={[0, -height / 2 - frameWidth, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow />
            <mesh geometry={pedimentGeo} material={stoneMat} position={[0, height / 2 + frameWidth + 0.08, -0.01]} rotation={[Math.PI / 2, 0, 0]} castShadow />
        </group>
    );
}

function BalconyModule({ width = 1.6, depth = 0.7, position }: { width?: number, depth?: number, position: [number, number, number] }) {
    const floorGeo = useMemo(() => new THREE.BoxGeometry(width, 0.1, depth, 16, 4, 8), [width, depth]);
    const consoleGeo = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0); shape.lineTo(0.15, 0); shape.lineTo(0.15, -0.2); shape.quadraticCurveTo(0.12, -0.35, 0, -0.4); shape.closePath();
        return new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelSize: 0.01, bevelSegments: 3 });
    }, []);

    const postGeo = useMemo(() => new THREE.CylinderGeometry(0.012, 0.012, 0.9, SEGMENTS.BALCONY, 6), []);
    const railGeo = useMemo(() => new THREE.BoxGeometry(width, 0.035, 0.035, 16, 2, 2), [width]);
    const scrollGeo = useMemo(() => new THREE.TorusGeometry(0.04, 0.008, 10, 16, Math.PI * 1.5), []);

    const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xD8CDB8, roughness: 0.7 }), []);
    const ironMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.45, metalness: 0.75 }), []);
    const postPositions = [-width / 2 + 0.05, -width / 4, 0, width / 4, width / 2 - 0.05];

    return (
        <group position={position}>
            <mesh geometry={floorGeo} material={stoneMat} castShadow receiveShadow />
            <mesh geometry={consoleGeo} material={stoneMat} position={[-width / 2 + 0.2, 0, -depth / 2 + 0.05]} rotation={[0, -Math.PI / 2, 0]} castShadow />
            <mesh geometry={consoleGeo} material={stoneMat} position={[width / 2 - 0.2, 0, -depth / 2 + 0.05]} rotation={[0, Math.PI / 2, 0]} castShadow />
            {postPositions.map((x, i) => <mesh key={`post${i}`} geometry={postGeo} material={ironMat} position={[x, 0.5, depth / 2 - 0.03]} castShadow />)}
            <mesh geometry={postGeo} material={ironMat} position={[-width / 2 + 0.03, 0.5, depth / 4]} castShadow />
            <mesh geometry={postGeo} material={ironMat} position={[width / 2 - 0.03, 0.5, depth / 4]} castShadow />
            <mesh geometry={railGeo} material={ironMat} position={[0, 0.95, depth / 2 - 0.03]} castShadow />
            {[-width / 4, width / 4].map((x, i) => <mesh key={`scroll${i}`} geometry={scrollGeo} material={ironMat} position={[x, 0.4, depth / 2 - 0.03]} rotation={[0, 0, Math.PI / 2]} castShadow />)}
        </group>
    );
}

function CorniceModule({ width, zOffset = 0 }: { width: number, zOffset?: number }) {
    const corniceGeo = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0); shape.lineTo(0.25, 0); shape.lineTo(0.25, 0.04); shape.lineTo(0.2, 0.06); shape.lineTo(0.2, 0.12); shape.lineTo(0.05, 0.12); shape.lineTo(0.05, 0.08); shape.lineTo(0, 0.08); shape.closePath();
        return new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
    }, [width]);
    const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xE8DED0, roughness: 0.65 }), []);
    return <mesh geometry={corniceGeo} material={stoneMat} position={[-width / 2, 0, zOffset]} rotation={[0, Math.PI / 2, 0]} castShadow />;
}

const VienneseBuilding: React.FC<VienneseBuildingProps> = ({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    floors = 5,
    width = 18,
    depth = 12,
    style = 'classic'
}) => {
    const groundFloorHeight = 4.2;
    const upperFloorHeight = 3.4;
    const totalHeight = groundFloorHeight + (floors - 1) * upperFloorHeight;
    const windowsPerFloor = Math.floor((width - 3) / 3.2);

    const wallColor = style === 'ornate' ? 0xF5F0E8 : (style === 'rustika' ? 0xD8CDB8 : 0xE8DCC8);
    const roofColor = style === 'corner' ? 0x2D4356 : 0x4A4A4A;

    const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ map: createBrickTexture(), normalMap: createBrickNormalMap(), color: wallColor, roughness: 0.75 }), [wallColor]);
    const stuccoMat = useMemo(() => new THREE.MeshStandardMaterial({ map: createConcreteTexture(512), color: 0xF5F0E8, roughness: 0.6 }), []);
    const rustikaMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xC8BFA8, roughness: 0.8 }), []);
    const roofMat = useMemo(() => new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.85 }), [roofColor]);

    const frontWallGeo = useMemo(() => new THREE.BoxGeometry(width, totalHeight, 0.4, 2, 8, 1), [width, totalHeight]);
    const sideWallGeo = useMemo(() => new THREE.BoxGeometry(0.4, totalHeight, depth, 1, 8, 2), [totalHeight, depth]);
    const rustikaHeight = style === 'rustika' ? groundFloorHeight + upperFloorHeight : groundFloorHeight;
    const rustikaGeo = useMemo(() => new THREE.BoxGeometry(width + 0.05, rustikaHeight, 0.15, 2, 4, 1), [width, rustikaHeight]);
    const pilasterGeo = useMemo(() => new THREE.BoxGeometry(0.25, totalHeight - rustikaHeight, 0.08, 1, 8, 1), [totalHeight, rustikaHeight]);
    const roofGeo = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(-width / 2 - 0.25, 0); shape.lineTo(-width / 2 + 1.5, 3.5); shape.lineTo(width / 2 - 1.5, 3.5); shape.lineTo(width / 2 + 0.25, 0); shape.closePath();
        return new THREE.ExtrudeGeometry(shape, { depth: depth + 0.4, bevelEnabled: false });
    }, [width, depth]);
    const kranzGeo = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0); shape.lineTo(0.35, 0); shape.lineTo(0.35, 0.08); shape.lineTo(0.28, 0.12); shape.lineTo(0.28, 0.22); shape.lineTo(0.18, 0.26); shape.lineTo(0, 0.26); shape.closePath();
        return new THREE.ExtrudeGeometry(shape, { depth: width + 0.4, bevelEnabled: false });
    }, [width]);

    return (
        <group position={position} rotation={rotation}>
            <Detailed distances={[0, 45, 120, 250]}>
                <group>
                    <mesh geometry={frontWallGeo} material={wallMat} position={[0, totalHeight / 2, depth / 2]} castShadow receiveShadow />
                    <mesh geometry={frontWallGeo} material={wallMat} position={[0, totalHeight / 2, -depth / 2]} castShadow receiveShadow />
                    <mesh geometry={sideWallGeo} material={wallMat} position={[-width / 2, totalHeight / 2, 0]} castShadow receiveShadow />
                    <mesh geometry={sideWallGeo} material={wallMat} position={[width / 2, totalHeight / 2, 0]} castShadow receiveShadow />
                    <mesh geometry={rustikaGeo} material={rustikaMat} position={[0, rustikaHeight / 2, depth / 2 + 0.07]} castShadow />
                    {Array.from({ length: Math.floor(windowsPerFloor / 2) }).map((_, i) => (
                        <React.Fragment key={`gw${i}`}>
                            <WindowModule position={[-(i + 1) * 3.2 - 1, groundFloorHeight / 2 + 0.4, depth / 2 + 0.2]} width={1.4} height={2.2} />
                            <WindowModule position={[(i + 1) * 3.2 + 1, groundFloorHeight / 2 + 0.4, depth / 2 + 0.2]} width={1.4} height={2.2} />
                        </React.Fragment>
                    ))}
                    <group position={[0, groundFloorHeight / 2, depth / 2 + 0.25]}>
                        <mesh><boxGeometry args={[2.2, groundFloorHeight - 0.5, 0.4]} /><meshStandardMaterial color={0x3D2817} /></mesh>
                    </group>
                    {Array.from({ length: floors - 1 }).map((_, floor) => (
                        <React.Fragment key={`floor${floor}`}>
                            <mesh position={[0, groundFloorHeight + floor * upperFloorHeight, depth / 2 + 0.12]}>
                                <boxGeometry args={[width + 0.15, 0.12, 0.22]} /><meshStandardMaterial color={0xF5F0E8} />
                            </mesh>
                            {Array.from({ length: windowsPerFloor }).map((_, win) => {
                                const x = (win - (windowsPerFloor - 1) / 2) * 3.2;
                                const y = groundFloorHeight + floor * upperFloorHeight + upperFloorHeight / 2 + 0.2;
                                const hasBalcony = (style === 'ornate' && floor < 2) || (floor === 0 && (win === 0 || win === windowsPerFloor - 1));
                                return (
                                    <React.Fragment key={`w${floor}_${win}`}>
                                        <WindowModule position={[x, y, depth / 2 + 0.2]} />
                                        {hasBalcony && <BalconyModule position={[x, y - 1.15, depth / 2 + 0.55]} />}
                                    </React.Fragment>
                                );
                            })}
                        </React.Fragment>
                    ))}
                    <mesh geometry={pilasterGeo} material={stuccoMat} position={[-width / 2 + 0.15, rustikaHeight + (totalHeight - rustikaHeight) / 2, depth / 2 + 0.04]} castShadow />
                    <mesh geometry={pilasterGeo} material={stuccoMat} position={[width / 2 - 0.15, rustikaHeight + (totalHeight - rustikaHeight) / 2, depth / 2 + 0.04]} castShadow />
                    <mesh geometry={kranzGeo} material={stuccoMat} position={[-width / 2 - 0.2, totalHeight, -depth / 2 - 0.2]} rotation={[0, Math.PI / 2, 0]} castShadow />
                    <mesh geometry={roofGeo} material={roofMat} position={[0, totalHeight, -depth / 2 - 0.2]} rotation={[-Math.PI / 2, 0, 0]} castShadow />
                </group>
                <group>
                    <mesh geometry={frontWallGeo} material={wallMat} position={[0, totalHeight / 2, depth / 2]} />
                    <mesh geometry={frontWallGeo} material={wallMat} position={[0, totalHeight / 2, -depth / 2]} />
                    <mesh geometry={sideWallGeo} material={wallMat} position={[-width / 2, totalHeight / 2, 0]} />
                    <mesh geometry={sideWallGeo} material={wallMat} position={[width / 2, totalHeight / 2, 0]} />
                    {Array.from({ length: floors }).map((_, f) => (
                        <mesh key={`f${f}`} position={[0, groundFloorHeight + (f - 1) * upperFloorHeight, depth / 2 + 0.05]}>
                            <boxGeometry args={[width * 0.9, 1.8, 0.1]} /><meshBasicMaterial color="#333" />
                        </mesh>
                    ))}
                    <mesh geometry={roofGeo} material={roofMat} position={[0, totalHeight, -depth / 2 - 0.2]} rotation={[-Math.PI / 2, 0, 0]} />
                </group>
                <mesh position={[0, totalHeight / 2, 0]}>
                    <boxGeometry args={[width, totalHeight, depth]} />
                    <meshStandardMaterial color={wallColor} roughness={1} />
                </mesh>
                <mesh position={[0, totalHeight / 2, 0]}>
                    <boxGeometry args={[width, totalHeight, depth]} />
                    <meshBasicMaterial color="#555" />
                </mesh>
            </Detailed>
        </group>
    );
};

export default VienneseBuilding;
