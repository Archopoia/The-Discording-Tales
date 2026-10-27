export {};

declare global {
    interface Window {
        __TDT_LANDING_CAROUSELS__?: {
            animal?: { src: string; alt: string; altFr?: string }[];
            people?: { src: string; alt: string; altFr?: string }[];
            world?: { src: string; alt: string; altFr?: string }[];
            culture?: { src: string; alt: string; altFr?: string }[];
        };
        __TDT_PROGRESSIVE_IMAGES__?: Record<string, { lqip: string; medium: string; full: string }>;
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
