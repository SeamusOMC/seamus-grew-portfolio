import * as THREE from 'three';
// @ts-ignore
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { CHAIR } from './SetupConfig';

// The chair is modelled in millimetres and scaled up to world units
const MM = 1 / 0.28;

/**
 * A mesh-backed ergonomic office chair: five-star base on casters, gas lift,
 * mesh seat, curved mesh back and adjustable arms.
 */
export default class Chair {
    group: THREE.Group;
    frame: THREE.Material;
    mesh: THREE.Material;

    constructor() {
        this.group = new THREE.Group();
        this.group.position.copy(CHAIR.position);
        this.group.rotation.y = CHAIR.rotationY;
        this.group.scale.setScalar(MM);

        this.frame = new THREE.MeshStandardMaterial({
            color: CHAIR.frameColor,
            roughness: 0.45,
            metalness: 0.35,
        });
        this.mesh = new THREE.MeshStandardMaterial({
            color: CHAIR.meshColor,
            roughness: 0.9,
            metalness: 0,
            transparent: true,
            opacity: 0.86,
            side: THREE.DoubleSide,
        });

        this.createBase();
        this.createSeat();
        this.createBack();
        this.createArms();
    }

    add(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
    }

    createBase() {
        // Five legs on casters
        for (let i = 0; i < 5; i++) {
            const leg = new THREE.Group();
            leg.rotation.y = (i / 5) * Math.PI * 2 + 0.3;

            const arm = this.add(
                leg,
                new RoundedBoxGeometry(310, 26, 48, 2, 10),
                this.frame
            );
            arm.position.set(175, 78, 0);
            arm.rotation.z = -0.1;

            const caster = this.add(
                leg,
                new THREE.SphereGeometry(30, 16, 12),
                this.frame
            );
            caster.position.set(325, 30, 0);

            this.group.add(leg);
        }

        // Hub, gas lift and the tilt mechanism under the seat
        const hub = this.add(
            this.group,
            new THREE.CylinderGeometry(42, 48, 70, 24),
            this.frame
        );
        hub.position.y = 95;
        const lift = this.add(
            this.group,
            new THREE.CylinderGeometry(24, 30, 300, 20),
            this.frame
        );
        lift.position.y = 270;
        const mechanism = this.add(
            this.group,
            new RoundedBoxGeometry(230, 60, 280, 2, 18),
            this.frame
        );
        mechanism.position.set(0, 425, -20);
    }

    createSeat() {
        const rim = this.add(
            this.group,
            new RoundedBoxGeometry(530, 36, 490, 3, 16),
            this.frame
        );
        rim.position.set(0, 462, 20);
        const pad = this.add(
            this.group,
            new RoundedBoxGeometry(490, 34, 450, 3, 16),
            this.mesh
        );
        pad.position.set(0, 478, 20);
    }

    createBack() {
        // Leans back slightly, pivoting from behind the seat
        const back = new THREE.Group();
        back.position.set(0, 480, -215);
        back.rotation.x = -0.14;

        const radius = 430;
        const spread = 0.58;
        const height = 580;
        const start = Math.PI - spread;
        const centreY = 100 + height / 2;

        const arc = (r: number, h: number) =>
            new THREE.CylinderGeometry(r, r, h, 28, 1, true, start, spread * 2);

        // Curved mesh panel with a rim top and bottom
        const panel = this.add(back, arc(radius, height), this.mesh);
        panel.position.set(0, centreY, radius);
        for (const y of [100, 100 + height]) {
            const band = this.add(back, arc(radius + 3, 30), this.frame);
            band.position.set(0, y, radius);
        }

        // Side rails
        const railX = radius * Math.sin(spread);
        const railZ = radius - radius * Math.cos(spread);
        for (const side of [-1, 1]) {
            const rail = this.add(
                back,
                new RoundedBoxGeometry(26, height + 30, 30, 2, 10),
                this.frame
            );
            rail.position.set(side * railX, centreY, railZ);
        }

        // Spine and lumbar support
        const spine = this.add(
            back,
            new RoundedBoxGeometry(70, 470, 34, 2, 12),
            this.frame
        );
        spine.position.set(0, 200, -30);
        const lumbar = this.add(
            back,
            new RoundedBoxGeometry(290, 80, 24, 2, 10),
            this.frame
        );
        lumbar.position.set(0, 250, -14);

        this.group.add(back);
    }

    createArms() {
        for (const side of [-1, 1]) {
            const post = this.add(
                this.group,
                new RoundedBoxGeometry(34, 250, 46, 2, 12),
                this.frame
            );
            post.position.set(side * 295, 560, -40);
            const pad = this.add(
                this.group,
                new RoundedBoxGeometry(78, 30, 260, 3, 14),
                this.frame
            );
            pad.position.set(side * 295, 695, 10);
        }
    }
}
