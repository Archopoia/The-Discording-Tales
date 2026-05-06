// @ts-nocheck
// ========================================
// WebGL Shader Initialization
// Procedural texture generation for maximalist baroque styling
// ========================================
export function initWebGLShaders() {
    // Wait for shader library to load
    if (typeof window.TDTShaders === 'undefined') {
        console.warn('WebGL shader library not loaded, retrying...');
        setTimeout(initWebGLShaders, 100);
        return;
    }

    // Initialize background marble texture canvas
    const bgCanvas = document.getElementById('bg-marble-canvas');
    if (bgCanvas && window.TDTShaders.applyShader) {
        try {
            window.TDTShaders.applyShader(bgCanvas, 'marble', {
                uniforms: {
                    u_marbleBase: [0.96, 0.95, 0.91], // Cream
                    u_marbleVein: [0.36, 0.12, 0.12], // Burgundy
                    u_veinDensity: 6.0 // Slightly lower density for background
                }
            });
        } catch (error) {
            console.warn('Failed to initialize background marble shader:', error);
        }
    }

    // Initialize header gold texture canvas
    const headerCanvas = document.getElementById('header-gold-canvas');
    if (headerCanvas && window.TDTShaders.applyShader) {
        try {
            window.TDTShaders.applyShader(headerCanvas, 'gold', {
                uniforms: {
                    u_goldColor1: [0.96, 0.90, 0.67], // Bright gold
                    u_goldColor2: [0.75, 0.65, 0.45], // Darker brass
                    u_shimmerSpeed: 0.4 // Slower shimmer for header
                }
            });
        } catch (error) {
            console.warn('Failed to initialize header gold shader:', error);
        }
    }
}

/**
 * Handle window resize for WebGL canvases
 * Ensures procedural textures maintain proper resolution
 */
export function handleWebGLResize() {
    const canvases = document.querySelectorAll('.webgl-bg-canvas, .webgl-header-canvas');
    canvases.forEach(canvas => {
        if (window.TDTShaders && window.TDTShaders.resizeCanvas) {
            const gl = canvas.getContext('webgl');
            if (gl) {
                window.TDTShaders.resizeCanvas(gl, canvas);
            }
        }
    });
}
