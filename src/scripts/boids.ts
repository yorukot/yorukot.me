import p5 from 'p5';

type Vector = {
    x: number;
    y: number;
};

type Boid = {
    position: Vector;
    velocity: Vector;
    acceleration: Vector;
    maxSpeed: number;
    maxForce: number;
    size: number;
    pulseOffset: number;
};

const MOBILE_BREAKPOINT = 768;
const EDGE_PADDING = 32;
const NEIGHBOR_RADIUS = 80;
const SEPARATION_RADIUS = 68;
const CONNECTION_RADIUS = 96;
const MOUSE_RADIUS = 220;
const MOUSE_PRESS_RADIUS_MULTIPLIER = 1.45;
const BOID_AREA_DENSITY = 1 / 22000;
const MIN_BOIDS_MOBILE = 22;
const MAX_BOIDS_MOBILE = 54;
const MIN_BOIDS_DESKTOP = 34;
const MAX_BOIDS_DESKTOP = 96;
const createVector = (x = 0, y = 0): Vector => ({ x, y });

const add = (a: Vector, b: Vector): Vector => ({ x: a.x + b.x, y: a.y + b.y });

const subtract = (a: Vector, b: Vector): Vector => ({ x: a.x - b.x, y: a.y - b.y });

const multiply = (vector: Vector, value: number): Vector => ({
    x: vector.x * value,
    y: vector.y * value,
});

const divide = (vector: Vector, value: number): Vector =>
    value === 0 ? createVector() : { x: vector.x / value, y: vector.y / value };

const magnitude = (vector: Vector): number => Math.hypot(vector.x, vector.y);

const normalize = (vector: Vector): Vector => {
    const length = magnitude(vector);

    return length === 0 ? createVector() : divide(vector, length);
};

const setMagnitude = (vector: Vector, value: number): Vector =>
    multiply(normalize(vector), value);

const limit = (vector: Vector, max: number): Vector => {
    const length = magnitude(vector);

    return length > max ? setMagnitude(vector, max) : vector;
};

const distance = (a: Vector, b: Vector): number => Math.hypot(a.x - b.x, a.y - b.y);

const hexToRgb = (value: string): [number, number, number] => {
    const normalized = value.trim().replace('#', '');
    const safeHex = normalized.length === 3
        ? normalized
              .split('')
              .map((char) => `${char}${char}`)
              .join('')
        : normalized.padEnd(6, '0').slice(0, 6);

    return [
        Number.parseInt(safeHex.slice(0, 2), 16),
        Number.parseInt(safeHex.slice(2, 4), 16),
        Number.parseInt(safeHex.slice(4, 6), 16),
    ];
};

const getPalette = () => {
    const styles = getComputedStyle(document.documentElement);

    return {
        text: hexToRgb(styles.getPropertyValue('--text') || '#c7c7c7'),
        border: hexToRgb(styles.getPropertyValue('--border') || '#303030'),
    };
};

