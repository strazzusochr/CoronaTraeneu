import * as THREE from 'three';

export const TextureGenerator = {
    /**
     * Creates a high-detail skin texture with tonal variations and noise.
     */
    createSkin: (baseColor = '#ffdec1', resolution = 1024) => {
        const canvas = document.createElement('canvas');
        canvas.width = resolution;
        canvas.height = resolution;
        const ctx = canvas.getContext('2d');
        if (!ctx) return new THREE.Texture();

        // 1. Base Tone
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, resolution, resolution);

        // 2. Noise & Pores
        const imgData = ctx.getImageData(0, 0, resolution, resolution);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 10;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        ctx.putImageData(imgData, 0, 0);

        // 3. Tonal Variations (Red cheeks/nose area)
        const gradient = ctx.createRadialGradient(
            resolution / 2, resolution * 0.4, resolution * 0.1,
            resolution / 2, resolution * 0.4, resolution * 0.4
        );
        gradient.addColorStop(0, 'rgba(255, 100, 100, 0.15)');
        gradient.addColorStop(1, 'rgba(255, 100, 100, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, resolution, resolution);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    },

    /**
     * Creates a fabric texture with weave patterns.
     */
    createFabric: (color = '#4444aa', resolution = 512) => {
        const canvas = document.createElement('canvas');
        canvas.width = resolution;
        canvas.height = resolution;
        const ctx = canvas.getContext('2d');
        if (!ctx) return new THREE.Texture();

        ctx.fillStyle = color;
        ctx.fillRect(0, 0, resolution, resolution);

        // Weave pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < resolution; i += 4) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, resolution);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(resolution, i);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        return texture;
    }
};
