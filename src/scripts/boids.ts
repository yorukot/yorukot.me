import { boidsConfig, boidsPaletteFallbacks } from '../data/boids';

type Rgb = [number, number, number];

type Zone = {
    left: number;
    top: number;
    right: number;
    bottom: number;
};

// Lines and boids are batched into one path per (colour, width) bucket instead of one stroke/fill each.
// Alpha is quantised to steps of ALPHA_STEP/255 and line width to LINE_WIDTH_STEP px, both well below
// what is visible on a background drawn at reduced opacity.
const ALPHA_STEP = 4;
const ALPHA_LEVELS = Math.ceil(255 / ALPHA_STEP) + 1;
const LINE_WIDTH_STEP = 0.15;
const LINE_WIDTH_LEVELS = Math.round(1.2 / LINE_WIDTH_STEP) + 1;
const MAX_STEPS_PER_FRAME = 4;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const cssColorToRgb = (value: string, fallback: string): Rgb => {
    const sample = document.createElement('span');
    sample.style.color = value.trim() || fallback;
    document.body.append(sample);

    const resolved = getComputedStyle(sample).color;
    sample.remove();

    const matches = resolved.match(/\d+(?:\.\d+)?/g);

    if (!matches || matches.length < 3) {
        return cssColorToRgb(fallback, 'rgb(255 255 255)');
    }

    return [
        Number.parseInt(matches[0]!, 10),
        Number.parseInt(matches[1]!, 10),
        Number.parseInt(matches[2]!, 10),
    ];
};

// Every rgba() string for alpha 0..255, built once per palette read so frames never format colours.
const colorTable = ([r, g, b]: Rgb) =>
    Array.from({ length: 256 }, (_, alpha) => `rgba(${r}, ${g}, ${b}, ${alpha / 255})`);

const getPalette = () => {
    const styles = getComputedStyle(document.documentElement);

    return {
        node: colorTable(cssColorToRgb(styles.getPropertyValue('--boids-node'), boidsPaletteFallbacks.node)),
        line: colorTable(cssColorToRgb(styles.getPropertyValue('--boids-line'), boidsPaletteFallbacks.line)),
        ring: colorTable(cssColorToRgb(styles.getPropertyValue('--boids-ring'), boidsPaletteFallbacks.ring)),
    };
};

const alphaKey = (alpha: number) => Math.round(clamp(alpha, 0, 255) / ALPHA_STEP);

const alphaFromKey = (key: number) => Math.min(key * ALPHA_STEP, 255);

// Counting sort: fills order[0..count) with item indices grouped by ascending key.
// `counts` is scratch space with one slot per possible key.
const groupByKey = (keys: Int32Array, count: number, counts: Int32Array, order: Int32Array) => {
    counts.fill(0);

    for (let index = 0; index < count; index += 1) {
        const key = keys[index]!;
        counts[key] = counts[key]! + 1;
    }

    let offset = 0;

    for (let key = 0; key < counts.length; key += 1) {
        const size = counts[key]!;
        counts[key] = offset;
        offset += size;
    }

    for (let index = 0; index < count; index += 1) {
        const key = keys[index]!;
        const slot = counts[key]!;
        order[slot] = index;
        counts[key] = slot + 1;
    }
};

