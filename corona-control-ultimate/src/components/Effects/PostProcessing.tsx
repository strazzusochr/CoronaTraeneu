import React from 'react';
import { EffectComposer, Bloom, Vignette, Noise, Scanline } from '@react-three/postprocessing';
import { POST_PROCESSING_PRESETS } from '@/rendering/RenderPipeline';
import { getGameTime } from '@/core/TimeEngine';

/**
 * EFF-014: PostProcessing
 * Final visual polish for the project.
 */
export const PostProcessing: React.FC = () => {
    const minutes = getGameTime() / 60;
    const hour = Math.floor(minutes / 60) % 24;

    const resolvePresetForHour = (h: number) => {
        if (h >= 6 && h < 12) return POST_PROCESSING_PRESETS.MORNING;
        if (h >= 12 && h < 18) return POST_PROCESSING_PRESETS.MIDDAY;
        if (h >= 18 && h < 22) return POST_PROCESSING_PRESETS.EVENING;
        return POST_PROCESSING_PRESETS.NIGHT;
    };

    const preset = resolvePresetForHour(hour);

    return (
        <EffectComposer multisampling={4}>
            <Bloom
                intensity={preset.bloomIntensity}
                luminanceThreshold={preset.bloomThreshold}
                luminanceSmoothing={0.025}
                mipmapBlur
            />
            <Noise opacity={0.05} />
            <Vignette eskil={false} offset={0.1} darkness={0.7} />
            <Scanline density={1.5} opacity={0.05} />
        </EffectComposer>
    );
};

export default PostProcessing;
