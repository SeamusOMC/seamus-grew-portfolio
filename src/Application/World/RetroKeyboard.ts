import * as THREE from 'three';
// @ts-ignore
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { KEYBOARD } from './SetupConfig';

/**
 * A retro-styled tenkeyless mechanical keyboard: cream case, cream and grey
 * keycaps with red legends, red Esc / B / A keys, and a control strip along
 * the top with two dials, three buttons and a power switch.
 *
 * The back of the keyboard points away from the viewer (towards -z).
 */

type Kind = 'alpha' | 'mod' | 'red' | 'arrow';
type Key = { x: number; row: number; width: number; label: string; kind: Kind };

// Size of one key unit, and how far each row sits from the top of the keys
const UNIT = 68;
const ROWS = [0, 1.2, 2.2, 3.2, 4.2, 5.2];
const KEYS_WIDE = 18.25;
const KEYS_DEEP = 6.2;

const CAP_HEIGHT = 30;
const CASE_HEIGHT = 46;
const STRIP_DEPTH = 96;
const MARGIN = 34;

const createLayout = (): Key[] => {
    const keys: Key[] = [];
    const add = (row: number, x: number, label: string, kind: Kind = 'alpha', width = 1) => {
        keys.push({ row, x, width, label, kind });
        return x + width;
    };
    const run = (row: number, x: number, labels: string, kind: Kind = 'alpha') => {
        for (const label of labels.split(' ')) x = add(row, x, label, kind);
        return x;
    };
    // The block of navigation keys to the right of the main keys
    const side = 15.25;

    // Function row
    add(0, 0, 'Esc', 'red');
    run(0, 2, 'F1 F2 F3 F4');
    run(0, 6.5, 'F5 F6 F7 F8');
    run(0, 11, 'F9 F10 F11 F12');
    run(0, side, 'PrtSc ScrLk Pause', 'mod');

    // Number row
    let x = run(1, 0, '` 1 2 3 4 5 6 7 8 9 0 - =');
    add(1, x, 'Backspace', 'mod', 2);
    run(1, side, 'Insert Home PgUp', 'mod');

    x = add(2, 0, 'Tab', 'mod', 1.5);
    x = run(2, x, 'Q W E R T Y U I O P [ ]');
    add(2, x, '\\', 'alpha', 1.5);
    run(2, side, 'Delete End PgDn', 'mod');

    x = add(3, 0, 'Caps Lock', 'mod', 1.75);
    x = run(3, x, "A S D F G H J K L ; '");
    add(3, x, 'Enter', 'mod', 2.25);

    x = add(4, 0, 'Shift', 'mod', 2.25);
    x = run(4, x, 'Z X C V B N M , . /');
    add(4, x, 'Shift', 'mod', 2.75);
    add(4, side + 1, '▲', 'arrow');

    x = add(5, 0, 'Ctrl', 'mod', 1.25);
    x = add(5, x, 'Win', 'mod', 1.25);
    x = add(5, x, 'Alt', 'mod', 1.25);
    x = add(5, x, '', 'alpha', 6.25);
    x = add(5, x, 'Alt Gr', 'mod', 1.25);
    x = add(5, x, 'B', 'red');
    x = add(5, x, 'A', 'red');
    add(5, x, 'Ctrl', 'mod', 1.75);
    run(5, side, '◀ ▼ ▶', 'arrow');

    return keys;
};

export default class RetroKeyboard {
    group: THREE.Group;
    width: number;
    depth: number;

    constructor() {
        this.group = new THREE.Group();
        this.group.position.copy(KEYBOARD.position);

        this.width = KEYS_WIDE * UNIT + MARGIN * 2;
        this.depth = KEYS_DEEP * UNIT + STRIP_DEPTH + MARGIN * 2;

        this.createCase();
        this.createKeys(createLayout());
        this.createControlStrip();
        this.createCable();
    }

