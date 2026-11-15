import * as THREE from 'three';
import { MOUSE } from './SetupConfig';

/**
 * A wireless retro-styled mouse to match the keyboard: a cream shell with a
 * grey panel down the left side, two red thumb buttons and a dark wheel.
 *
 * The front of the mouse points away from the viewer (towards -z).
 */
export default class RetroMouse {
    group: THREE.Group;

    constructor() {
        this.group = new THREE.Group();
        this.group.position.copy(MOUSE.position);
        this.group.rotation.y = MOUSE.rotationY;

        this.createShell();
        this.createButtons();
    }

    /**
     * Height of the top of the shell above the mat at a point along its
     * length, where z runs from -1 (front) to 1 (back)
     */
    profile(z: number) {
        // Low at the buttons, rising to a hump behind the middle
        return 0.62 + 0.44 * Math.sin(((z + 0.55) / 1.55) * Math.PI * 0.5 + 0.35);
    }

    /**
     * Height of the top surface along the centre line of the mouse
     */
    ridge(z: number) {
        return 12 + MOUSE.height * this.profile(z) * Math.sqrt(1 - z * z);
    }

    createShell() {
        const { width, height, length } = MOUSE;
        const geometry = new THREE.SphereGeometry(1, 72, 48);
        const position = geometry.attributes.position;
        const colors = new Float32Array(position.count * 3);
        // Colours are written as they should appear on screen, so convert
        // them to the renderer's working colour space
        const cream = new THREE.Color(MOUSE.color).convertSRGBToLinear();
        const grey = new THREE.Color(MOUSE.panelColor).convertSRGBToLinear();

        for (let i = 0; i < position.count; i++) {
            const x = position.getX(i);
            const y = position.getY(i);
            const z = position.getZ(i);

            // The grey panel covers the lower left side
            const panel = x < -0.5 && y < 0.62;
            (panel ? grey : cream).toArray(colors, i * 3);

            // Narrower at the front, with a slight waist for the grip
            const taper = 0.86 + 0.14 * z - 0.04 * Math.cos(z * Math.PI * 0.9);
            // A domed top and a nearly flat base
            const top = y > 0 ? y * height * this.profile(z) : y * 12;

            position.setXYZ(i, x * (width / 2) * taper, top, z * (length / 2));
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.computeVertexNormals();

        const shell = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
                vertexColors: true,
                roughness: 0.6,
                metalness: 0,
            })
        );
        shell.position.y = 12;
        shell.castShadow = true;
        this.group.add(shell);
    }

    createButtons() {
        const half = MOUSE.length / 2;
        const dark = new THREE.MeshStandardMaterial({ color: 0x2b2c30, roughness: 0.7 });

        // Groove between the two main buttons, following the slope of the top
        const start = -0.66;
        const end = -0.12;
        const y0 = this.ridge(start);
        const y1 = this.ridge(end);
        const dz = (end - start) * half;
        const groove = new THREE.Mesh(
            new THREE.BoxGeometry(5, 5, Math.hypot(dz, y1 - y0)),
            dark
        );
        groove.position.set(0, (y0 + y1) / 2 + 1, ((start + end) / 2) * half);
        groove.rotation.x = -Math.atan2(y1 - y0, dz);
        this.group.add(groove);

        // Scroll wheel, half sunk into the groove
        const wheelZ = -0.52;
        const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(25, 25, 20, 28),
            dark
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(0, this.ridge(wheelZ) - 6, wheelZ * half);
        wheel.castShadow = true;
        this.group.add(wheel);

        // Two round red thumb buttons on the grey panel
        const red = new THREE.MeshStandardMaterial({
            color: new THREE.Color(MOUSE.buttonColor).convertSRGBToLinear(),
            roughness: 0.45,
        });
        for (const z of [-0.2, 0.06]) {
            const button = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), red);
            button.scale.set(7, 19, 19);
            button.position.set(-(MOUSE.width / 2) * 0.86, 44, z * half);
            this.group.add(button);
        }
    }
}
