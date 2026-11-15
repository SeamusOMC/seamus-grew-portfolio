import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import Application from '../Application';
import UIEventBus from '../UI/EventBus';
import { FLOOR_Y, LAMP, SCREEN } from './SetupConfig';

// How long the room takes to fade between light and dark, in milliseconds
const FADE_MS = 450;

// The paper tag tied to the cord, in world units
const TAG = { width: 190, height: 280, corner: 45, hole: 38 };
// Handwriting font for the tag, with fallbacks until it has loaded
const TAG_FONT = 'Caveat, "Segoe Script", "Ink Free", "Bradley Hand", cursive';

/**
 * The room's lighting, and the floor lamp whose pull cord switches it.
 *
 * With the lamp on the room is bright. Pulling the cord turns the lamp off:
 * the room goes dark, lit only by the monitor, the PC and anything else that
 * glows, and the desktop on the monitor switches to its dark theme.
 */
export default class RoomLight {
    application: Application;
    scene: THREE.Scene;

    dark: boolean;
    // 0 when the room is fully light, 1 when fully dark
    amount: number;
    monitorOn: boolean;

    sky: THREE.HemisphereLight;
    sun: THREE.DirectionalLight;
    shadowCatcher: THREE.ShadowMaterial;
    lampLight: THREE.PointLight;
    monitorLight: THREE.PointLight;
    lampGlow: THREE.MeshStandardMaterial[];
    // The baked backdrop and decor are unlit, so they are darkened by tint
    tinted: { material: THREE.MeshBasicMaterial; dark: THREE.Color }[];

    cord: THREE.Group;
    tagCanvas: HTMLCanvasElement;
    tagTexture: THREE.CanvasTexture;
    pull: number;

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.dark = false;
        this.amount = 0;
        this.monitorOn = true;
        this.lampGlow = [];
        this.tinted = [];
        this.pull = 0;

        this.createLights();
        this.createLamp();
        this.createCordButton();
        this.collectBakedMaterials();

