// Game constants
export const GAME_CONFIG = {
  // Renderer settings
  RENDER_WIDTH: 1280,
  RENDER_HEIGHT: 720,
  get PIXEL_RATIO() {
    if (typeof window === 'undefined') return 1;
    return Math.min(window.devicePixelRatio || 1, 2);
  },
  
  // Camera settings
  FOV: 60,
  NEAR: 0.1,
  FAR: 1000,
  MOUSE_SENSITIVITY: 0.002,
  
  // Movement settings
  MOVE_SPEED: 5.0,
  RUN_MULTIPLIER: 2.0,
  
  // Physics settings
  PHYSICS: {
    // Gravity vector (Y is up, so negative Y is down)
    GRAVITY: { x: 0, y: -9.81, z: 0 },
    // Fixed timestep for physics simulation (60 FPS)
    TIMESTEP: 1 / 60,
    // Maximum physics steps per frame (prevents spiral of death)
    MAX_STEPS: 5,
  },
  
  // Character controller settings
  CHARACTER_CONTROLLER: {
    // Capsule dimensions
    HEIGHT: 1.6, // Total height of capsule (eye height)
    RADIUS: 0.3, // Capsule radius
    // Step height (can step over obstacles this tall)
    STEP_HEIGHT: 0.3,
    // Maximum slope angle in radians (can walk up slopes up to this angle)
    MAX_SLOPE_ANGLE: Math.PI / 4, // 45 degrees
    // Jump force
    JUMP_FORCE: 5.0,
    // Ground detection distance
    GROUND_DETECTION_DISTANCE: 0.1,
    // Climbing settings (GRIMPE)
    CLIMB_SPEED: 2.0, // Vertical climbing speed
    CLIMB_REACH_DISTANCE: 0.5, // How close to a surface to start climbing
    CLIMB_MIN_ANGLE: Math.PI / 3, // Minimum angle from vertical (60 degrees) to be climbable
    // Dodge settings (ESQUIVE)
    DODGE_SPEED: 10.0, // Dodge velocity magnitude
    DODGE_DURATION: 0.3, // Dodge duration in seconds
  },
  
  // Camera settings (aiming/zooming - VISEE)
  AIM_FOV: 30, // Field of view when aiming (zoomed in)
  
  // Retro shader settings
  COLOR_BITS: 4, // Color quantization bits
  DITHER_ENABLED: true,
};

