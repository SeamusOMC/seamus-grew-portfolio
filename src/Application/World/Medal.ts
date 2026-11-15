import * as THREE from 'three';
// @ts-ignore
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { MEDAL } from './SetupConfig';

/**
 * Belfast City Marathon finisher's medal on a small stand.
 *
 * The medal is a cut-out design: a ring lettered MARATHON, sweeping arches,
 * and a skyline of City Hall, a church and the Albert Clock standing on a
 * name plate. It is drawn in "medal units", where the ring has a radius of
 * 100, with x to the right and y up.
 *
 * Each solid part is described once as an outline. The outlines are extruded
 * to make the metal body, and the same outlines are painted, with their
 * engraved detail, onto the texture that covers the front.
 */

type Point = [number, number];
type Outline = Point[];

// Medal units to world units
const UNIT = 1.5;
// Half the width of the square the artwork is drawn in, in medal units
const EXTENT = 104;
const TEXTURE_SIZE = 1024;

const RING_OUTER = 100;
const RING_INNER = 86;
const PLATE = { left: -100, right: 100, bottom: -98, top: -58, radius: 5 };
// The line the buildings stand on, and the top of City Hall's main block
const GROUND = PLATE.top;
const ROOF = -22;

const rect = (x0: number, y0: number, x1: number, y1: number): Outline => [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
];

/**
 * A dome: half a circle sitting on a flat base
 */
const dome = (cx: number, cy: number, radius: number): Outline => {
    const points: Outline = [];
    for (let i = 0; i <= 18; i++) {
        const angle = (i / 18) * Math.PI;
        points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
    }
    return points;
};

/**
 * A curved band of even width following a quadratic curve
 */
const band = (from: Point, control: Point, to: Point, width: number): Outline => {
    const upper: Outline = [];
    const lower: Outline = [];
    const steps = 28;
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const u = 1 - t;
        const x = u * u * from[0] + 2 * u * t * control[0] + t * t * to[0];
        const y = u * u * from[1] + 2 * u * t * control[1] + t * t * to[1];
        const dx = 2 * u * (control[0] - from[0]) + 2 * t * (to[0] - control[0]);
        const dy = 2 * u * (control[1] - from[1]) + 2 * t * (to[1] - control[1]);
        const length = Math.hypot(dx, dy) || 1;
        const nx = (-dy / length) * (width / 2);
        const ny = (dx / length) * (width / 2);
        upper.push([x + nx, y + ny]);
        lower.push([x - nx, y - ny]);
    }
    return upper.concat(lower.reverse());
};

// The sweeping arches behind the skyline
const ARCHES: { from: Point; control: Point; to: Point }[] = [
    { from: [-84, -40], control: [-62, 78], to: [34, 72] },
    { from: [-70, -50], control: [-40, 52], to: [62, 52] },
    { from: [-52, -52], control: [-10, 30], to: [78, 22] },
];

const archOutlines = () =>
    ARCHES.map((arch) => band(arch.from, arch.control, arch.to, 6));

const buildingOutlines = (): Outline[] => {
    const outlines: Outline[] = [
        // City Hall: main block, portico and pediment
        rect(-80, GROUND, 80, ROOF),
        [
            [-21, ROOF],
            [-21, -15],
            [0, -6],
            [21, -15],
            [21, ROOF],
        ],
        // Central dome on its drum, with a lantern and finial
        rect(-12, ROOF, 12, 4),
        dome(0, 4, 14),
        rect(-3.5, 17, 3.5, 25),
        [
            [-3.5, 25],
            [0, 33],
            [3.5, 25],
        ],
        // Church: gabled front with a small spirelet
        [
            [15, ROOF],
            [15, 24],
            [26, 39],
            [37, 24],
            [37, ROOF],
        ],
        rect(24.8, 38, 27.2, 47),
        // Albert Clock: shaft, clock stage, spire and finial
        rect(40, ROOF, 54, 40),
        rect(37, 40, 57, 57),
        [
            [38, 57],
            [47, 82],
            [56, 57],
        ],
        rect(46, 80, 48, 87),
    ];

    for (const side of [-1, 1]) {
        // Corner towers with small domes
        const x = side * 70;
        outlines.push(rect(x - 8, ROOF, x + 8, 3));
        outlines.push(dome(x, 3, 8.5));
        outlines.push([
            [x - 2, 11],
            [x, 18],
            [x + 2, 11],
        ]);
        // Pavilions between the towers and the portico
        const p = side * 42;
        outlines.push([
            [p - 8, ROOF],
            [p - 8, -15],
            [p, -9],
            [p + 8, -15],
            [p + 8, ROOF],
        ]);
    }
    return outlines;
};

