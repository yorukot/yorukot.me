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
} as const;

export const boidsPaletteFallbacks = {
    node: 'hsl(0 0% 95%)',
    line: 'hsl(0 0% 62%)',
    ring: 'hsl(0 0% 85%)',
    leader: 'hsl(28 100% 53%)',
} as const;
