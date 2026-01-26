/**
 * THE DISCORDING TALES - WebGL Shader System
 * Procedural texture generation for maximalist baroque styling
 * 
 * Contains GLSL shaders for: Gold, Marble, Enamel, Brushed Metal, Stone textures
 * All shaders are procedurally generated - no texture images required
 */

(function() {
    'use strict';

    // ========================================
    // WebGL Context Management
    // ========================================
    const shaderContexts = new Map(); // Store contexts per canvas

    /**
     * Initialize WebGL context for a canvas element
     * @param {HTMLCanvasElement} canvas - Canvas element to initialize
     * @returns {WebGLRenderingContext|null} WebGL context or null if failed
     */
    function initWebGL(canvas) {
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            console.warn('WebGL not supported, falling back to CSS fallbacks');
            return null;
        }

        // Store context
        shaderContexts.set(canvas, gl);

        // Set viewport to match canvas size
        resizeCanvas(gl, canvas);

        return gl;
    }

    /**
     * Resize WebGL canvas and update viewport
     */
    function resizeCanvas(gl, canvas) {
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;

        if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
            canvas.width = displayWidth * dpr;
            canvas.height = displayHeight * dpr;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
    }

    // ========================================
    // Shader Compilation Utilities
    // ========================================

    /**
     * Create and compile a shader
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {number} type - Shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
     * @param {string} source - GLSL source code
     * @returns {WebGLShader|null} Compiled shader or null
     */
    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    /**
     * Create shader program from vertex and fragment shaders
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {string} vertexSource - Vertex shader source
     * @param {string} fragmentSource - Fragment shader source
     * @returns {WebGLProgram|null} Shader program or null
     */
    function createProgram(gl, vertexSource, fragmentSource) {
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

        if (!vertexShader || !fragmentShader) {
            return null;
        }

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program linking error:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    // ========================================
    // Standard Vertex Shader (used by all fragment shaders)
    // ========================================
    const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    // ========================================
    // Noise Functions (for procedural textures)
    // ========================================

    /**
     * Simple hash function for pseudo-random noise
     * Used in fragment shaders for Perlin-like noise generation
     */
    const noiseFunctions = `
        // 2D hash function (returns pseudo-random vec2)
        vec2 hash22(vec2 p) {
            p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
            return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
        }

        // Simple 2D noise (returns 0.0 to 1.0)
        float noise2d(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            
            vec2 u = f * f * (3.0 - 2.0 * f);
            
            return mix(
                mix(dot(hash22(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                    dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                mix(dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                    dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y
            ) * 0.5 + 0.5;
        }

        // Fractal Brownian Motion (layered noise)
        float fbm(vec2 p, int octaves) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            
            for (int i = 0; i < 4; i++) {
                if (i >= octaves) break;
                value += amplitude * noise2d(p * frequency);
                amplitude *= 0.5;
                frequency *= 2.0;
            }
            
            return value;
        }
    `;

    // ========================================
    // GOLD/BRASS Procedural Texture Shader
    // Creates rich metallic gold with animated specular highlights
    // ========================================
    const goldFragmentShader = `
        precision mediump float;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec3 u_goldColor1; // Primary gold color (bright yellow-gold)
        uniform vec3 u_goldColor2; // Secondary gold color (darker brass)
        uniform float u_shimmerSpeed; // Speed of shimmer animation

        ${noiseFunctions}

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            
            // Create base metallic gradient (vertical direction for "brushed" look)
            float metallicGradient = sin(uv.y * 20.0 + u_time * u_shimmerSpeed) * 0.5 + 0.5;
            metallicGradient = pow(metallicGradient, 2.0); // Sharper highlights
            
            // Add noise for texture variation
            float noise = fbm(uv * vec2(8.0, 8.0), 3);
            float textureVariation = mix(0.8, 1.2, noise);
            
            // Create animated specular highlights (moving horizontally)
            float specular = sin((uv.x + uv.y) * 15.0 + u_time * u_shimmerSpeed * 0.7) * 0.5 + 0.5;
            specular = pow(specular, 8.0); // Sharp highlight peaks
            specular *= 0.4; // Intensity control
            
            // Combine base gradient with texture and specular
            vec3 baseColor = mix(u_goldColor2, u_goldColor1, metallicGradient * textureVariation);
            baseColor += specular * vec3(1.0, 0.95, 0.7); // White-gold highlight
            
            // Add warm ambient glow
            vec3 finalColor = mix(baseColor, baseColor * vec3(1.1, 1.05, 0.9), 0.2);
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `;

    // ========================================
    // MARBLE Procedural Texture Shader
    // Organic veining patterns with cream-to-burgundy transitions
    // ========================================
    const marbleFragmentShader = `
        precision mediump float;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec3 u_marbleBase; // Cream/beige base color
        uniform vec3 u_marbleVein; // Burgundy vein color
        uniform float u_veinDensity; // How many veins (higher = more)

        ${noiseFunctions}

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            
            // Create flowing, organic vein patterns using noise
            // Use multiple octaves for complex veining
            float veins = fbm(uv * vec2(u_veinDensity * 0.5, u_veinDensity * 0.5), 4);
            
            // Create directional flow (like marble grain)
            vec2 flowDir = vec2(1.0, 0.3);
            float flowNoise = fbm((uv + u_time * 0.01) * flowDir * 2.0, 3);
            veins = mix(veins, flowNoise, 0.3);
            
            // Sharpen veins for more defined patterns
            veins = pow(abs(veins - 0.5) * 2.0, 0.7);
            
            // Create smooth color transition between base and veins
            float veinStrength = smoothstep(0.3, 0.7, veins);
            
            // Add subtle texture variation to base
            float baseTexture = fbm(uv * vec2(15.0, 15.0), 2) * 0.1;
            
            // Mix base and vein colors
            vec3 color = mix(
                u_marbleBase + baseTexture,
                u_marbleVein,
                veinStrength * 0.6 // Veins are 60% intensity
            );
            
            // Add subtle specular highlights (polished marble surface)
            float highlight = pow(smoothstep(0.4, 0.6, veins), 4.0) * 0.3;
            color += highlight * vec3(1.0, 0.98, 0.95);
            
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    // ========================================
    // ENAMEL/CERAMIC Procedural Texture Shader
    // Crackled surface with iridescent color shifts
    // ========================================
    const enamelFragmentShader = `
        precision mediump float;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec3 u_enamelBase; // Base enamel color
        uniform float u_crackleScale; // Size of crackle pattern

        ${noiseFunctions}

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            
            // Create crackle pattern using Voronoi-like noise
            float crackle = fbm(uv * u_crackleScale, 4);
            crackle = pow(abs(crackle - 0.5) * 2.0, 3.0); // Sharpen cracks
            
            // Add fine detail cracks
            float fineCracks = fbm(uv * u_crackleScale * 3.0, 2);
            fineCracks = step(0.95, fineCracks); // Binary crack lines
            
            // Combine crack patterns
            float crackPattern = min(crackle + fineCracks * 0.3, 1.0);
            
            // Iridescent color shift based on angle and time
            float angle = atan(uv.y - 0.5, uv.x - 0.5) / 3.14159;
            float iridescent = sin(angle * 3.0 + u_time * 0.5) * 0.5 + 0.5;
            
            // Create color variation
            vec3 shift1 = vec3(0.1, 0.15, 0.2); // Blue-purple shift
            vec3 shift2 = vec3(0.15, 0.1, 0.05); // Pink shift
            
            vec3 iridescentColor = mix(shift1, shift2, iridescent);
            
            // Apply crackle as dark lines, iridescence as overlay
            vec3 base = u_enamelBase * (1.0 - crackPattern * 0.3);
            base += iridescentColor * 0.2 * (1.0 - crackPattern);
            
            // Add subtle glossy highlight
            float highlight = pow(smoothstep(0.3, 0.7, noise2d(uv * 5.0)), 2.0) * 0.2;
            base += highlight * vec3(1.0);
            
            gl_FragColor = vec4(base, 1.0);
        }
    `;

    // ========================================
    // BRUSHED METAL Procedural Texture Shader
    // Linear grain with directional highlights
    // ========================================
    const brushedMetalFragmentShader = `
        precision mediump float;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec3 u_metalColor; // Base metal color
        uniform float u_brushAngle; // Direction of brush strokes (in radians)
        uniform float u_grainDensity; // How fine the grain is

        ${noiseFunctions}

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            
            // Rotate UV coordinates for brush angle
            float cosA = cos(u_brushAngle);
            float sinA = sin(u_brushAngle);
            vec2 rotatedUV = vec2(
                uv.x * cosA - uv.y * sinA,
                uv.x * sinA + uv.y * cosA
            );
            
            // Create linear grain pattern (horizontal lines in rotated space)
            float grain = sin(rotatedUV.y * u_grainDensity) * 0.5 + 0.5;
            grain = pow(grain, 8.0); // Sharp grain lines
            
            // Add noise for realistic texture
            float noise = fbm(uv * vec2(20.0, 20.0), 2);
            float textureVariation = mix(0.85, 1.15, noise);
            
            // Create directional highlights
            float highlight = smoothstep(0.4, 0.6, grain) * 0.4;
            
            // Combine base color with grain and highlights
            vec3 color = u_metalColor * textureVariation;
            color += highlight * vec3(1.0, 0.98, 0.95);
            
            // Subtle animated shimmer along grain direction
            float shimmer = sin(rotatedUV.y * 30.0 + u_time * 0.5) * 0.1 + 0.9;
            color *= shimmer;
            
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    // ========================================
    // STONE Procedural Texture Shader
    // Rough, granular texture with natural variation
    // ========================================
    const stoneFragmentShader = `
        precision mediump float;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec3 u_stoneBase; // Base stone color
        uniform vec3 u_stoneDark; // Darker stone color (for depth)
        uniform float u_grainSize; // Size of stone grain

        ${noiseFunctions}

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            
            // Create granular texture
            float grain = fbm(uv * u_grainSize, 4);
            
            // Create larger stone "chunks" with boundaries
            float chunks = fbm(uv * u_grainSize * 0.3, 3);
            chunks = smoothstep(0.3, 0.7, chunks);
            
            // Combine grain and chunks
            float texture = mix(grain, chunks, 0.3);
            
            // Add fine detail for roughness
            float detail = fbm(uv * u_grainSize * 5.0, 2);
            texture = mix(texture, detail, 0.2);
            
            // Create color variation (mix base and dark)
            vec3 color = mix(u_stoneDark, u_stoneBase, texture);
            
            // Add subtle depth with shadows
            float shadow = fbm(uv * u_grainSize * 0.2, 2);
            shadow = smoothstep(0.4, 0.6, shadow);
            color *= mix(0.8, 1.0, shadow);
            
            // Add very subtle highlights
            float highlight = pow(texture, 3.0) * 0.15;
            color += highlight * vec3(1.0, 0.98, 0.95);
            
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    // ========================================
    // Shader Program Creation & Management
    // ========================================

    /**
     * Create a shader program for a specific texture type
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {string} shaderType - Type of shader ('gold', 'marble', 'enamel', 'metal', 'stone')
     * @param {Object} uniforms - Uniform values for the shader
     * @returns {WebGLProgram|null} Shader program or null
     */
    function createTextureProgram(gl, shaderType, uniforms = {}) {
        let fragmentSource;

        switch(shaderType) {
            case 'gold':
                fragmentSource = goldFragmentShader;
                break;
            case 'marble':
                fragmentSource = marbleFragmentShader;
                break;
            case 'enamel':
                fragmentSource = enamelFragmentShader;
                break;
            case 'metal':
                fragmentSource = brushedMetalFragmentShader;
                break;
            case 'stone':
                fragmentSource = stoneFragmentShader;
                break;
            default:
                console.error('Unknown shader type:', shaderType);
                return null;
        }

        const program = createProgram(gl, vertexShaderSource, fragmentSource);
        
        if (program) {
            // Store default uniforms if provided
            if (uniforms) {
                program.defaultUniforms = uniforms;
            }
        }

        return program;
    }

    /**
     * Set up geometry (fullscreen quad) for rendering
     * @param {WebGLRenderingContext} gl - WebGL context
     * @returns {Object} Geometry info with position buffer and count
     */
    function setupGeometry(gl) {
        // Fullscreen quad vertices (in clip space: -1 to 1)
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1,
        ]);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        return {
            buffer: positionBuffer,
            count: 6
        };
    }

    /**
     * Apply shader to canvas and set up animation loop
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {string} shaderType - Type of shader ('gold', 'marble', etc.)
     * @param {Object} options - Configuration options (colors, parameters, etc.)
     * @returns {Function} Cleanup function to stop animation
     */
    function applyShader(canvas, shaderType, options = {}) {
        const gl = initWebGL(canvas);
        if (!gl) return null; // WebGL not supported

        // Set default options based on shader type
        const defaults = getDefaultOptions(shaderType);
        const config = { ...defaults, ...options };

        // Create shader program
        const program = createTextureProgram(gl, shaderType, config.uniforms);
        if (!program) return null;

        // Set up geometry
        const geometry = setupGeometry(gl);

        // Get attribute and uniform locations
        const positionLocation = gl.getAttribLocation(program, 'a_position');
        const timeLocation = gl.getUniformLocation(program, 'u_time');
        const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');

        // Get shader-specific uniform locations
        const uniformLocations = getUniformLocations(gl, program, shaderType);

        let animationId = null;
        let startTime = Date.now();

        function render() {
            // Resize if needed
            resizeCanvas(gl, canvas);

            // Clear canvas
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // Use shader program
            gl.useProgram(program);

            // Set up geometry
            gl.bindBuffer(gl.ARRAY_BUFFER, geometry.buffer);
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

            // Set time uniform (in seconds)
            const time = (Date.now() - startTime) / 1000.0;
            gl.uniform1f(timeLocation, time);

            // Set resolution uniform
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

            // Set shader-specific uniforms
            setShaderUniforms(gl, uniformLocations, shaderType, config);

            // Draw fullscreen quad
            gl.drawArrays(gl.TRIANGLES, 0, geometry.count);

            // Continue animation loop
            animationId = requestAnimationFrame(render);
        }

        // Start rendering loop
        render();

        // Return cleanup function
        return function cleanup() {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }

    /**
     * Get default options for a shader type
     */
    function getDefaultOptions(shaderType) {
        switch(shaderType) {
            case 'gold':
                return {
                    uniforms: {
                        u_goldColor1: [0.96, 0.90, 0.67], // Bright gold
                        u_goldColor2: [0.75, 0.65, 0.45], // Darker brass
                        u_shimmerSpeed: 0.5
                    }
                };
            case 'marble':
                return {
                    uniforms: {
                        u_marbleBase: [0.96, 0.95, 0.91], // Cream
                        u_marbleVein: [0.36, 0.12, 0.12], // Burgundy
                        u_veinDensity: 8.0
                    }
                };
            case 'enamel':
                return {
                    uniforms: {
                        u_enamelBase: [0.91, 0.89, 0.85], // Light beige
                        u_crackleScale: 10.0
                    }
                };
            case 'metal':
                return {
                    uniforms: {
                        u_metalColor: [0.85, 0.82, 0.78], // Silver-gray
                        u_brushAngle: 0.0, // Horizontal
                        u_grainDensity: 100.0
                    }
                };
            case 'stone':
                return {
                    uniforms: {
                        u_stoneBase: [0.80, 0.75, 0.70], // Light stone
                        u_stoneDark: [0.60, 0.55, 0.50], // Dark stone
                        u_grainSize: 15.0
                    }
                };
            default:
                return {};
        }
    }

    /**
     * Get uniform locations for a shader type
     */
    function getUniformLocations(gl, program, shaderType) {
        const locations = {};

        switch(shaderType) {
            case 'gold':
                locations.u_goldColor1 = gl.getUniformLocation(program, 'u_goldColor1');
                locations.u_goldColor2 = gl.getUniformLocation(program, 'u_goldColor2');
                locations.u_shimmerSpeed = gl.getUniformLocation(program, 'u_shimmerSpeed');
                break;
            case 'marble':
                locations.u_marbleBase = gl.getUniformLocation(program, 'u_marbleBase');
                locations.u_marbleVein = gl.getUniformLocation(program, 'u_marbleVein');
                locations.u_veinDensity = gl.getUniformLocation(program, 'u_veinDensity');
                break;
            case 'enamel':
                locations.u_enamelBase = gl.getUniformLocation(program, 'u_enamelBase');
                locations.u_crackleScale = gl.getUniformLocation(program, 'u_crackleScale');
                break;
            case 'metal':
                locations.u_metalColor = gl.getUniformLocation(program, 'u_metalColor');
                locations.u_brushAngle = gl.getUniformLocation(program, 'u_brushAngle');
                locations.u_grainDensity = gl.getUniformLocation(program, 'u_grainDensity');
                break;
            case 'stone':
                locations.u_stoneBase = gl.getUniformLocation(program, 'u_stoneBase');
                locations.u_stoneDark = gl.getUniformLocation(program, 'u_stoneDark');
                locations.u_grainSize = gl.getUniformLocation(program, 'u_grainSize');
                break;
        }

        return locations;
    }

    /**
     * Set shader-specific uniform values
     */
    function setShaderUniforms(gl, locations, shaderType, config) {
        const uniforms = config.uniforms || {};

        switch(shaderType) {
            case 'gold':
                if (locations.u_goldColor1 && uniforms.u_goldColor1) {
                    gl.uniform3fv(locations.u_goldColor1, uniforms.u_goldColor1);
                }
                if (locations.u_goldColor2 && uniforms.u_goldColor2) {
                    gl.uniform3fv(locations.u_goldColor2, uniforms.u_goldColor2);
                }
                if (locations.u_shimmerSpeed !== null && uniforms.u_shimmerSpeed !== undefined) {
                    gl.uniform1f(locations.u_shimmerSpeed, uniforms.u_shimmerSpeed);
                }
                break;
            case 'marble':
                if (locations.u_marbleBase && uniforms.u_marbleBase) {
                    gl.uniform3fv(locations.u_marbleBase, uniforms.u_marbleBase);
                }
                if (locations.u_marbleVein && uniforms.u_marbleVein) {
                    gl.uniform3fv(locations.u_marbleVein, uniforms.u_marbleVein);
                }
                if (locations.u_veinDensity !== null && uniforms.u_veinDensity !== undefined) {
                    gl.uniform1f(locations.u_veinDensity, uniforms.u_veinDensity);
                }
                break;
            case 'enamel':
                if (locations.u_enamelBase && uniforms.u_enamelBase) {
                    gl.uniform3fv(locations.u_enamelBase, uniforms.u_enamelBase);
                }
                if (locations.u_crackleScale !== null && uniforms.u_crackleScale !== undefined) {
                    gl.uniform1f(locations.u_crackleScale, uniforms.u_crackleScale);
                }
                break;
            case 'metal':
                if (locations.u_metalColor && uniforms.u_metalColor) {
                    gl.uniform3fv(locations.u_metalColor, uniforms.u_metalColor);
                }
                if (locations.u_brushAngle !== null && uniforms.u_brushAngle !== undefined) {
                    gl.uniform1f(locations.u_brushAngle, uniforms.u_brushAngle);
                }
                if (locations.u_grainDensity !== null && uniforms.u_grainDensity !== undefined) {
                    gl.uniform1f(locations.u_grainDensity, uniforms.u_grainDensity);
                }
                break;
            case 'stone':
                if (locations.u_stoneBase && uniforms.u_stoneBase) {
                    gl.uniform3fv(locations.u_stoneBase, uniforms.u_stoneBase);
                }
                if (locations.u_stoneDark && uniforms.u_stoneDark) {
                    gl.uniform3fv(locations.u_stoneDark, uniforms.u_stoneDark);
                }
                if (locations.u_grainSize !== null && uniforms.u_grainSize !== undefined) {
                    gl.uniform1f(locations.u_grainSize, uniforms.u_grainSize);
                }
                break;
        }
    }

    // ========================================
    // Public API
    // ========================================
    window.TDTShaders = {
        applyShader: applyShader,
        initWebGL: initWebGL,
        resizeCanvas: resizeCanvas
    };

})();