        UIEventBus.on('monitorPower', (on: boolean) => {
            this.monitorOn = on;
        });
    }

    createLights() {
        // The baked models are unlit, so these only affect the desk setup
        this.sky = new THREE.HemisphereLight(0xffffff, 0x8a8a96, 0.75);
        this.scene.add(this.sky);

        const sun = new THREE.DirectionalLight(0xffffff, 0.85);
        sun.position.set(-5000, 9000, 7000);
        sun.target.position.set(0, -2000, 0);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.camera.left = -6000;
        sun.shadow.camera.right = 6000;
        sun.shadow.camera.top = 6000;
        sun.shadow.camera.bottom = -6000;
        sun.shadow.camera.near = 1000;
        sun.shadow.camera.far = 26000;
        sun.shadow.bias = -0.0005;
        sun.shadow.normalBias = 12;
        sun.shadow.radius = 6;
        this.sun = sun;
        this.scene.add(sun);
        this.scene.add(sun.target);

        // Catches the desk's shadow on the (unlit) baked floor
        this.shadowCatcher = new THREE.ShadowMaterial({
            opacity: 0.22,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            polygonOffsetUnits: -4,
        });
        const catcher = new THREE.Mesh(
            new THREE.PlaneGeometry(16000, 16000),
            this.shadowCatcher
        );
        catcher.rotation.x = -Math.PI / 2;
        catcher.position.y = FLOOR_Y + 4;
        catcher.receiveShadow = true;
        this.scene.add(catcher);

        // The glow of the screen on the desk, seen once the room is dark
        this.monitorLight = new THREE.PointLight(0xa9c8ff, 0, 4200, 2);
        this.monitorLight.position.set(
            SCREEN.position.x,
            SCREEN.position.y,
            SCREEN.position.z + 420
        );
        this.scene.add(this.monitorLight);
    }

    /**
     * A floor lamp beside the desk, with a pull cord hanging under the shade
     */
    createLamp() {
        const lamp = new THREE.Group();
        lamp.position.copy(LAMP.position);

        const metal = new THREE.MeshStandardMaterial({
            color: LAMP.standColor,
            roughness: 0.4,
            metalness: 0.6,
        });
        const top = LAMP.height;

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(330, 350, 44, 40),
            metal
        );
        base.position.y = 22;
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(22, 22, top, 16),
            metal
        );
        pole.position.y = top / 2;
        for (const part of [base, pole]) {
            part.castShadow = true;
            part.receiveShadow = true;
            lamp.add(part);
        }

        // Shade, bulb and the fitting that holds them
        const shadeMaterial = new THREE.MeshStandardMaterial({
            color: LAMP.shadeColor,
            emissive: 0xffd9a0,
            emissiveIntensity: 0.55,
            roughness: 0.9,
            side: THREE.DoubleSide,
        });
        const shade = new THREE.Mesh(
            new THREE.CylinderGeometry(250, 430, 520, 40, 1, true),
            shadeMaterial
        );
        shade.position.y = top + 110;
        shade.castShadow = true;

        const bulbMaterial = new THREE.MeshStandardMaterial({
            color: 0xfff4dc,
            emissive: 0xffe2b0,
            emissiveIntensity: 1,
        });
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(95, 24, 16), bulbMaterial);
        bulb.position.y = top + 70;
        const fitting = new THREE.Mesh(
            new THREE.CylinderGeometry(40, 40, 110, 16),
            metal
        );
        fitting.position.y = top - 20;
        lamp.add(shade, bulb, fitting);
        this.lampGlow.push(shadeMaterial, bulbMaterial);

        this.lampLight = new THREE.PointLight(0xffd9a0, 0.55, 5200, 2);
        this.lampLight.position.y = top - 60;
        lamp.add(this.lampLight);

        // Pull cord with a wooden toggle on the end
        this.cord = new THREE.Group();
        this.cord.position.set(LAMP.cordOffset, top - 150, 0);
        const string = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 4, LAMP.cordLength, 8),
            new THREE.MeshStandardMaterial({ color: 0xe9e4d6, roughness: 0.9 })
        );
        string.position.y = -LAMP.cordLength / 2;
        const toggle = new THREE.Mesh(
            new THREE.CylinderGeometry(20, 28, 90, 16),
            new THREE.MeshStandardMaterial({ color: 0x9a6a3c, roughness: 0.6 })
        );
        toggle.position.y = -LAMP.cordLength - 40;
        toggle.castShadow = true;
        this.cord.add(string, toggle, this.createTag());
        lamp.add(this.cord);

        this.scene.add(lamp);
    }

    /**
     * A handwritten paper tag tied under the toggle, saying what a pull will do
     */
    createTag() {
        const tag = new THREE.Group();
        const top = -LAMP.cordLength - 85;
        const { width, height, corner, hole } = TAG;

        // Thread from the toggle to the hole in the tag
        const thread = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 26 + hole, 6),
            new THREE.MeshStandardMaterial({ color: 0xe9e4d6, roughness: 0.9 })
        );
        thread.position.y = top - (26 + hole) / 2;
        tag.add(thread);

        // The card hangs a little crooked
        const card = new THREE.Group();
        card.position.set(0, top - 26, 6);
        card.rotation.set(0, -0.14, 0.09);

        const outline = new THREE.Shape();
        outline.moveTo(-width / 2 + corner, 0);
        outline.lineTo(width / 2 - corner, 0);
        outline.lineTo(width / 2, -corner);
        outline.lineTo(width / 2, -height);
        outline.lineTo(-width / 2, -height);
        outline.lineTo(-width / 2, -corner);
        outline.closePath();
        const punched = new THREE.Path();
        punched.absarc(0, -hole, 12, 0, Math.PI * 2, true);
        outline.holes.push(punched);

        const paper = new THREE.Mesh(
            new THREE.ExtrudeGeometry(outline, { depth: 5, bevelEnabled: false }),
            new THREE.MeshStandardMaterial({ color: 0xd9cfae, roughness: 0.9 })
        );
        paper.castShadow = true;
        card.add(paper);

        // The writing, on a sheet covering the front of the card
        this.tagCanvas = document.createElement('canvas');
        this.tagCanvas.width = width * 2;
        this.tagCanvas.height = height * 2;
        this.tagTexture = new THREE.CanvasTexture(this.tagCanvas);
        this.tagTexture.encoding = THREE.sRGBEncoding;
        this.tagTexture.anisotropy = 8;
        const face = new THREE.Mesh(
            new THREE.PlaneGeometry(width, height),
            new THREE.MeshStandardMaterial({
                map: this.tagTexture,
                alphaTest: 0.5,
                roughness: 0.9,
            })
        );
        face.position.set(0, -height / 2, 5.6);
        card.add(face);
        tag.add(card);

        this.drawTag();
        // Redraw once the handwriting font has arrived
        new FontFace('Caveat', 'url(fonts/caveat.woff2)')
            .load()
            .then((font) => {
                document.fonts.add(font);
                this.drawTag();
            })
            .catch(() => {});

        return tag;
    }

    /**
     * Writes the tag: "dark mode" with a moon while the light is on, and
     * "light mode" with a sun once it is off
     */
    drawTag() {
        const context = this.tagCanvas.getContext('2d');
        if (!context) return;
        const scale = this.tagCanvas.width / TAG.width;
        const w = this.tagCanvas.width;
        const h = this.tagCanvas.height;
        const corner = TAG.corner * scale;
        const paper = '#f4ecd6';
        const ink = '#2a2833';

        const trace = (inset: number) => {
            context.beginPath();
            context.moveTo(corner + inset * 0.4, inset);
            context.lineTo(w - corner - inset * 0.4, inset);
            context.lineTo(w - inset, corner + inset * 0.4);
            context.lineTo(w - inset, h - inset);
            context.lineTo(inset, h - inset);
            context.lineTo(inset, corner + inset * 0.4);
            context.closePath();
        };

        context.clearRect(0, 0, w, h);
        trace(0);
        context.fillStyle = paper;
        context.fill();

        // Stitched border and the reinforced hole
        trace(16);
        context.setLineDash([12, 9]);
        context.strokeStyle = '#c4b385';
        context.lineWidth = 3;
        context.stroke();
        context.setLineDash([]);
        const holeY = TAG.hole * scale;
        context.beginPath();
        context.arc(w / 2, holeY, 12 * scale + 12, 0, Math.PI * 2);
        context.fillStyle = '#d8c79a';
        context.fill();
        context.globalCompositeOperation = 'destination-out';
        context.beginPath();
        context.arc(w / 2, holeY, 12 * scale, 0, Math.PI * 2);
        context.fill();
        context.globalCompositeOperation = 'source-over';

        // A little moon or sun doodle
        const doodleY = 190;
        context.fillStyle = ink;
        context.strokeStyle = ink;
        context.lineCap = 'round';
        if (this.dark) {
            context.beginPath();
            context.arc(w / 2, doodleY, 30, 0, Math.PI * 2);
            context.fill();
            context.lineWidth = 7;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + 0.2;
                context.beginPath();
                context.moveTo(w / 2 + Math.cos(angle) * 44, doodleY + Math.sin(angle) * 44);
                context.lineTo(w / 2 + Math.cos(angle) * 62, doodleY + Math.sin(angle) * 62);
                context.stroke();
            }
        } else {
            context.beginPath();
            context.arc(w / 2 - 6, doodleY, 46, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = paper;
            context.beginPath();
            context.arc(w / 2 + 18, doodleY - 14, 40, 0, Math.PI * 2);
            context.fill();
        }

        // The handwriting, on a slight slant
        context.save();
        context.translate(w / 2, 0);
        context.rotate(-0.07);
        context.fillStyle = ink;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = 'bold 132px ' + TAG_FONT;
        context.fillText(this.dark ? 'light' : 'dark', 0, 350);
        context.fillText('mode', 0, 462);
        context.restore();

        this.tagTexture.needsUpdate = true;
    }

    /**
     * The cord is drawn in WebGL, which cannot be clicked, so an invisible
     * HTML button is placed over it in the 3D scene to take the click.
     */
    createCordButton() {
        // Covers the cord, the toggle and the tag
        const width = 320;
        const height = LAMP.cordLength + 220 + TAG.height + 60;

        const button = document.createElement('div');
        button.id = 'light-cord';
        button.title = 'Pull the cord';
        button.setAttribute('role', 'button');
        button.style.cssText = `width:${width}px;height:${height}px;cursor:pointer;`;
        button.addEventListener('mousedown', () => this.toggle());

        const object = new CSS3DObject(button);
        object.position.set(
            LAMP.position.x + LAMP.cordOffset,
            LAMP.position.y + LAMP.height - 150 - height / 2 + 40,
            LAMP.position.z
        );
        this.application.cssScene.add(object);
    }

    collectBakedMaterials() {
        const world = this.application.world;
        this.tinted.push(
            {
                material: world.environment.bakedModel.material,
                dark: new THREE.Color(0x0e1016),
            },
            {
                material: world.decor.bakedModel.material,
                dark: new THREE.Color(0x343842),
            }
        );
    }

    toggle() {
        this.dark = !this.dark;
        this.pull = 1;
        this.drawTag();
        UIEventBus.dispatch('darkMode', this.dark);
    }

    update(delta: number) {
        // Fade towards light or dark
        const step = delta / FADE_MS;
        const target = this.dark ? 1 : 0;
        if (this.amount < target) this.amount = Math.min(target, this.amount + step);
        if (this.amount > target) this.amount = Math.max(target, this.amount - step);
        const t = this.amount;
        const mix = (light: number, dark: number) => light + (dark - light) * t;

        this.sky.intensity = mix(0.75, 0.07);
        this.sun.intensity = mix(0.85, 0.05);
        this.sun.color.setRGB(mix(1, 0.6), mix(1, 0.72), 1);
        this.shadowCatcher.opacity = mix(0.22, 0.08);
        this.lampLight.intensity = mix(0.55, 0);
        this.monitorLight.intensity = this.monitorOn ? mix(0, 1.1) : 0;
        this.lampGlow[0].emissiveIntensity = mix(0.55, 0);
        this.lampGlow[1].emissiveIntensity = mix(1, 0);

        for (const { material, dark } of this.tinted) {
            material.color.setRGB(
                mix(1, dark.r),
                mix(1, dark.g),
                mix(1, dark.b)
            );
        }

        // The cord dips when pulled, then springs back
        if (this.pull > 0) {
            this.pull = Math.max(0, this.pull - delta / 320);
            this.cord.position.y =
                LAMP.height - 150 - Math.sin(this.pull * Math.PI) * 130;
        }
    }
}
