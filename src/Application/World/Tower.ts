import * as THREE from 'three';
// @ts-ignore
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { PC } from './SetupConfig';

// The colours in SetupConfig are written as they should appear on screen, so
// the LED colour is converted to the renderer's working colour space
const LED_COLOR = new THREE.Color(PC.ledColor).convertSRGBToLinear();

/**
 * The PC: a Corsair Crystal 680X style dual-chamber case.
 *
 * The main chamber, on the side facing the monitor, has tinted glass on its
 * front, side and top and holds the motherboard, graphics card, memory and a
 * liquid cooler, lit by red fans. The closed chamber beside it hides the
 * power supply and cables.
 *
 * Local axes: -x is the glass side, +z is the front, y is up from the desk.
 */
export default class Tower {
    group: THREE.Group;
    rotors: THREE.Object3D[];

    body: THREE.MeshStandardMaterial;
    interior: THREE.MeshStandardMaterial;
    plastic: THREE.MeshStandardMaterial;
    metal: THREE.MeshStandardMaterial;
    led: THREE.MeshStandardMaterial;
    blade: THREE.MeshStandardMaterial;
    glowTexture: THREE.Texture;

    // Key positions shared between the parts
    left: number;
    right: number;
    front: number;
    back: number;
    bottom: number;
    top: number;
    wall: number;
    mainX: number;
    boardFace: number;
    cpuY: number;
    gpuY: number;