export default class Medal {
    group: THREE.Group;

    constructor() {
        this.group = new THREE.Group();
        this.group.position.copy(MEDAL.position);
        this.group.rotation.y = MEDAL.rotationY;
        this.group.scale.setScalar(MEDAL.scale);

        const top = 560;
        const hangZ = 95;
        const centreY = 24 + 16 + -PLATE.bottom * UNIT;

        this.createStand(top, hangZ);
        this.createRibbon(top, centreY + (RING_OUTER + 7) * UNIT, hangZ);

        const medal = this.createMedal();
        medal.position.set(0, centreY, hangZ);
        medal.scale.setScalar(UNIT);
        this.group.add(medal);
    }

    createStand(top: number, hangZ: number) {
        const steel = new THREE.MeshStandardMaterial({
            color: 0x1b1c1f,
            roughness: 0.45,
            metalness: 0.5,
        });
        const base = new THREE.Mesh(
            new RoundedBoxGeometry(260, 24, 200, 3, 10),
            steel
        );
        base.position.set(0, 12, 30);
        base.receiveShadow = true;

        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(9, 9, top, 16),
            steel
        );
        post.position.set(0, top / 2, 0);
        const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 8, hangZ + 10, 16),
            steel
        );
        arm.rotation.x = Math.PI / 2;
        arm.position.set(0, top, hangZ / 2);
        const bar = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 8, 150, 16),
            steel
        );
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0, top, hangZ);

        for (const part of [base, post, arm, bar]) {
            part.castShadow = true;
            this.group.add(part);
        }
    }

    /**
     * Two strands of striped ribbon running from the stand down to the medal
     */
    createRibbon(top: number, bottom: number, hangZ: number) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = MEDAL.ribbonColor;
            context.fillRect(0, 0, 64, 256);
            // Lighter diagonal stripes
            context.strokeStyle = MEDAL.ribbonStripe;
            context.lineWidth = 14;
            for (let y = -64; y < 320; y += 56) {
                context.beginPath();
                context.moveTo(-8, y + 40);
                context.lineTo(72, y);
                context.stroke();
            }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.85,
            side: THREE.DoubleSide,
        });

        const drop = top - bottom;
        const spread = 46;
        const length = Math.hypot(drop, spread);
        for (const side of [-1, 1]) {
            const strand = new THREE.Mesh(
                new THREE.BoxGeometry(66, length, 4),
                material
            );
            strand.position.set((side * spread) / 2, top - drop / 2, hangZ + side * 3);
            strand.rotation.z = side * Math.atan2(spread, drop);
            strand.castShadow = true;
            this.group.add(strand);
        }
    }

    createMedal() {
        const medal = new THREE.Group();
        const silver = new THREE.MeshStandardMaterial({
            color: 0xc4c8ce,
            roughness: 0.35,
            metalness: 0.45,
        });

        const extrude = (shape: THREE.Shape, depth: number) => {
            const mesh = new THREE.Mesh(
                new THREE.ExtrudeGeometry(shape, {
                    depth,
                    bevelEnabled: false,
                    curveSegments: 48,
                }),
                silver
            );
            mesh.position.z = -depth / 2;
            mesh.castShadow = true;
            medal.add(mesh);
        };
        const toShape = (outline: Outline) =>
            new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));

        // Ring
        const ring = new THREE.Shape();
        ring.absarc(0, 0, RING_OUTER, 0, Math.PI * 2, false);
        const hole = new THREE.Path();
        hole.absarc(0, 0, RING_INNER, 0, Math.PI * 2, true);
        ring.holes.push(hole);
        extrude(ring, 7);

        // Loop the ribbon passes through
        extrude(toShape(rect(-20, RING_OUTER - 2, 20, RING_OUTER + 9)), 5);

        // Arches sit furthest back, the skyline in front, the name plate proud
        for (const outline of archOutlines()) extrude(toShape(outline), 4);
        for (const outline of buildingOutlines()) extrude(toShape(outline), 6);
        extrude(
            toShape(rect(PLATE.left, PLATE.bottom, PLATE.right, PLATE.top)),
            9
        );

        // The engraved front
        const face = new THREE.Mesh(
            new THREE.PlaneGeometry(EXTENT * 2, EXTENT * 2),
            new THREE.MeshStandardMaterial({
                map: this.createFaceTexture(),
                alphaTest: 0.5,
                roughness: 0.38,
                metalness: 0.3,
            })
        );
        face.position.z = 4.7;
        medal.add(face);

        return medal;
    }

    createFaceTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = TEXTURE_SIZE;
        canvas.height = TEXTURE_SIZE;
        const context = canvas.getContext('2d');
        if (context) this.paintFace(context);
        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        texture.anisotropy = 8;
        return texture;
    }

    paintFace(ctx: CanvasRenderingContext2D) {
        const k = TEXTURE_SIZE / (EXTENT * 2);
        const X = (x: number) => (x + EXTENT) * k;
        const Y = (y: number) => (EXTENT - y) * k;

        const INK = '#555a62';
        const SHADE = '#868b93';

        const trace = (outline: Outline) => {
            ctx.beginPath();
            outline.forEach(([x, y], i) => {
                if (i === 0) ctx.moveTo(X(x), Y(y));
                else ctx.lineTo(X(x), Y(y));
            });
            ctx.closePath();
        };
        const line = (x0: number, y0: number, x1: number, y1: number, width = 0.5) => {
            ctx.lineWidth = width * k;
            ctx.beginPath();
            ctx.moveTo(X(x0), Y(y0));
            ctx.lineTo(X(x1), Y(y1));
            ctx.stroke();
        };
        const block = (x0: number, y0: number, x1: number, y1: number) => {
            ctx.fillRect(X(x0), Y(y1), (x1 - x0) * k, (y1 - y0) * k);
        };
        const circle = (x: number, y: number, radius: number) => {
            ctx.beginPath();
            ctx.arc(X(x), Y(y), radius * k, 0, Math.PI * 2);
        };
        const text = (
            value: string,
            x: number,
            y: number,
            size: number,
            spacing = 0
        ) => {
            ctx.font = `bold ${size * k}px Arial, Helvetica, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (!spacing) {
                ctx.fillText(value, X(x), Y(y));
                return;
            }
            // Letter-spaced: place each character by hand
            const widths = value.split('').map((c) => ctx.measureText(c).width);
            const total = widths.reduce((a, b) => a + b, 0) + spacing * k * (value.length - 1);
            let cursor = X(x) - total / 2;
            value.split('').forEach((c, i) => {
                ctx.fillText(c, cursor + widths[i] / 2, Y(y));
                cursor += widths[i] + spacing * k;
            });
        };

        const metal = (light: string, dark: string) => {
            const gradient = ctx.createLinearGradient(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
            gradient.addColorStop(0, light);
            gradient.addColorStop(0.5, dark);
            gradient.addColorStop(1, light);
            return gradient;
        };

        ctx.lineJoin = 'round';

        // ------------------------------------------------------------ arches
        for (const outline of archOutlines()) {
            trace(outline);
            ctx.fillStyle = metal('#dfe2e6', '#a9aeb5');
            ctx.fill();
            ctx.strokeStyle = INK;
            ctx.lineWidth = 0.5 * k;
            ctx.stroke();
        }
        // A bright line along the middle of each arch
        ctx.strokeStyle = '#f6f7f8';
        ctx.lineWidth = 1 * k;
        for (const arch of ARCHES) {
            ctx.beginPath();
            ctx.moveTo(X(arch.from[0]), Y(arch.from[1]));
            ctx.quadraticCurveTo(
                X(arch.control[0]),
                Y(arch.control[1]),
                X(arch.to[0]),
                Y(arch.to[1])
            );
            ctx.stroke();
        }

        // -------------------------------------------------------------- ring
        ctx.beginPath();
        ctx.arc(X(0), Y(0), RING_OUTER * k, 0, Math.PI * 2);
        ctx.arc(X(0), Y(0), RING_INNER * k, 0, Math.PI * 2, true);
        ctx.fillStyle = metal('#f2f3f5', '#b4b8be');
        ctx.fill('evenodd');
        ctx.strokeStyle = INK;
        ctx.lineWidth = 0.6 * k;
        for (const radius of [RING_OUTER - 1, RING_INNER + 1]) {
            circle(0, 0, radius);
            ctx.stroke();
        }
        // Ribbon loop
        trace(rect(-20, RING_OUTER - 2, 20, RING_OUTER + 9));
        ctx.fill();
        ctx.fillStyle = SHADE;
        block(-15, RING_OUTER + 2, 15, RING_OUTER + 5.5);

        // MARATHON around the upper left of the ring
        ctx.fillStyle = INK;
        ctx.font = `bold ${10 * k}px Arial, Helvetica, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const word = 'MARATHON';
        const radius = (RING_OUTER + RING_INNER) / 2;
        word.split('').forEach((letter, i) => {
            const angle = (158 - i * 8.2) * (Math.PI / 180);
            ctx.save();
            ctx.translate(X(radius * Math.cos(angle)), Y(radius * Math.sin(angle)));
            ctx.rotate(Math.PI / 2 - angle);
            ctx.fillText(letter, 0, 0);
            ctx.restore();
        });

        // --------------------------------------------------------- buildings
        for (const outline of buildingOutlines()) {
            trace(outline);
            ctx.fillStyle = metal('#eef0f2', '#bfc3c9');
            ctx.fill();
            ctx.strokeStyle = INK;
            ctx.lineWidth = 0.55 * k;
            ctx.stroke();
        }

        ctx.strokeStyle = INK;
        ctx.fillStyle = SHADE;

        // City Hall: cornices, two rows of windows, balustrade
        line(-80, -40, 80, -40, 0.6);
        line(-80, -25.5, 80, -25.5, 0.6);
        line(-80, -55, 80, -55, 0.5);
        for (let x = -75; x <= 75; x += 6) {
            if (Math.abs(x) < 23) continue;
            block(x - 1.6, -53, x + 1.6, -43);
            block(x - 1.6, -38, x + 1.6, -29);
            line(x + 3, ROOF, x + 3, -25.5, 0.3);
        }
        // Portico: columns, steps and the door
        for (let x = -18; x <= 18; x += 6) line(x, -54, x, -17, 0.9);
        line(-21, -15, 21, -15, 0.6);
        line(-21, -55.5, 21, -55.5, 0.9);
        block(-2.5, -54, 2.5, -44);
        circle(0, -11.5, 2.2);
        ctx.stroke();

        // Pavilions and corner towers
        for (const side of [-1, 1]) {
            const p = side * 42;
            line(p - 8, -15, p + 8, -15, 0.5);
            block(p - 1.5, -21, p + 1.5, -16.5);
            const x = side * 70;
            line(x - 8, -2, x + 8, -2, 0.5);
            line(x - 8, -12, x + 8, -12, 0.5);
            block(x - 1.5, -10.5, x + 1.5, -4);
            for (const offset of [-4, 0, 4]) {
                ctx.lineWidth = 0.35 * k;
                ctx.beginPath();
                ctx.moveTo(X(x + offset), Y(3));
                ctx.quadraticCurveTo(X(x + offset * 0.7), Y(9), X(x), Y(11.5));
                ctx.stroke();
            }
        }

        // Central dome: drum columns, ribs and lantern
        line(-12, 0.5, 12, 0.5, 0.6);
        line(-12, -18, 12, -18, 0.5);
        for (let x = -9; x <= 9; x += 3.6) line(x, -17, x, 0, 0.5);
        for (const offset of [-9, -4.5, 0, 4.5, 9]) {
            ctx.lineWidth = 0.4 * k;
            ctx.beginPath();
            ctx.moveTo(X(offset), Y(4));
            ctx.quadraticCurveTo(X(offset * 0.75), Y(13), X(0), Y(18));
            ctx.stroke();
        }
        block(-1.2, 18.5, 1.2, 23.5);

        // Church: rose window, lancets and door
        circle(26, 24, 4.6);
        ctx.fill();
        ctx.stroke();
        line(21.4, 24, 30.6, 24, 0.3);
        line(26, 19.4, 26, 28.6, 0.3);
        for (const x of [20, 26, 32]) block(x - 1.4, -2, x + 1.4, 12);
        block(23, GROUND + 1, 29, -12);
        line(15, -8, 37, -8, 0.4);

        // Albert Clock: face, belfry openings, bands and windows
        ctx.fillStyle = '#f4f5f6';
        circle(47, 48.5, 6);
        ctx.fill();
        ctx.stroke();
        line(47, 48.5, 47, 53, 0.6);
        line(47, 48.5, 50, 47, 0.6);
        ctx.fillStyle = SHADE;
        line(37, 41.5, 57, 41.5, 0.5);
        line(37, 55.5, 57, 55.5, 0.5);
        for (const y of [20, 0, -40]) line(40, y, 54, y, 0.5);
        for (const y of [24, 4]) {
            block(43, y, 45.4, y + 12);
            block(48.6, y, 51, y + 12);
        }
        block(44, GROUND + 1, 50, -44);
        block(44.5, -36, 49.5, -24);
        line(47, 60, 47, 78, 0.4);
        line(42.5, 64, 51.5, 64, 0.35);

        // --------------------------------------------------------- name plate
        const plate = PLATE;
        ctx.beginPath();
        const r = plate.radius * k;
        const px = X(plate.left);
        const py = Y(plate.top);
        const pw = (plate.right - plate.left) * k;
        const ph = (plate.top - plate.bottom) * k;
        ctx.moveTo(px + r, py);
        ctx.arcTo(px + pw, py, px + pw, py + ph, r);
        ctx.arcTo(px + pw, py + ph, px, py + ph, r);
        ctx.arcTo(px, py + ph, px, py, r);
        ctx.arcTo(px, py, px + pw, py, r);
        ctx.closePath();
        ctx.fillStyle = metal('#f4f5f7', '#b9bdc3');
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 0.8 * k;
        ctx.stroke();
        ctx.lineWidth = 0.4 * k;
        ctx.strokeRect(
            X(plate.left + 3),
            Y(plate.top - 3),
            (plate.right - plate.left - 6) * k,
            (plate.top - plate.bottom - 6) * k
        );

        const divider = -12;
        line(divider, plate.top - 6, divider, plate.bottom + 6, 0.7);

        ctx.fillStyle = INK;
        // Charity on the left
        const [charity, region] = MEDAL.charity;
        text(charity, (plate.left + divider) / 2, -73, 10.4);
        text(region, (plate.left + divider) / 2, -86.5, 5, 1.1);
        // Event on the right
        text('BELFAST', (plate.right + divider) / 2, -72, 17.5);
        text('CITY MARATHON 2026', (plate.right + divider) / 2, -87.5, 6.3);
    }
}
