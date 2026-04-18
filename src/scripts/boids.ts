import p5 from 'p5';
import { boidsConfig, boidsPaletteFallbacks } from '../data/boids';

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
    isLeader: boolean;
};

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

const cssColorToRgb = (value: string, fallback: string): [number, number, number] => {
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

const getPalette = () => {
    const styles = getComputedStyle(document.documentElement);

    return {
        node: cssColorToRgb(styles.getPropertyValue('--boids-node'), boidsPaletteFallbacks.node),
        line: cssColorToRgb(styles.getPropertyValue('--boids-line'), boidsPaletteFallbacks.line),
        ring: cssColorToRgb(styles.getPropertyValue('--boids-ring'), boidsPaletteFallbacks.ring),
        leader: cssColorToRgb(styles.getPropertyValue('--primary'), boidsPaletteFallbacks.leader),
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
        const desired = Math.round(area * boidsConfig.boidAreaDensity);

        if (window.innerWidth < boidsConfig.mobileBreakpoint) {
            return Math.min(Math.max(desired, boidsConfig.minBoidsMobile), boidsConfig.maxBoidsMobile);
        }

        return Math.min(Math.max(desired, boidsConfig.minBoidsDesktop), boidsConfig.maxBoidsDesktop);
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
        isLeader: Math.random() < boidsConfig.leaderRatio,
    });

    const resetBoids = () => {
        boids = Array.from({ length: getBoidCount() }, createBoid);
    };

    const wrapEdges = (boid: Boid) => {
        if (boid.position.x < -boidsConfig.edgePadding) boid.position.x = width + boidsConfig.edgePadding;
        if (boid.position.x > width + boidsConfig.edgePadding) boid.position.x = -boidsConfig.edgePadding;
        if (boid.position.y < -boidsConfig.edgePadding) boid.position.y = height + boidsConfig.edgePadding;
        if (boid.position.y > height + boidsConfig.edgePadding) boid.position.y = -boidsConfig.edgePadding;
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

            if (d > 0 && d < boidsConfig.separationRadius) {
                const diff = divide(subtract(boid.position, other.position), d * d);
                separation = add(separation, diff);
                separationTotal += 1;
            }

            if (d > 0 && d < boidsConfig.neighborRadius) {
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
        let animatedMouseRadius = boidsConfig.mouseRadius;

        const getMouseRadiusTarget = () =>
            instance.mouseIsPressed
                ? boidsConfig.mouseRadius * boidsConfig.mousePressRadiusMultiplier
                : boidsConfig.mouseRadius;

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
            const [nr, ng, nb] = palette.node;
            const [lr, lg, lb] = palette.line;
            const [rr, rg, rb] = palette.ring;
            const [pr, pg, pb] = palette.leader;

            if (pointer) {
                for (let ring = 1; ring <= 3; ring += 1) {
                    const alpha = (instance.mouseIsPressed ? 58 : 44) - ring * 8;
                    instance.stroke(rr, rg, rb, alpha);
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

                    if (d < boidsConfig.connectionRadius) {
                        const pointerBoost = pointer
                            ? Math.max(
                                  0,
                                  1 - Math.min(distance(boid.position, pointer), distance(other.position, pointer)) / animatedMouseRadius,
                              )
                            : 0;
                        const alpha = ((1 - d / boidsConfig.connectionRadius) * 98) + 48 + pointerBoost * 52;
                        instance.stroke(lr, lg, lb, alpha);
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
                const nodeSize = boid.size + pulse * 3.6 + pointerBoost * 5.2;
                const cursorHeight = nodeSize * 1.08;
                const cursorWidth = nodeSize * 0.38;
                const fillColor = [nr, ng, nb];

                instance.push();
                instance.translate(boid.position.x, boid.position.y);
                instance.rotate(angle);
                instance.noStroke();
                instance.fill(fillColor[0], fillColor[1], fillColor[2], 188 + pointerBoost * 56);
                instance.beginShape();
                instance.vertex(cursorWidth * 0.72, 0);
                instance.vertex(-cursorWidth * 0.52, -cursorHeight * 0.48);
                instance.vertex(-cursorWidth * 0.16, 0);
                instance.vertex(-cursorWidth * 0.54, cursorHeight * 0.48);
                instance.endShape(instance.CLOSE);
                instance.pop();
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
