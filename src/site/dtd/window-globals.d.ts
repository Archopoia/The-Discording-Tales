export {};

declare global {
    interface Window {
        __TDT_LANDING_CAROUSELS__?: {
            lifestyles?: { src: string; alt: string }[];
            meanings?: { src: string; alt: string }[];
            stories?: { src: string; alt: string }[];
        };
        TDTShaders?: {
            applyShader?: (canvas: HTMLCanvasElement, type: string, opts?: { uniforms?: Record<string, unknown> }) => unknown;
            resizeCanvas?: (gl: WebGLRenderingContext, canvas: HTMLCanvasElement) => void;
        };
        /** SoundCloud embed API */
        SC?: unknown;
        GM_API_URL?: string;
        __tdtCharacterSheetLoaded?: boolean;
    }
}