    constructor() {
        this.group = new THREE.Group();
        this.group.position.copy(PC.position);
        this.rotors = [];

        this.body = new THREE.MeshStandardMaterial({
            color: PC.caseColor,
            roughness: 0.55,
            metalness: 0.55,
        });
        this.interior = new THREE.MeshStandardMaterial({
            color: PC.interiorColor,
            roughness: 0.75,
            metalness: 0.3,
        });
        this.plastic = new THREE.MeshStandardMaterial({
            color: 0x09090b,
            roughness: 0.6,
            metalness: 0.1,
        });
        this.metal = new THREE.MeshStandardMaterial({
            color: 0x2c2e33,
            roughness: 0.35,
            metalness: 0.75,
        });
        this.led = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: LED_COLOR,
            roughness: 0.4,
        });
        // Fan blades are frosted, so they pick up the colour of their LEDs
        this.blade = new THREE.MeshStandardMaterial({
            color: 0x2a0606,
            emissive: LED_COLOR,
            emissiveIntensity: 0.32,
            roughness: 0.5,
            transparent: true,
            opacity: 0.82,
            side: THREE.DoubleSide,
        });
        this.glowTexture = this.createGlowTexture();

        const feet = 36;
        this.left = -PC.width / 2;
        this.right = PC.width / 2;
        this.front = PC.depth / 2;
        this.back = -PC.depth / 2;
        this.bottom = feet;
        this.top = feet + PC.height;
        this.wall = this.left + PC.mainWidth;
        this.mainX = (this.left + this.wall) / 2;
        this.boardFace = this.wall - 26;
        this.cpuY = this.top - 560;
        this.gpuY = this.cpuY - 520;

        this.createCase(feet);
        this.createFrontPanel();
        this.createMotherboard();
        this.createCooler();
        this.createGraphicsCard();
        this.createFans();
        this.createLighting();
        // Glass goes on last so everything inside is drawn before it
        this.createGlass();
    }

    // ------------------------------------------------------------- helpers

    box(
        size: [number, number, number],
        position: [number, number, number],
        material: THREE.Material,
        radius = 0,
        shadows = false
    ) {
        const geometry =
            radius > 0
                ? new RoundedBoxGeometry(size[0], size[1], size[2], 2, radius)
                : new THREE.BoxGeometry(size[0], size[1], size[2]);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position[0], position[1], position[2]);
        mesh.castShadow = shadows;
        mesh.receiveShadow = shadows;
        this.group.add(mesh);
        return mesh;
    }

    tube(points: [number, number, number][], radius: number, material: THREE.Material) {
        const curve = new THREE.CatmullRomCurve3(
            points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
        );
        const mesh = new THREE.Mesh(
            new THREE.TubeGeometry(curve, 40, radius, 10, false),
            material
        );
        this.group.add(mesh);
        return mesh;
    }

    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        if (context) {
            const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
            gradient.addColorStop(0, 'rgba(255,255,255,0.55)');
            gradient.addColorStop(0.55, 'rgba(255,255,255,0.22)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            context.fillStyle = gradient;
            context.fillRect(0, 0, 128, 128);
        }
        return new THREE.CanvasTexture(canvas);
    }

    /**
     * A pattern of small holes, for the ventilated steel panels
     */
    createVentTexture(repeatX: number, repeatY: number) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = '#1b1c20';
            context.fillRect(0, 0, 64, 64);
            context.fillStyle = '#040405';
            for (const [x, y] of [
                [16, 16],
                [48, 16],
                [0, 48],
                [32, 48],
                [64, 48],
            ]) {
                context.beginPath();
                context.arc(x, y, 9, 0, Math.PI * 2);
                context.fill();
            }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
        texture.encoding = THREE.sRGBEncoding;
        return texture;
    }

    // ---------------------------------------------------------------- case

    createCase(feet: number) {
        const { left, right, front, back, bottom, top, wall, mainX } = this;
        const w = PC.width;
        const h = PC.height;
        const d = PC.depth;
        const t = 22;
        const midY = (bottom + top) / 2;
        const closedX = (wall + right) / 2;
        const closedW = right - wall;

        // Feet: two bars running side to side
        for (const z of [back + 130, front - 130]) {
            this.box([w - 60, feet, 100], [0, feet / 2, z], this.metal, 12, true);
        }

        // Steel panels: floor, back, far side, and the closed chamber's
        // front and top
        this.box([w, t, d], [0, bottom + t / 2, 0], this.body, 6, true);
        this.box([w, h, t], [0, midY, back + t / 2], this.body, 6, true);
        this.box([t, h, d], [right - t / 2, midY, 0], this.body, 6, true);
        this.box([closedW, h, t], [closedX, midY, front - t / 2], this.body, 6, true);
        this.box([closedW, t, d], [closedX, top - t / 2, 0], this.body, 6, true);
        // The wall between the two chambers
        this.box([t, h - 2 * t, d - 2 * t], [wall, midY, 0], this.interior);

        // Frame the glass is mounted on
        this.box([t, h, t], [left + t / 2, midY, front - t / 2], this.body, 6, true);
        this.box([t, h, t], [left + t / 2, midY, back + t / 2], this.body, 6, true);
        this.box([t, t, d], [left + t / 2, top - t / 2, 0], this.body, 6, true);
        this.box([PC.mainWidth, t, t], [mainX, top - t / 2, front - t / 2], this.body, 6);
        this.box([PC.mainWidth, t, t], [mainX, top - t / 2, back + t / 2], this.body, 6);

        // Ventilation holes on the far side panel and the closed chamber's top
        const side = new THREE.Mesh(
            new THREE.PlaneGeometry(d * 0.72, h * 0.62),
            new THREE.MeshStandardMaterial({
                map: this.createVentTexture(30, 31),
                roughness: 0.6,
                metalness: 0.5,
            })
        );
        side.rotation.y = Math.PI / 2;
        side.position.set(right + 1, midY, 0);
        this.group.add(side);

        const roof = new THREE.Mesh(
            new THREE.PlaneGeometry(closedW * 0.62, d * 0.55),
            new THREE.MeshStandardMaterial({
                map: this.createVentTexture(8, 23),
                roughness: 0.6,
                metalness: 0.5,
            })
        );
        roof.rotation.x = -Math.PI / 2;
        roof.position.set(closedX, top + 1, -d * 0.12);
        this.group.add(roof);

        // Vented floor of the main chamber
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(PC.mainWidth - 140, d - 260),
            new THREE.MeshStandardMaterial({
                map: this.createVentTexture(18, 34),
                roughness: 0.7,
                metalness: 0.4,
            })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(mainX, bottom + t + 1, 0);
        this.group.add(floor);
    }

    /**
     * Power button, ports and audio jacks at the front of the top panel
     */
    createFrontPanel() {
        const { wall, right, front, top } = this;
        const x = (wall + right) / 2;
        const z = front - 110;

        const button = new THREE.Mesh(
            new THREE.CylinderGeometry(26, 26, 8, 24),
            this.metal
        );
        button.position.set(x - 120, top + 4, z);
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(26, 3, 8, 28),
            new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(x - 120, top + 5, z);
        this.group.add(button, ring);

        // Two USB ports, a USB-C port and two audio jacks
        const port = new THREE.MeshStandardMaterial({ color: 0x1a4fd0, roughness: 0.4 });
        this.box([58, 5, 22], [x - 30, top + 2.5, z], port);
        this.box([58, 5, 22], [x + 50, top + 2.5, z], port);
        this.box([36, 5, 14], [x + 122, top + 2.5, z], this.plastic, 0);
        for (const offset of [0, 44]) {
            const jack = new THREE.Mesh(
                new THREE.CylinderGeometry(9, 9, 5, 16),
                this.plastic
            );
            jack.position.set(x - 20 + offset, top + 2.5, z - 70);
            this.group.add(jack);
        }
    }

    createGlass() {
        const { left, front, back, bottom, top, mainX } = this;
        const h = PC.height;
        const d = PC.depth;
        const t = 22;
        const midY = (bottom + top) / 2;

        const glass = new THREE.MeshStandardMaterial({
            color: 0x050506,
            transparent: true,
            opacity: 0.2,
            roughness: 0.03,
            metalness: 0.9,
            depthWrite: false,
        });
        // The black border printed around the edge of each pane
        const border = new THREE.MeshStandardMaterial({
            color: 0x040405,
            roughness: 0.15,
            metalness: 0.6,
        });
        const edge = 46;

        const pane = (
            size: [number, number, number],
            position: [number, number, number],
            axis: 'x' | 'y' | 'z'
        ) => {
            const mesh = this.box(size, position, glass);
            mesh.renderOrder = 2;

            // Border strips: two along each of the pane's two in-plane axes
            const [a, b] = (['x', 'y', 'z'] as const).filter((n) => n !== axis);
            const index = { x: 0, y: 1, z: 2 };
            for (const [along, across] of [
                [a, b],
                [b, a],
            ]) {
                for (const side of [-1, 1]) {
                    const stripSize: [number, number, number] = [...size];
                    const stripPosition: [number, number, number] = [...position];
                    stripSize[index[across]] = edge;
                    stripSize[index[axis]] = size[index[axis]] + 2;
                    stripPosition[index[across]] +=
                        side * (size[index[across]] / 2 - edge / 2);
                    // Keeps `along` at full length
                    stripSize[index[along]] = size[index[along]];
                    this.box(stripSize, stripPosition, border);
                }
            }
        };

        pane([8, h - t, d - t], [left + 4, midY, 0], 'x');
        pane([PC.mainWidth - t, h - t, 8], [mainX, midY, front - 4], 'z');
        pane([PC.mainWidth - t, 8, d - t], [mainX, top - 4, 0], 'y');

        // Thumbscrews holding the side pane on
        for (const y of [bottom + 90, top - 90]) {
            for (const z of [back + 90, front - 90]) {
                const screw = new THREE.Mesh(
                    new THREE.CylinderGeometry(20, 20, 16, 20),
                    this.metal
                );
                screw.rotation.z = Math.PI / 2;
                screw.position.set(left - 6, y, z);
                this.group.add(screw);
            }
        }
    }

    // ----------------------------------------------------------- components

    createMotherboard() {
        const { boardFace, cpuY, gpuY } = this;
        const pcb = new THREE.MeshStandardMaterial({
            color: 0x0d0e11,
            roughness: 0.8,
            metalness: 0.2,
        });
        const boardY = cpuY - 290;
        const boardZ = -170;
        const x = (depth: number) => boardFace - depth / 2;

        // Circuit board
        this.box([12, 1090, 870], [boardFace + 6, boardY, boardZ], pcb);

        // Rear port cover and the heatsinks around the processor
        this.box([120, 520, 150], [x(120), cpuY + 20, boardZ - 360], this.plastic, 14);
        this.box([8, 300, 6], [boardFace - 122, cpuY + 20, boardZ - 300], this.led);
        this.box([90, 110, 360], [x(90), cpuY + 215, boardZ - 80], this.metal, 8);
        for (let i = 0; i < 9; i++) {
            this.box([94, 112, 8], [x(94), cpuY + 215, boardZ - 240 + i * 40], this.plastic);
        }

        // Memory: four sticks with lit tops
        for (let i = 0; i < 4; i++) {
            const z = boardZ + 200 + i * 34;
            this.box([118, 470, 20], [x(118), cpuY, z], this.metal, 4);
            this.box([14, 470, 20], [boardFace - 124, cpuY, z], this.led);
        }

        // Main power connector and its cable, heading for the wall
        const powerZ = boardZ + 400;
        this.box([70, 210, 40], [x(70), cpuY - 60, powerZ], this.plastic, 4);
        for (let i = 0; i < 6; i++) {
            const y = cpuY - 140 + i * 32;
            this.tube(
                [
                    [boardFace - 70, y, powerZ],
                    [boardFace - 150, y, powerZ + 40],
                    [boardFace - 130, y, powerZ + 130],
                    [boardFace + 10, y, powerZ + 170],
                ],
                9,
                this.plastic
            );
        }

        // Expansion slots, and the heatsinks over the storage and chipset
        for (let i = 0; i < 4; i++) {
            this.box([26, 16, 420], [x(26), gpuY + 140 - i * 115, boardZ - 150], this.metal);
        }
        this.box([30, 80, 330], [x(30), gpuY + 190, boardZ + 120], this.metal, 6);
        this.box([36, 230, 250], [x(36), gpuY - 230, boardZ + 250], this.metal, 8);
        this.box([6, 150, 8], [boardFace - 38, gpuY - 230, boardZ + 330], this.led);

        // Rubber grommets where cables pass through the wall
        for (const y of [cpuY + 60, gpuY + 60, gpuY - 300]) {
            this.box([8, 250, 90], [this.wall - 14, y, this.front - 250], this.plastic, 3);
        }
    }

    /**
     * Liquid cooler: a pump on the processor, a radiator under the top glass
     * and the two tubes between them
     */
    createCooler() {
        const { boardFace, cpuY, mainX, top } = this;
        const pumpX = boardFace - 70;
        const pumpZ = -280;

        const pump = new THREE.Mesh(
            new THREE.CylinderGeometry(118, 118, 140, 36),
            this.plastic
        );
        pump.rotation.z = Math.PI / 2;
        pump.position.set(pumpX, cpuY, pumpZ);
        this.group.add(pump);

        // Lit ring and cap facing the glass
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(98, 9, 10, 40),
            this.led
        );
        ring.rotation.y = Math.PI / 2;
        ring.position.set(pumpX - 72, cpuY, pumpZ);
        const cap = new THREE.Mesh(
            new THREE.CylinderGeometry(86, 86, 6, 36),
            new THREE.MeshStandardMaterial({
                color: 0x050506,
                roughness: 0.08,
                metalness: 0.9,
            })
        );
        cap.rotation.z = Math.PI / 2;
        cap.position.set(pumpX - 72, cpuY, pumpZ);
        this.group.add(ring, cap);

        // Radiator under the top glass
        const radiatorY = top - 90;
        this.box([460, 96, 1040], [mainX, radiatorY, -120], this.plastic, 6);
        const fins = new THREE.MeshStandardMaterial({
            color: 0x1c1d21,
            roughness: 0.5,
            metalness: 0.6,
        });
        for (let i = 0; i < 26; i++) {
            this.box([400, 100, 6], [mainX, radiatorY, -600 + i * 38.4], fins);
        }

        // Tubes from the pump up to the end of the radiator
        const rubber = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.75 });
        for (const offset of [-34, 34]) {
            this.tube(
                [
                    [pumpX - 40, cpuY + 60, pumpZ + offset],
                    [pumpX - 150, cpuY + 120, pumpZ + offset + 40],
                    [pumpX - 230, cpuY + 260, pumpZ + offset + 220],
                    [mainX + 40 + offset, radiatorY - 150, 330],
                    [mainX + offset, radiatorY - 50, 370],
                ],
                17,
                rubber
            );
        }
    }

    createGraphicsCard() {
        const { boardFace, gpuY } = this;
        const length = 1060;
        const width = 470;
        const thick = 185;
        const x = boardFace - 10 - width / 2;
        const z = -150;
        const outer = boardFace - 10 - width;

        // Cooler shroud with a metal backplate on top
        this.box([width, thick, length], [x, gpuY, z], this.plastic, 16);
        this.box([width - 10, 10, length - 10], [x, gpuY + thick / 2 + 3, z], this.metal, 3);
        for (let i = 0; i < 5; i++) {
            this.box(
                [width - 120, 4, 26],
                [x, gpuY + thick / 2 + 9, z - 380 + i * 190],
                this.plastic
            );
        }

        // Three fans on the underside
        for (let i = 0; i < 3; i++) {
            const fanZ = z - 340 + i * 340;
            const rim = new THREE.Mesh(
                new THREE.TorusGeometry(150, 8, 8, 36),
                this.metal
            );
            rim.rotation.x = Math.PI / 2;
            rim.position.set(x, gpuY - thick / 2 - 2, fanZ);
            const hub = new THREE.Mesh(
                new THREE.CylinderGeometry(52, 52, 14, 24),
                this.metal
            );
            hub.position.set(x, gpuY - thick / 2 - 4, fanZ);
            this.group.add(rim, hub);
        }

        // Edge facing the glass: a lit strip between two trim lines
        this.box([6, 30, 620], [outer - 3, gpuY + 22, z - 60], this.led);
        this.box([6, 10, 900], [outer - 3, gpuY + 62, z], this.metal);
        this.box([6, 10, 900], [outer - 3, gpuY - 52, z], this.metal);

        // Bracket at the back of the case
        this.box([width - 40, thick + 40, 10], [x, gpuY, z - length / 2 - 6], this.metal);

        // Two power cables rising from the card and through the wall
        const sleeve = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.9 });
        for (const offset of [0, 60]) {
            for (let i = 0; i < 4; i++) {
                const cx = x - 120 + i * 20;
                this.tube(
                    [
                        [cx, gpuY + thick / 2, z + 300 + offset],
                        [cx, gpuY + 240, z + 320 + offset],
                        [cx + 150, gpuY + 330, z + 450 + offset * 0.5],
                        [boardFace + 20, gpuY + 300, this.front - 250],
                    ],
                    8,
                    sleeve
                );
            }
        }
    }

    // ------------------------------------------------------------------ fans

    /**
     * A 120mm LED fan: square frame, lit rings and spinning frosted blades.
     * It faces +z until rotated.
     */
    createFan(radius: number) {
        const fan = new THREE.Group();
        const depth = 72;

        // Square frame with a round opening
        const half = radius + 16;
        const frame = new THREE.Shape();
        const corner = 26;
        frame.moveTo(-half + corner, -half);
        frame.lineTo(half - corner, -half);
        frame.quadraticCurveTo(half, -half, half, -half + corner);
        frame.lineTo(half, half - corner);
        frame.quadraticCurveTo(half, half, half - corner, half);
        frame.lineTo(-half + corner, half);
        frame.quadraticCurveTo(-half, half, -half, half - corner);
        frame.lineTo(-half, -half + corner);
        frame.quadraticCurveTo(-half, -half, -half + corner, -half);
        const opening = new THREE.Path();
        opening.absarc(0, 0, radius - 4, 0, Math.PI * 2, true);
        frame.holes.push(opening);
        const frameMesh = new THREE.Mesh(
            new THREE.ExtrudeGeometry(frame, {
                depth,
                bevelEnabled: false,
                curveSegments: 40,
            }),
            this.plastic
        );
        frameMesh.position.z = -depth / 2;
        fan.add(frameMesh);

        // LED rings on both faces
        for (const z of [depth / 2 - 4, -depth / 2 + 4]) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(radius - 10, 7, 10, 48),
                this.led
            );
            ring.position.z = z;
            fan.add(ring);
        }

        // Hub and blades, which spin
        const rotor = new THREE.Group();
        const hubRadius = radius * 0.27;
        const hub = new THREE.Mesh(
            new THREE.CylinderGeometry(hubRadius, hubRadius, 44, 28),
            this.plastic
        );
        hub.rotation.x = Math.PI / 2;
        rotor.add(hub);
        const sticker = new THREE.Mesh(
            new THREE.CircleGeometry(hubRadius * 0.78, 28),
            this.metal
        );
        sticker.position.z = 22.5;
        rotor.add(sticker);

        const bladeShape = new THREE.Shape();
        const inner = hubRadius - 4;
        const outer = radius - 24;
        const steps = 10;
        const edge = (start: number, sweep: number, t: number) => {
            const r = inner + (outer - inner) * t;
            const angle = start + sweep * t;
            return new THREE.Vector2(r * Math.cos(angle), r * Math.sin(angle));
        };
        for (let i = 0; i <= steps; i++) {
            const p = edge(-0.3, 0.55, i / steps);
            if (i === 0) bladeShape.moveTo(p.x, p.y);
            else bladeShape.lineTo(p.x, p.y);
        }
        for (let i = steps; i >= 0; i--) {
            const p = edge(0.3, 0.75, i / steps);
            bladeShape.lineTo(p.x, p.y);
        }
        const bladeGeometry = new THREE.ExtrudeGeometry(bladeShape, {
            depth: 5,
            bevelEnabled: false,
        });
        const blades = 9;
        for (let i = 0; i < blades; i++) {
            const holder = new THREE.Group();
            holder.rotation.z = (i / blades) * Math.PI * 2;
            const blade = new THREE.Mesh(bladeGeometry, this.blade);
            // Twisted about its own length, like a real blade
            blade.rotation.x = 0.42;
            blade.position.z = -6;
            holder.add(blade);
            rotor.add(holder);
        }
        fan.add(rotor);
        this.rotors.push(rotor);

        // Soft glow, so the light appears to spill off the fan
        const glow = new THREE.Mesh(
            new THREE.PlaneGeometry(radius * 3, radius * 3),
            new THREE.MeshBasicMaterial({
                map: this.glowTexture,
                color: LED_COLOR,
                transparent: true,
                opacity: 0.5,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        glow.position.z = depth / 2 + 6;
        glow.renderOrder = 1;
        fan.add(glow);

        this.group.add(fan);
        return fan;
    }

    createFans() {
        const { mainX, front, back, bottom, top, cpuY } = this;
        const radius = 205;

        // Three intake fans behind the front glass
        for (let i = 0; i < 3; i++) {
            const fan = this.createFan(radius);
            fan.position.set(mainX, bottom + 330 + i * 570, front - 80);
        }

        // Exhaust fan at the back
        const rear = this.createFan(radius);
        rear.position.set(mainX + 70, cpuY - 20, back + 70);

        // Two fans under the radiator, blowing up through it
        for (const z of [-360, 120]) {
            const fan = this.createFan(radius);
            fan.rotation.x = Math.PI / 2;
            fan.position.set(mainX, top - 180, z);
        }
    }

    createLighting() {
        const { mainX, bottom, top, front } = this;
        const centre = new THREE.PointLight(LED_COLOR, 2.4, 2800, 2);
        centre.position.set(mainX - 120, (bottom + top) / 2, 100);
        const intake = new THREE.PointLight(LED_COLOR, 1.4, 1800, 2);
        intake.position.set(mainX, bottom + 500, front - 320);
        this.group.add(centre, intake);
    }

    update(delta: number) {
        for (const rotor of this.rotors) {
            rotor.rotation.z -= delta * 0.006;
        }
    }
}
