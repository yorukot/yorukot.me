export const boidsConfig = {
    mobileBreakpoint: 768,
    edgePadding: 32,
    neighborRadius: 80,
    separationRadius: 68,
    connectionRadius: 96,
    mouseRadius: 220,
    mousePressRadiusMultiplier: 1.45,
    boidAreaDensity: 1 / 22000,
    minBoidsMobile: 22,
    maxBoidsMobile: 54,
    minBoidsDesktop: 34,
    maxBoidsDesktop: 96,
    leaderRatio: 0.3,
    // Simulation steps per second. Motion is defined per step, so speed is the same on any display.
    stepsPerSecond: 60,
    // Redraw rate. Each redraw re-rasterises and re-composites a full-viewport layer, which is where most
    // of the GPU time goes, so the canvas only draws at the full rate while the pointer is being used.
    idleFps: 30,
    activeFps: 60,
    // How long after the last pointer move/press over the canvas it keeps drawing at activeFps.
    activeHoldMs: 1200,
    // Backing-store resolution cap. The layer is dim and soft, so device pixels beyond 1x aren't visible
    // but cost fill rate and memory on every frame.
    maxPixelRatio: 1,
    // Soft no-fly zone around [data-boids-avoid] elements (e.g. hero text).
    avoidPadding: 8,
    avoidMarginX: 140,
    avoidMarginY: 48,
    avoidStrength: 2.2,
    avoidInsideStrength: 1.6,
    avoidFullStrengthRatio: 0.45,
} as const;

export const boidsPaletteFallbacks = {
    node: 'hsl(0 0% 95%)',
    line: 'hsl(0 0% 62%)',
    ring: 'hsl(0 0% 85%)',
    leader: 'hsl(28 100% 53%)',
} as const;