export const mountBoids = (root: HTMLElement) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return () => {};
    }

    let boids: Boid[] = [];
    let width = root.clientWidth;
    let height = root.clientHeight;
    let palette = getPalette();

    const getBoidCount = () => {
        const area = Math.max(width * height, 1);
        const desired = Math.round(area * BOID_AREA_DENSITY);

        if (window.innerWidth < MOBILE_BREAKPOINT) {
            return Math.min(Math.max(desired, MIN_BOIDS_MOBILE), MAX_BOIDS_MOBILE);
        }

        return Math.min(Math.max(desired, MIN_BOIDS_DESKTOP), MAX_BOIDS_DESKTOP);
    };

    const createBoid = (): Boid => ({
        position: createVector(Math.random() * width, Math.random() * height),
        velocity: setMagnitude(
            createVector(Math.random() * 2 - 1, Math.random() * 2 - 1),
            0.85 + Math.random() * 0.65,
        ),
        acceleration: createVector(),
        maxSpeed: 1.45 + Math.random() * 0.55,
        maxForce: 0.03 + Math.random() * 0.02,
        size: 24 + Math.random() * 14,
        pulseOffset: Math.random() * Math.PI * 2,
    });

    const resetBoids = () => {
        boids = Array.from({ length: getBoidCount() }, createBoid);
    };

    const wrapEdges = (boid: Boid) => {
        if (boid.position.x < -EDGE_PADDING) boid.position.x = width + EDGE_PADDING;
        if (boid.position.x > width + EDGE_PADDING) boid.position.x = -EDGE_PADDING;
        if (boid.position.y < -EDGE_PADDING) boid.position.y = height + EDGE_PADDING;
        if (boid.position.y > height + EDGE_PADDING) boid.position.y = -EDGE_PADDING;
    };

    const flock = (boid: Boid, pointer: Vector | null, mouseRadius: number) => {
        let separation = createVector();
        let alignment = createVector();
        let cohesion = createVector();
        let total = 0;
        let separationTotal = 0;

        for (const other of boids) {
            if (other === boid) continue;

            const d = distance(boid.position, other.position);

            if (d > 0 && d < SEPARATION_RADIUS) {
                const diff = divide(subtract(boid.position, other.position), d * d);
                separation = add(separation, diff);
                separationTotal += 1;
            }

            if (d > 0 && d < NEIGHBOR_RADIUS) {
                alignment = add(alignment, other.velocity);
                cohesion = add(cohesion, other.position);
                total += 1;
            }
        }

        if (separationTotal > 0) {
            separation = divide(separation, separationTotal);
            separation = setMagnitude(separation, boid.maxSpeed);
            separation = subtract(separation, boid.velocity);
            separation = limit(separation, boid.maxForce * 1.4);
        }

        if (total > 0) {
            alignment = divide(alignment, total);
            alignment = setMagnitude(alignment, boid.maxSpeed);
            alignment = subtract(alignment, boid.velocity);
            alignment = limit(alignment, boid.maxForce);

            cohesion = divide(cohesion, total);
            cohesion = subtract(cohesion, boid.position);
            cohesion = setMagnitude(cohesion, boid.maxSpeed);
            cohesion = subtract(cohesion, boid.velocity);
            cohesion = limit(cohesion, boid.maxForce * 0.8);
        }

        let mouseForce = createVector();

        if (pointer) {
            const d = distance(boid.position, pointer);

            if (d < mouseRadius) {
                const direction = subtract(pointer, boid.position);
                const pull = 1 - d / mouseRadius;
                mouseForce = setMagnitude(direction, boid.maxSpeed * (0.2 + pull * 0.45));
                mouseForce = subtract(mouseForce, boid.velocity);
                mouseForce = limit(mouseForce, boid.maxForce * (0.65 + pull * 1.1));

                if (d < 58) {
                    const repel = setMagnitude(subtract(boid.position, pointer), boid.maxSpeed);
                    mouseForce = add(mouseForce, limit(subtract(repel, boid.velocity), boid.maxForce * 1.35));
                }
            }
        }

        boid.acceleration = createVector();
        boid.acceleration = add(boid.acceleration, multiply(separation, 2.15));
        boid.acceleration = add(boid.acceleration, multiply(alignment, 0.92));
        boid.acceleration = add(boid.acceleration, multiply(cohesion, 0.3));
        boid.acceleration = add(boid.acceleration, mouseForce);
    };

    resetBoids();

    const sketch = (instance: p5) => {
        let animatedMouseRadius = MOUSE_RADIUS;

        const getMouseRadiusTarget = () =>
            instance.mouseIsPressed
                ? MOUSE_RADIUS * MOUSE_PRESS_RADIUS_MULTIPLIER
                : MOUSE_RADIUS;

        const getPointer = (): Vector | null => {
            if (instance.mouseX < 0 || instance.mouseY < 0 || instance.mouseX > width || instance.mouseY > height) {
                return null;
            }

            return createVector(instance.mouseX, instance.mouseY);
        };

        instance.setup = () => {
            const canvas = instance.createCanvas(width, height);
            canvas.parent(root);
            instance.pixelDensity(Math.min(window.devicePixelRatio, 1.5));
            instance.noFill();
            instance.strokeCap(instance.ROUND);
        };

        instance.windowResized = () => {
            width = root.clientWidth;
            height = root.clientHeight;
            palette = getPalette();
            instance.resizeCanvas(width, height);
            resetBoids();
        };

        instance.draw = () => {
            instance.clear();

            const pointer = getPointer();
            const mouseRadiusTarget = getMouseRadiusTarget();
            animatedMouseRadius = instance.lerp(
                animatedMouseRadius,
                mouseRadiusTarget,
                instance.mouseIsPressed ? 0.18 : 0.14,
            );
            const [tr, tg, tb] = palette.text;
            const [br, bg, bb] = palette.border;
            const lineColor = [
                Math.round(br + (tr - br) * 0.72),
                Math.round(bg + (tg - bg) * 0.72),
                Math.round(bb + (tb - bb) * 0.72),
            ] as const;

            if (pointer) {
                for (let ring = 1; ring <= 3; ring += 1) {
                    const alpha = (instance.mouseIsPressed ? 58 : 44) - ring * 8;
                    instance.stroke(tr, tg, tb, alpha);
                    instance.strokeWeight(instance.mouseIsPressed ? 1.8 : 1.4);
                    instance.circle(pointer.x, pointer.y, animatedMouseRadius * 0.48 * ring);
                }
            }

            for (const boid of boids) {
                flock(boid, pointer, animatedMouseRadius);
                boid.velocity = add(boid.velocity, boid.acceleration);
                boid.velocity = limit(boid.velocity, boid.maxSpeed);
                boid.position = add(boid.position, boid.velocity);
                wrapEdges(boid);
            }

            for (let index = 0; index < boids.length; index += 1) {
                const boid = boids[index];

                for (let inner = index + 1; inner < boids.length; inner += 1) {
                    const other = boids[inner];
                    const d = distance(boid.position, other.position);

                    if (d < CONNECTION_RADIUS) {
                        const pointerBoost = pointer
                            ? Math.max(
                                  0,
                                  1 - Math.min(distance(boid.position, pointer), distance(other.position, pointer)) / animatedMouseRadius,
                              )
                            : 0;
                        const alpha = ((1 - d / CONNECTION_RADIUS) * 98) + 48 + pointerBoost * 52;
                        instance.stroke(lineColor[0], lineColor[1], lineColor[2], alpha);
                        instance.strokeWeight(1.7 + pointerBoost * 1.2);
                        instance.line(
                            boid.position.x,
                            boid.position.y,
                            other.position.x,
                            other.position.y,
                        );
                    }
                }
            }

            for (const boid of boids) {
                const heading = normalize(boid.velocity);
                const angle = Math.atan2(heading.y, heading.x);
                const pulse = (Math.sin(instance.frameCount * 0.018 + boid.pulseOffset) + 1) * 0.5;
                const pointerBoost = pointer
                    ? Math.max(0, 1 - distance(boid.position, pointer) / animatedMouseRadius)
                    : 0;
                const glyphAlpha = 182 + pulse * 26 + pointerBoost * 72;
                const dotAlpha = 136 + pointerBoost * 96;
                const nodeSize = boid.size + pulse * 3.6 + pointerBoost * 5.2;
                const cursorHeight = nodeSize * 1.08;
                const cursorWidth = nodeSize * 0.38;

                instance.push();
                instance.translate(boid.position.x, boid.position.y);
                instance.rotate(angle);
                instance.noStroke();
                instance.fill(tr, tg, tb, 188 + pointerBoost * 56);
                instance.beginShape();
                instance.vertex(cursorWidth * 0.72, 0);
                instance.vertex(-cursorWidth * 0.52, -cursorHeight * 0.48);
                instance.vertex(-cursorWidth * 0.16, 0);
                instance.vertex(-cursorWidth * 0.54, cursorHeight * 0.48);
                instance.endShape(instance.CLOSE);
                instance.pop();

                instance.stroke(tr, tg, tb, dotAlpha);
                instance.strokeWeight(5.8 + pointerBoost * 2.2);
                instance.point(boid.position.x, boid.position.y);
            }
        };
    };

    const app = new p5(sketch);
    const resizeObserver = new ResizeObserver(() => {
        width = root.clientWidth;
        height = root.clientHeight;
        palette = getPalette();
        app.resizeCanvas(width, height);
    });

    resizeObserver.observe(root);

    return () => {
        resizeObserver.disconnect();
        app.remove();
    };
};
