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

    const getBoidCount = () => (window.innerWidth < MOBILE_BREAKPOINT ? 28 : 64);

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

    const flock = (boid: Boid, pointer: Vector | null) => {
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

            if (d < MOUSE_RADIUS) {
                const direction = subtract(pointer, boid.position);
                const pull = 1 - d / MOUSE_RADIUS;
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
            const [tr, tg, tb] = palette.text;
            const [br, bg, bb] = palette.border;

            if (pointer) {
                for (let ring = 1; ring <= 3; ring += 1) {
                    const alpha = 44 - ring * 8;
                    instance.stroke(tr, tg, tb, alpha);
                    instance.strokeWeight(1.4);
                    instance.circle(pointer.x, pointer.y, MOUSE_RADIUS * 0.48 * ring);
                }
            }

            for (const boid of boids) {
                flock(boid, pointer);
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
                                  1 - Math.min(distance(boid.position, pointer), distance(other.position, pointer)) / MOUSE_RADIUS,
                              )
                            : 0;
                        const alpha = ((1 - d / CONNECTION_RADIUS) * 58) + 18 + pointerBoost * 34;
                        instance.stroke(br, bg, bb, alpha);
                        instance.strokeWeight(1.3 + pointerBoost * 1);
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
                    ? Math.max(0, 1 - distance(boid.position, pointer) / MOUSE_RADIUS)
                    : 0;
                const glyphAlpha = 128 + pulse * 20 + pointerBoost * 56;
                const dotAlpha = 84 + pointerBoost * 72;
                const nodeSize = boid.size + pulse * 3.6 + pointerBoost * 5.2;
                const cursorHeight = nodeSize;
                const cursorWidth = nodeSize * 0.56;

                instance.push();
                instance.translate(boid.position.x, boid.position.y);
                instance.rotate(angle);
                instance.noStroke();
                instance.fill(tr, tg, tb, 28 + pointerBoost * 24);
                instance.beginShape();
                instance.vertex(cursorWidth * 0.55, 0);
                instance.vertex(-cursorWidth * 0.45, -cursorHeight * 0.42);
                instance.vertex(-cursorWidth * 0.12, 0);
                instance.vertex(-cursorWidth * 0.46, cursorHeight * 0.42);
                instance.endShape(instance.CLOSE);
                instance.stroke(tr, tg, tb, glyphAlpha);
                instance.strokeWeight(1.6 + pointerBoost * 0.4);
                instance.noFill();
                instance.beginShape();
                instance.vertex(cursorWidth * 0.55, 0);
                instance.vertex(-cursorWidth * 0.45, -cursorHeight * 0.42);
                instance.vertex(-cursorWidth * 0.12, 0);
                instance.vertex(-cursorWidth * 0.46, cursorHeight * 0.42);
                instance.endShape(instance.CLOSE);
                instance.pop();

                instance.stroke(tr, tg, tb, dotAlpha);
                instance.strokeWeight(4.8 + pointerBoost * 1.8);
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
