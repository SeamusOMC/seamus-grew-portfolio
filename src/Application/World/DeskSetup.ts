import * as THREE from 'three';
import Application from '../Application';
import Time from '../Utils/Time';
import PixelDisplay from './PixelDisplay';
import Chair from './Chair';
import Tower from './Tower';
import Medal from './Medal';
import RetroKeyboard from './RetroKeyboard';
import RetroMouse from './RetroMouse';
import RoomLight from './RoomLight';
import UIEventBus from '../UI/EventBus';
// @ts-ignore
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
    DESK,
    DESK_SURFACE_Y,
    DITOO,
    FLOOR_Y,
    MONITOR,
    MAT,
    PICTURE_FRAMES,
    SCREEN,
} from './SetupConfig';

/**
 * The desk setup: a standing desk, a flat 16:9 monitor, the PC, a pixel
 * display, photo frames, a medal, a chair, a floor lamp, plus keyboard, mouse
 * and desk mat.
 *
 * It is built from simple shapes rather than a baked model, so every size and
 * colour can be changed in SetupConfig.ts.
 */
export default class DeskSetup {
    application: Application;
    scene: THREE.Scene;
    time: Time;
    group: THREE.Group;
    roomLight: RoomLight;
    tower: Tower;
    pixelDisplay: PixelDisplay;

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.time = this.application.time;
        this.group = new THREE.Group();

        this.roomLight = new RoomLight();
        this.createDesk();
        this.createMonitor();
        this.tower = new Tower();
        this.group.add(this.tower.group);
        this.createDitoo();
        for (const frame of PICTURE_FRAMES) this.createPictureFrame(frame);
        this.group.add(new Medal().group);
        this.group.add(new Chair().group);
        this.createPeripherals();