    material(color: number, roughness = 0.7) {
        // Colours are written as they should appear on screen, so convert
        // them to the renderer's working colour space
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color(color).convertSRGBToLinear(),
            roughness,
            metalness: 0,
        });
    }

    add(mesh: THREE.Mesh, x: number, y: number, z: number, shadow = true) {
        mesh.position.set(x, y, z);
        mesh.castShadow = shadow;
        mesh.receiveShadow = shadow;
        this.group.add(mesh);
        return mesh;
    }

    // Where the key area starts, at the back left
    get keysLeft() {
        return -this.width / 2 + MARGIN;
    }

    get keysBack() {
        return -this.depth / 2 + MARGIN + STRIP_DEPTH;
    }

    createCase() {
        // A darker foot under a cream body
        this.add(
            new THREE.Mesh(
                new RoundedBoxGeometry(this.width - 8, 16, this.depth - 8, 3, 7),
                this.material(KEYBOARD.trimColor)
            ),
            0,
            8,
            0
        );
        this.add(
            new THREE.Mesh(
                new RoundedBoxGeometry(this.width, CASE_HEIGHT - 12, this.depth, 3, 14),
                this.material(KEYBOARD.caseColor, 0.6)
            ),
            0,
            12 + (CASE_HEIGHT - 12) / 2,
            0
        );
    }

    createKeys(keys: Key[]) {
        const materials: { [kind in Kind]: THREE.Material } = {
            alpha: this.material(KEYBOARD.alphaColor, 0.65),
            mod: this.material(KEYBOARD.modColor, 0.65),
            red: this.material(KEYBOARD.redColor, 0.55),
            arrow: this.material(KEYBOARD.arrowColor, 0.65),
        };
        const geometries: { [width: number]: THREE.BufferGeometry } = {};

        for (const key of keys) {
            if (!geometries[key.width]) {
                geometries[key.width] = new RoundedBoxGeometry(
                    key.width * UNIT - 8,
                    CAP_HEIGHT,
                    UNIT - 8,
                    2,
                    9
                );
            }
            this.add(
                new THREE.Mesh(geometries[key.width], materials[key.kind]),
                this.keysLeft + (key.x + key.width / 2) * UNIT,
                CASE_HEIGHT + CAP_HEIGHT / 2 - 4,
                this.keysBack + (ROWS[key.row] + 0.5) * UNIT
            );
        }

        // The legends are drawn once, on a sheet lying just above the keycaps
        const sheet = new THREE.Mesh(
            new THREE.PlaneGeometry(KEYS_WIDE * UNIT, KEYS_DEEP * UNIT),
            new THREE.MeshStandardMaterial({
                map: this.createLegendTexture(keys),
                alphaTest: 0.35,
                roughness: 0.8,
            })
        );
        sheet.rotation.x = -Math.PI / 2;
        sheet.position.set(
            this.keysLeft + (KEYS_WIDE * UNIT) / 2,
            CASE_HEIGHT + CAP_HEIGHT - 3.4,
            this.keysBack + (KEYS_DEEP * UNIT) / 2
        );
        this.group.add(sheet);
    }

    createLegendTexture(keys: Key[]) {
        const scale = 112;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(KEYS_WIDE * scale);
        canvas.height = Math.round(KEYS_DEEP * scale);
        const context = canvas.getContext('2d');
        if (context) {
            const colors: { [kind in Kind]: string } = {
                alpha: '#c5283a',
                mod: '#3a2b30',
                red: '#ffffff',
                arrow: '#17181a',
            };
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            for (const key of keys) {
                if (!key.label) continue;
                const single = key.label.length === 1;
                const size = single ? (key.kind === 'red' ? 58 : 46) : 21;
                context.font = `bold ${size}px Arial, Helvetica, sans-serif`;
                context.fillStyle = colors[key.kind];
                context.fillText(
                    key.label,
                    (key.x + key.width / 2) * scale,
                    (ROWS[key.row] + 0.5) * scale + 2
                );
            }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        texture.anisotropy = 8;
        return texture;
    }

    /**
     * The strip above the keys: two dials, three buttons, a name plate, a
     * ribbed panel and the power switch
     */
    createControlStrip() {
        const dark = this.material(KEYBOARD.arrowColor, 0.5);
        const z = -this.depth / 2 + MARGIN + STRIP_DEPTH / 2 - 8;
        const left = -this.width / 2 + MARGIN;
        const right = this.width / 2 - MARGIN;
        const y = CASE_HEIGHT;

        // Dials, each with a pointer ridge
        for (const [i, turn] of [0.5, -0.4].entries()) {
            const x = left + 40 + i * 78;
            this.add(
                new THREE.Mesh(new THREE.CylinderGeometry(27, 30, 34, 24), dark),
                x,
                y + 17,
                z
            );
            const ridge = this.add(
                new THREE.Mesh(new THREE.BoxGeometry(8, 10, 54), dark),
                x,
                y + 37,
                z
            );
            ridge.rotation.y = turn;
        }

        // Round buttons
        for (let i = 0; i < 3; i++) {
            this.add(
                new THREE.Mesh(new THREE.CylinderGeometry(23, 23, 12, 24), dark),
                left + 200 + i * 66,
                y + 6,
                z
            );
        }

        // Name plate and ribbed panel
        const plate = (width: number, texture: THREE.Texture) =>
            new THREE.Mesh(
                new THREE.BoxGeometry(width, 4, 62),
                [
                    dark,
                    dark,
                    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 }),
                    dark,
                    dark,
                    dark,
                ]
            );
        this.add(plate(420, this.createPlateTexture()), left + 610, y + 2, z, false);
        this.add(plate(190, this.createRibTexture()), left + 935, y + 2, z, false);

        // Power switch
        this.add(
            new THREE.Mesh(new RoundedBoxGeometry(96, 12, 40, 2, 5), dark),
            right - 62,
            y + 5,
            z
        );
        this.add(
            new THREE.Mesh(
                new THREE.SphereGeometry(15, 16, 12),
                this.material(KEYBOARD.redColor, 0.4)
            ),
            right - 38,
            y + 10,
            z
        );
    }

    createPlateTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 76;
        const context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = '#4c4d53';
            context.fillRect(0, 0, 512, 76);
            context.fillStyle = '#c5283a';
            context.textBaseline = 'middle';
            context.font = 'bold 30px Arial, Helvetica, sans-serif';
            context.fillText(KEYBOARD.plateText[0], 22, 26);
            context.font = 'bold 17px Arial, Helvetica, sans-serif';
            context.fillText(KEYBOARD.plateText[1], 22, 56);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        return texture;
    }

    createRibTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = '#d9d5c4';
            context.fillRect(0, 0, 256, 64);
            context.fillStyle = '#8f8d84';
            for (let x = 3; x < 256; x += 8) context.fillRect(x, 0, 3, 64);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        return texture;
    }

    /**
     * White cable from the back of the keyboard, running under the monitor
     */
    createCable() {
        const back = -this.depth / 2;
        const path = new THREE.CatmullRomCurve3([
            new THREE.Vector3(60, 24, back + 6),
            new THREE.Vector3(60, 10, back - 70),
            new THREE.Vector3(20, 2, back - 230),
            new THREE.Vector3(70, -4, back - 430),
            new THREE.Vector3(120, -4, back - 620),
        ]);
        const cable = new THREE.Mesh(
            new THREE.TubeGeometry(path, 48, 6.5, 8, false),
            this.material(0xecebe6, 0.6)
        );
        cable.castShadow = true;
        this.group.add(cable);
    }
}
