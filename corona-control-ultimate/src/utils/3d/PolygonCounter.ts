import * as THREE from 'three';

/**
 * UTILITY: PolygonCounter
 * Calculates total triangle count in the scene.
 */
export const getPolygonCount = (scene: THREE.Object3D): number => {
    let totalPolygons = 0;
    scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
            const geometry = object.geometry;
            if (geometry.index) {
                totalPolygons += geometry.index.count / 3;
            } else if (geometry.attributes.position) {
                totalPolygons += geometry.attributes.position.count / 3;
            }
        } else if (object instanceof THREE.InstancedMesh) {
            const geometry = object.geometry;
            const instanceCount = object.count;
            let meshPolygons = 0;
            if (geometry.index) {
                meshPolygons = geometry.index.count / 3;
            } else if (geometry.attributes.position) {
                meshPolygons = geometry.attributes.position.count / 3;
            }
            totalPolygons += meshPolygons * instanceCount;
        }
    });
    return totalPolygons;
};