export const mountBoids = (root: HTMLElement) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return () => {};
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        return () => {};
    }

    const {
        separationRadius,
        neighborRadius,
        connectionRadius,
        edgePadding,
        avoidMarginX,
        avoidMarginY,
        avoidFullStrengthRatio,
        avoidStrength,
        avoidInsideStrength,
    } = boidsConfig;
    const separationRadiusSq = separationRadius * separationRadius;
    const neighborRadiusSq = neighborRadius * neighborRadius;
    const flockRadiusSq = Math.max(separationRadiusSq, neighborRadiusSq);
    const connectionRadiusSq = connectionRadius * connectionRadius;
    const stepMs = 1000 / boidsConfig.stepsPerSecond;
    const idleFrameMs = 1000 / boidsConfig.idleFps;
    const activeFrameMs = 1000 / boidsConfig.activeFps;

    let width = root.clientWidth;
    let height = root.clientHeight;
    let palette = getPalette();
    let hasPointer = false;
    let pointerX = 0;
    let pointerY = 0;
    let isPointerPressed = false;
    let animatedMouseRadius: number = boidsConfig.mouseRadius;
    let stepCount = 0;
    let animationFrame = 0;
    let lastTime = -1;
    let lastRender = -Infinity;
    let accumulator = 0;
    let activeUntil = 0;
    let isOnScreen = true;
    let zones: Zone[] = [];

    // Boid state as struct-of-arrays so a frame allocates nothing.
    let count = 0;
    let posX = new Float64Array(0);
    let posY = new Float64Array(0);
    let velX = new Float64Array(0);
    let velY = new Float64Array(0);
    let maxSpeed = new Float64Array(0);
    let maxForce = new Float64Array(0);
    let size = new Float64Array(0);
    let pulseOffset = new Float64Array(0);
    let pointerDistance = new Float64Array(0);
    let lineCoords = new Float32Array(0);
    let lineKeys = new Int32Array(0);
    let lineOrder = new Int32Array(0);
    let boidKeys = new Int32Array(0);
    let boidOrder = new Int32Array(0);
    const lineBuckets = new Int32Array(ALPHA_LEVELS * LINE_WIDTH_LEVELS);
    const boidBuckets = new Int32Array(ALPHA_LEVELS);

    // Scratch outputs (typed arrays, so writing doubles doesn't box them on the heap).
    const steerOut = new Float64Array(2);
    const avoidOut = new Float64Array(2);

    // desired = direction scaled to `speed`; steer = limit(desired - velocity, maxSteer).
    const steer = (dx: number, dy: number, speed: number, vx: number, vy: number, maxSteer: number) => {
        const length = Math.sqrt(dx * dx + dy * dy);
        let x = -vx;
        let y = -vy;

        if (length !== 0) {
            const scale = speed / length;
            x += dx * scale;
            y += dy * scale;
        }

        const magnitude = Math.sqrt(x * x + y * y);

        if (magnitude > maxSteer) {
            const scale = maxSteer / magnitude;
            x *= scale;
            y *= scale;
        }

        steerOut[0] = x;
        steerOut[1] = y;
    };

    // Elements marked with data-boids-avoid get a soft no-fly zone so the flock drifts around them.
    const avoidElements = Array.from(
        root.parentElement?.querySelectorAll<HTMLElement>('[data-boids-avoid]') ?? [],
    );

    const syncZones = () => {
        const rootRect = root.getBoundingClientRect();

        zones = avoidElements.map((element) => {
            const rect = element.getBoundingClientRect();

            return {
                left: rect.left - rootRect.left - boidsConfig.avoidPadding,
                top: rect.top - rootRect.top - boidsConfig.avoidPadding,
                right: rect.right - rootRect.left + boidsConfig.avoidPadding,
                bottom: rect.bottom - rootRect.top + boidsConfig.avoidPadding,
            };
        });
    };

    const isInZone = (x: number, y: number) =>
        zones.some((zone) => x > zone.left && x < zone.right && y > zone.top && y < zone.bottom);

    const getBoidCount = () => {
        const area = Math.max(width * height, 1);
        const desired = Math.round(area * boidsConfig.boidAreaDensity);

        if (window.innerWidth < boidsConfig.mobileBreakpoint) {
            return clamp(desired, boidsConfig.minBoidsMobile, boidsConfig.maxBoidsMobile);
        }

        return clamp(desired, boidsConfig.minBoidsDesktop, boidsConfig.maxBoidsDesktop);
    };

    const resetBoids = () => {
        count = getBoidCount();
        posX = new Float64Array(count);
        posY = new Float64Array(count);
        velX = new Float64Array(count);
        velY = new Float64Array(count);
        maxSpeed = new Float64Array(count);
        maxForce = new Float64Array(count);
        size = new Float64Array(count);
        pulseOffset = new Float64Array(count);
        pointerDistance = new Float64Array(count);
        boidKeys = new Int32Array(count);
        boidOrder = new Int32Array(count);

        const maxLines = (count * (count - 1)) / 2;
        lineCoords = new Float32Array(maxLines * 4);
        lineKeys = new Int32Array(maxLines);
        lineOrder = new Int32Array(maxLines);

        for (let index = 0; index < count; index += 1) {
            // Spawn outside the no-fly zones so the text starts clear.
            let x = Math.random() * width;
            let y = Math.random() * height;

            for (let attempt = 0; attempt < 30 && isInZone(x, y); attempt += 1) {
                x = Math.random() * width;
                y = Math.random() * height;
            }

            const dirX = Math.random() * 2 - 1;
            const dirY = Math.random() * 2 - 1;
            const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
            const speed = 0.85 + Math.random() * 0.65;

            posX[index] = x;
            posY[index] = y;
            velX[index] = dirLength === 0 ? 0 : (dirX / dirLength) * speed;
            velY[index] = dirLength === 0 ? 0 : (dirY / dirLength) * speed;
            maxSpeed[index] = 1.45 + Math.random() * 0.55;
            maxForce[index] = 0.03 + Math.random() * 0.02;
            size[index] = 24 + Math.random() * 14;
            pulseOffset[index] = Math.random() * Math.PI * 2;
        }
    };

    // Zone-avoidance steering for boid i, written to avoidOut.

    const avoidZones = (i: number) => {
        const x = posX[i]!;
        const y = posY[i]!;
        const vx = velX[i]!;
        const vy = velY[i]!;
        let avoidX = 0;
        let avoidY = 0;

        for (const zone of zones) {
            const nearestX = Math.min(Math.max(x, zone.left), zone.right);
            const nearestY = Math.min(Math.max(y, zone.top), zone.bottom);
            let dirX: number;
            let dirY: number;
            let strength: number;

            if (nearestX === x && nearestY === y) {
                // Inside: head for the closest edge.
                let best = x - zone.left;
                dirX = -1;
                dirY = 0;

                if (zone.right - x < best) {
                    best = zone.right - x;
                    dirX = 1;
                }

                if (y - zone.top < best) {
                    best = y - zone.top;
                    dirX = 0;
                    dirY = -1;
                }

                if (zone.bottom - y < best) {
                    dirX = 0;
                    dirY = 1;
                }

                strength = avoidInsideStrength;
            } else {
                // Distance normalised per axis, so the buffer is wide at the sides but shallow above/below.
                dirX = x - nearestX;
                dirY = y - nearestY;
                const nx = dirX / avoidMarginX;
                const ny = dirY / avoidMarginY;
                const dSq = nx * nx + ny * ny;

                if (dSq > 1) continue;

                // Full strength near the text, fading out smoothly only in the outer part of the margin.
                const t = clamp((Math.sqrt(dSq) - avoidFullStrengthRatio) / (1 - avoidFullStrengthRatio), 0, 1);
                strength = 1 - t * t * (3 - 2 * t);
            }

            steer(dirX, dirY, maxSpeed[i]!, vx, vy, maxForce[i]! * strength * avoidStrength);
            avoidX += steerOut[0]!;
            avoidY += steerOut[1]!;
        }

        avoidOut[0] = avoidX;
        avoidOut[1] = avoidY;
    };

    const step = () => {
        stepCount += 1;

        const mouseRadiusTarget = isPointerPressed
            ? boidsConfig.mouseRadius * boidsConfig.mousePressRadiusMultiplier
            : boidsConfig.mouseRadius;
        animatedMouseRadius += (mouseRadiusTarget - animatedMouseRadius) * (isPointerPressed ? 0.18 : 0.14);
        const mouseRadius = animatedMouseRadius;

        // Boids update in order and see already-moved neighbours, matching the original sequential update.
        for (let i = 0; i < count; i += 1) {
            const x = posX[i]!;
            const y = posY[i]!;
            const vx = velX[i]!;
            const vy = velY[i]!;
            const speed = maxSpeed[i]!;
            const force = maxForce[i]!;
            let sepX = 0;
            let sepY = 0;
            let alignX = 0;
            let alignY = 0;
            let cohX = 0;
            let cohY = 0;
            let total = 0;
            let separationTotal = 0;

            for (let j = 0; j < count; j += 1) {
                if (j === i) continue;

                const dx = x - posX[j]!;
                const dy = y - posY[j]!;
                const dSq = dx * dx + dy * dy;

                if (dSq === 0 || dSq >= flockRadiusSq) continue;

                if (dSq < separationRadiusSq) {
                    sepX += dx / dSq;
                    sepY += dy / dSq;
                    separationTotal += 1;
                }

                if (dSq < neighborRadiusSq) {
                    alignX += velX[j]!;
                    alignY += velY[j]!;
                    cohX += posX[j]!;
                    cohY += posY[j]!;
                    total += 1;
                }
            }

            let accX = 0;
            let accY = 0;

            if (separationTotal > 0) {
                steer(sepX, sepY, speed, vx, vy, force * 1.4);
                accX += steerOut[0]! * 2.15;
                accY += steerOut[1]! * 2.15;
            }

            if (total > 0) {
                steer(alignX, alignY, speed, vx, vy, force);
                accX += steerOut[0]! * 0.92;
                accY += steerOut[1]! * 0.92;

                steer(cohX / total - x, cohY / total - y, speed, vx, vy, force * 0.8);
                accX += steerOut[0]! * 0.3;
                accY += steerOut[1]! * 0.3;
            }

            if (hasPointer) {
                const toPointerX = pointerX - x;
                const toPointerY = pointerY - y;
                const d = Math.sqrt(toPointerX * toPointerX + toPointerY * toPointerY);

                if (d < mouseRadius) {
                    const pull = 1 - d / mouseRadius;
                    steer(toPointerX, toPointerY, speed * (0.2 + pull * 0.45), vx, vy, force * (0.65 + pull * 1.1));
                    accX += steerOut[0]!;
                    accY += steerOut[1]!;

                    if (d < 58) {
                        steer(-toPointerX, -toPointerY, speed, vx, vy, force * 1.35);
                        accX += steerOut[0]!;
                        accY += steerOut[1]!;
                    }
                }
            }

            if (zones.length > 0) {
                avoidZones(i);
                accX += avoidOut[0]!;
                accY += avoidOut[1]!;
            }

            let nextVx = vx + accX;
            let nextVy = vy + accY;
            const velocity = Math.sqrt(nextVx * nextVx + nextVy * nextVy);

            if (velocity > speed) {
                nextVx *= speed / velocity;
                nextVy *= speed / velocity;
            }

            let nextX = x + nextVx;
            let nextY = y + nextVy;

            if (nextX < -edgePadding) nextX = width + edgePadding;
            if (nextX > width + edgePadding) nextX = -edgePadding;
            if (nextY < -edgePadding) nextY = height + edgePadding;
            if (nextY > height + edgePadding) nextY = -edgePadding;

            velX[i] = nextVx;
            velY[i] = nextVy;
            posX[i] = nextX;
            posY[i] = nextY;
        }
    };

    const render = () => {
        context.clearRect(0, 0, width, height);

        const mouseRadius = animatedMouseRadius;

        if (hasPointer) {
            context.lineWidth = isPointerPressed ? 1.8 : 1.4;

            for (let ring = 1; ring <= 3; ring += 1) {
                context.strokeStyle = palette.ring[(isPointerPressed ? 58 : 44) - ring * 8]!;
                context.beginPath();
                context.arc(pointerX, pointerY, mouseRadius * 0.24 * ring, 0, Math.PI * 2);
                context.stroke();
            }

            for (let i = 0; i < count; i += 1) {
                const dx = posX[i]! - pointerX;
                const dy = posY[i]! - pointerY;
                pointerDistance[i] = Math.sqrt(dx * dx + dy * dy);
            }
        }

        // Connection lines, grouped by quantised alpha/width so each group is a single stroke.
        let lineCount = 0;

        for (let i = 0; i < count; i += 1) {
            const x = posX[i]!;
            const y = posY[i]!;

            for (let j = i + 1; j < count; j += 1) {
                const dx = x - posX[j]!;
                const dy = y - posY[j]!;
                const dSq = dx * dx + dy * dy;

                if (dSq >= connectionRadiusSq) continue;

                const pointerBoost = hasPointer
                    ? Math.max(0, 1 - Math.min(pointerDistance[i]!, pointerDistance[j]!) / mouseRadius)
                    : 0;
                const alpha = (1 - Math.sqrt(dSq) / connectionRadius) * 98 + 48 + pointerBoost * 52;
                const offset = lineCount * 4;

                lineCoords[offset] = x;
                lineCoords[offset + 1] = y;
                lineCoords[offset + 2] = posX[j]!;
                lineCoords[offset + 3] = posY[j]!;
                lineKeys[lineCount] =
                    alphaKey(alpha) * LINE_WIDTH_LEVELS + Math.round((pointerBoost * 1.2) / LINE_WIDTH_STEP);
                lineCount += 1;
            }
        }

        if (lineCount > 0) {
            groupByKey(lineKeys, lineCount, lineBuckets, lineOrder);

            let currentKey = -1;

            for (let index = 0; index < lineCount; index += 1) {
                const line = lineOrder[index]!;
                const key = lineKeys[line]!;

                if (key !== currentKey) {
                    if (currentKey !== -1) context.stroke();

                    currentKey = key;
                    context.strokeStyle = palette.line[alphaFromKey(Math.floor(key / LINE_WIDTH_LEVELS))]!;
                    context.lineWidth = 1.7 + (key % LINE_WIDTH_LEVELS) * LINE_WIDTH_STEP;
                    context.beginPath();
                }

                const offset = line * 4;
                context.moveTo(lineCoords[offset]!, lineCoords[offset + 1]!);
                context.lineTo(lineCoords[offset + 2]!, lineCoords[offset + 3]!);
            }

            context.stroke();
        }

        // Cursor-arrow boids, rotated by hand and grouped by quantised alpha into one fill per group.
        for (let i = 0; i < count; i += 1) {
            const pointerBoost = hasPointer ? Math.max(0, 1 - pointerDistance[i]! / mouseRadius) : 0;
            boidKeys[i] = alphaKey(188 + pointerBoost * 56);
        }

        groupByKey(boidKeys, count, boidBuckets, boidOrder);

        let currentKey = -1;

        for (let index = 0; index < count; index += 1) {
            const i = boidOrder[index]!;
            const key = boidKeys[i]!;

            if (key !== currentKey) {
                if (currentKey !== -1) context.fill();

                currentKey = key;
                context.fillStyle = palette.node[alphaFromKey(key)]!;
                context.beginPath();
            }

            const vx = velX[i]!;
            const vy = velY[i]!;
            const speed = Math.sqrt(vx * vx + vy * vy);
            const cos = speed === 0 ? 1 : vx / speed;
            const sin = speed === 0 ? 0 : vy / speed;
            const pulse = (Math.sin(stepCount * 0.018 + pulseOffset[i]!) + 1) * 0.5;
            const pointerBoost = hasPointer ? Math.max(0, 1 - pointerDistance[i]! / mouseRadius) : 0;
            const nodeSize = size[i]! + pulse * 3.6 + pointerBoost * 5.2;
            const halfHeight = nodeSize * 1.08 * 0.48;
            const cursorWidth = nodeSize * 0.38;
            const x = posX[i]!;
            const y = posY[i]!;
            // Local (a, b) maps to (x + a*cos - b*sin, y + a*sin + b*cos).
            const tip = cursorWidth * 0.72;
            const backTop = -cursorWidth * 0.52;
            const notch = -cursorWidth * 0.16;
            const backBottom = -cursorWidth * 0.54;

            context.moveTo(x + tip * cos, y + tip * sin);
            context.lineTo(x + backTop * cos + halfHeight * sin, y + backTop * sin - halfHeight * cos);
            context.lineTo(x + notch * cos, y + notch * sin);
            context.lineTo(x + backBottom * cos - halfHeight * sin, y + backBottom * sin + halfHeight * cos);
            context.closePath();
        }

        if (currentKey !== -1) context.fill();
    };

    // Fixed-step loop: physics advances `stepsPerSecond` times a second whatever the display rate.
    // Drawing is throttled separately (idleFps, or activeFps while the pointer is in use); frames in
    // between return immediately, so the canvas layer isn't re-rasterised or re-composited for them.
    const frame = (time: number) => {
        animationFrame = window.requestAnimationFrame(frame);

        const frameMs = time < activeUntil ? activeFrameMs : idleFrameMs;

        // Small tolerance so rAF jitter still lands on every Nth vsync.
        if (time - lastRender < frameMs * 0.9) return;

        if (lastTime < 0) {
            lastTime = time;
            accumulator = stepMs;
        } else {
            accumulator += Math.min(time - lastTime, stepMs * MAX_STEPS_PER_FRAME);
            lastTime = time;
        }

        let steps = 0;

        while (accumulator >= stepMs * 0.9 && steps < MAX_STEPS_PER_FRAME) {
            step();
            accumulator -= stepMs;
            steps += 1;
        }

        if (steps > 0) {
            lastRender = time;
            render();
        }
    };

    const isRunning = () => animationFrame !== 0;

    const start = () => {
        if (isRunning() || !isOnScreen || document.hidden) return;

        lastTime = -1;
        lastRender = -Infinity;
        animationFrame = window.requestAnimationFrame(frame);
    };

    const stop = () => {
        if (!isRunning()) return;

        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
    };

    const syncRunning = () => {
        if (isOnScreen && !document.hidden) start();
        else stop();
    };

    const resizeCanvas = () => {
        width = root.clientWidth;
        height = root.clientHeight;
        palette = getPalette();

        const pixelRatio = Math.min(window.devicePixelRatio || 1, boidsConfig.maxPixelRatio);
        canvas.width = Math.max(Math.floor(width * pixelRatio), 1);
        canvas.height = Math.max(Math.floor(height * pixelRatio), 1);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.lineCap = 'round';
        syncZones();
        resetBoids();

        // Resizing clears the canvas; redraw now so a paused (offscreen) canvas isn't left blank.
        render();
    };

    const syncPointer = (event: PointerEvent) => {
        const rect = root.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        hasPointer = !(x < 0 || y < 0 || x > rect.width || y > rect.height);
        pointerX = x;
        pointerY = y;

        if (hasPointer) activeUntil = event.timeStamp + boidsConfig.activeHoldMs;
    };

    const clearPointer = () => {
        hasPointer = false;
        isPointerPressed = false;
    };

    const pressPointer = (event: PointerEvent) => {
        isPointerPressed = true;
        syncPointer(event);
    };

    const releasePointer = () => {
        isPointerPressed = false;
    };

    root.append(canvas);

    const resizeObserver = new ResizeObserver(resizeCanvas);
    const zoneObserver = new ResizeObserver(syncZones);
    // Stop animating while the background is scrolled out of view or the tab is hidden.
    const visibilityObserver = new IntersectionObserver((entries) => {
        isOnScreen = entries[entries.length - 1]?.isIntersecting ?? isOnScreen;
        syncRunning();
    });

    resizeCanvas();
    resizeObserver.observe(root);
    avoidElements.forEach((element) => zoneObserver.observe(element));
    visibilityObserver.observe(root);
    document.addEventListener('visibilitychange', syncRunning);
    window.addEventListener('pointermove', syncPointer, { passive: true });
    window.addEventListener('pointerdown', pressPointer, { passive: true });
    window.addEventListener('pointerup', releasePointer, { passive: true });
    window.addEventListener('pointercancel', clearPointer, { passive: true });
    window.addEventListener('blur', clearPointer);
    start();

    return () => {
        stop();
        resizeObserver.disconnect();
        zoneObserver.disconnect();
        visibilityObserver.disconnect();
        document.removeEventListener('visibilitychange', syncRunning);
        window.removeEventListener('pointermove', syncPointer);
        window.removeEventListener('pointerdown', pressPointer);
        window.removeEventListener('pointerup', releasePointer);
        window.removeEventListener('pointercancel', clearPointer);
        window.removeEventListener('blur', clearPointer);
        canvas.remove();
    };
};