        this.scene.add(this.group);
    }

    material(color: number, roughness = 0.7, metalness = 0.1) {
        return new THREE.MeshStandardMaterial({ color, roughness, metalness });
    }

    box(
        parent: THREE.Object3D,
        size: [number, number, number],
        position: [number, number, number],
        material: THREE.Material,
        shadows = true,
        radius?: number
    ) {
        // Edges are rounded off unless the box is too thin for it to show
        const smallest = Math.min(size[0], size[1], size[2]);
        const round = Math.min(
            radius === undefined ? 10 : radius,
            smallest / 2 - 0.5
        );
        const geometry =
            smallest < 12 || round <= 0
                ? new THREE.BoxGeometry(size[0], size[1], size[2])
                : new RoundedBoxGeometry(size[0], size[1], size[2], 3, round);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position[0], position[1], position[2]);
        mesh.castShadow = shadows;
        mesh.receiveShadow = shadows;
        parent.add(mesh);
        return mesh;
    }

    createDesk() {
        const desk = new THREE.Group();
        const top = this.material(DESK.topColor, 0.65, 0);
        const frame = this.material(DESK.frameColor, 0.5, 0.4);

        const underside = DESK_SURFACE_Y - DESK.thickness;
        const legX = DESK.width / 2 - DESK.legInset;
        const z = DESK.centerZ;

        // Desktop
        this.box(
            desk,
            [DESK.width, DESK.thickness, DESK.depth],
            [0, DESK_SURFACE_Y - DESK.thickness / 2, z],
            top,
            true,
            26
        );

        // Frame under the desktop
        this.box(desk, [legX * 2, 60, 110], [0, underside - 30, z], frame);
        for (const side of [-1, 1]) {
            const x = side * legX;
            this.box(
                desk,
                [130, 50, DESK.depth - 500],
                [x, underside - 25, z],
                frame
            );

            // Telescopic leg: a narrower upper stage sliding into a wider one
            const legTop = underside - 50;
            const legBottom = FLOOR_Y + 50;
            const split = legTop - (legTop - legBottom) * 0.42;
            this.box(
                desk,
                [170, legTop - split, 230],
                [x, (legTop + split) / 2, z],
                frame
            );
            this.box(
                desk,
                [215, split - legBottom, 275],
                [x, (split + legBottom) / 2, z],
                frame
            );

            // Foot
            this.box(
                desk,
                [250, 50, DESK.depth - 350],
                [x, FLOOR_Y + 25, z],
                frame
            );
        }

        // Height controller under the front edge
        const frontZ = z + DESK.depth / 2;
        this.box(desk, [420, 45, 130], [1500, underside - 22, frontZ - 70], frame);
        this.box(
            desk,
            [110, 22, 4],
            [1400, underside - 22, frontZ - 3],
            new THREE.MeshStandardMaterial({
                color: 0x000000,
                emissive: 0x38bdf8,
                emissiveIntensity: 0.9,
            }),
            false
        );

        this.group.add(desk);
    }

    createMonitor() {
        const monitor = new THREE.Group();
        monitor.position.copy(SCREEN.position);

        const bezel = this.material(MONITOR.bezelColor, 0.55, 0.2);
        const stand = this.material(MONITOR.standColor, 0.5, 0.4);

        const side = 18;
        const topEdge = 16;
        const chin = 62;
        const shellW = SCREEN.width + side * 2;
        const shellH = SCREEN.height + topEdge + chin;
        const shellY = (topEdge - chin) / 2;
        // Front face of the shell sits just behind the screen plane (z = 0)
        const shellFront = -8;

        this.box(monitor, [shellW, shellH, 34], [0, shellY, shellFront - 17], bezel, true, 14);
        this.box(monitor, [1000, 560, 70], [0, -40, shellFront - 34 - 30], bezel, true, 32);

        // Logo on the chin
        const logo = new THREE.Mesh(
            new THREE.PlaneGeometry(150, 38),
            new THREE.MeshBasicMaterial({
                map: this.createTextTexture(MONITOR.logoText),
                transparent: true,
                polygonOffset: true,
                polygonOffsetFactor: -4,
                polygonOffsetUnits: -4,
            })
        );
        logo.position.set(0, -SCREEN.height / 2 - chin / 2, shellFront + 1);
        monitor.add(logo);

        // Power LED, lit while the monitor is on
        const powerLed = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0xffffff,
        });
        UIEventBus.on('monitorPower', (on: boolean) => {
            powerLed.emissive.set(on ? 0xffffff : 0x3a1500);
        });
        this.box(
            monitor,
            [26, 5, 3],
            [SCREEN.width / 2 - 150, -SCREEN.height / 2 - chin / 2, shellFront + 1],
            powerLed,
            false
        );

        // Stand
        const deskY = DESK_SURFACE_Y - SCREEN.position.y;
        const neckTop = -150;
        this.box(
            monitor,
            [130, neckTop - deskY, 46],
            [0, (neckTop + deskY) / 2, shellFront - 100],
            stand
        );
        this.box(monitor, [760, 24, 520], [0, deskY + 12, shellFront - 40], stand);

        this.group.add(monitor);
    }

    createTextTexture(text: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = '#c9ccd1';
            context.font = 'bold 96px Arial, Helvetica, sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, 256, 70);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        return texture;
    }

    /**
     * The little retro pixel display: a rounded screen housing on a base with
     * chunky keys and a ball-topped lever
     */
    createDitoo() {
        const ditoo = new THREE.Group();
        ditoo.position.copy(DITOO.position);
        ditoo.rotation.y = DITOO.rotationY;
        ditoo.scale.setScalar(DITOO.scale);

        const shell = this.material(DITOO.bodyColor, 0.55, 0);
        const keys = this.material(DITOO.keyColor, 0.55, 0);
        const baseTop = 100;
        const headFront = 60;

        // Base with the keys, and the screen housing sitting at the back
        this.box(ditoo, [320, baseTop, 400], [0, baseTop / 2, 0], shell, true, 40);
        this.box(ditoo, [320, 310, 260], [0, 75 + 155, headFront - 130], shell, true, 52);

        // Screen, set into a dark rounded surround
        const screenY = 75 + 160;
        this.box(
            ditoo,
            [264, 264, 12],
            [0, screenY, headFront],
            this.material(0x08080a, 0.3, 0.2),
            false,
            26
        );
        this.pixelDisplay = new PixelDisplay();
        const screen = new THREE.Mesh(
            new THREE.PlaneGeometry(232, 232),
            new THREE.MeshBasicMaterial({ map: this.pixelDisplay.texture })
        );
        screen.position.set(0, screenY, headFront + 7);
        ditoo.add(screen);

        // Keys
        for (let row = 0; row < 2; row++) {
            for (let column = 0; column < 3; column++) {
                this.box(
                    ditoo,
                    [56, 34, 56],
                    [-98 + column * 68, baseTop + 10, 96 + row * 68],
                    keys,
                    true,
                    13
                );
            }
        }

        // Lever with a ball top
        const stick = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 7, 60, 16),
            this.material(0x8a8d92, 0.35, 0.7)
        );
        stick.position.set(118, baseTop + 26, 130);
        stick.castShadow = true;
        const ball = new THREE.Mesh(
            new THREE.SphereGeometry(19, 24, 16),
            this.material(0xd94a3a, 0.35, 0)
        );
        ball.position.set(118, baseTop + 66, 130);
        ball.castShadow = true;
        ditoo.add(stick, ball);

        this.group.add(ditoo);
    }

    /**
     * A picture frame leaning on its stand
     */
    createPictureFrame(config: typeof PICTURE_FRAMES[number]) {
        const frame = new THREE.Group();
        frame.position.copy(config.position);
        frame.rotation.y = config.rotationY;

        const { width, height } = config;
        const border = 44;
        const lean = new THREE.Group();
        lean.rotation.x = -0.2;

        this.box(
            lean,
            [width, height, 30],
            [0, height / 2, 0],
            this.material(config.frameColor, 0.6, 0),
            true,
            12
        );

        // Mount and picture
        const mount = new THREE.Mesh(
            new THREE.PlaneGeometry(width - border * 2, height - border * 2),
            new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.9 })
        );
        mount.position.set(0, height / 2, 16);
        lean.add(mount);

        const maxW = width - border * 2 - 40;
        const maxH = height - border * 2 - 40;
        const picture = new THREE.Mesh(
            new THREE.PlaneGeometry(maxW, maxH),
            new THREE.MeshStandardMaterial({ color: 0xc9ccd2, roughness: 0.6 })
        );
        picture.position.set(0, height / 2, 17);
        lean.add(picture);

        if (config.image) {
            new THREE.TextureLoader().load(config.image, (texture) => {
                texture.encoding = THREE.sRGBEncoding;
                // Fit the picture inside the mount, keeping its proportions
                const fit = Math.min(
                    maxW / texture.image.width,
                    maxH / texture.image.height
                );
                picture.scale.set(
                    (texture.image.width * fit) / maxW,
                    (texture.image.height * fit) / maxH,
                    1
                );
                const material = picture.material as THREE.MeshStandardMaterial;
                material.color.set(0xffffff);
                material.map = texture;
                material.needsUpdate = true;
            });
        }

        frame.add(lean);

        // Stand at the back
        const stand = this.box(
            frame,
            [120, height * 0.7, 14],
            [0, height * 0.33, -150],
            this.material(config.frameColor, 0.6, 0)
        );
        stand.rotation.x = 0.28;

        this.group.add(frame);
    }

    createPeripherals() {
        // Desk mat
        this.box(
            this.group,
            [2800, MAT.thickness, 1100],
            [100, DESK_SURFACE_Y + MAT.thickness / 2, 720],
            this.material(MAT.color, 0.95, 0)
        );

        this.group.add(new RetroKeyboard().group);
        this.group.add(new RetroMouse().group);
    }

    update() {
        this.roomLight.update(this.time.delta);
        this.tower.update(this.time.delta);
        if (this.pixelDisplay) this.pixelDisplay.update(this.time.elapsed);
    }
}
