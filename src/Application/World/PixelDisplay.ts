import * as THREE from 'three';

/**
 * The animation shown on the little pixel display on the desk: a flaming eye
 * on top of a dark tower that blinks and looks around, with the current time
 * underneath.
 *
 * It is drawn on a 32x32 grid, then scaled up onto a canvas as LED dots.
 */

const GRID = 32;
const CELL = 8;
const FRAME_MS = 90;

const BACKGROUND = '#050203';
const TOWER = '#1b1b22';
const TOWER_EDGE = '#30303c';
const CLOCK = '#ffb43a';

const EYE_X = 15.5;
const EYE_Y = 8;

// 3x5 digits, one string per row
const DIGITS: { [digit: string]: string[] } = {
    '0': ['###', '# #', '# #', '# #', '###'],
    '1': [' # ', '## ', ' # ', ' # ', '###'],
    '2': ['###', '  #', '###', '#  ', '###'],
    '3': ['###', '  #', '###', '  #', '###'],
    '4': ['# #', '# #', '###', '  #', '  #'],
    '5': ['###', '#  ', '###', '  #', '###'],
    '6': ['###', '#  ', '###', '# #', '###'],
    '7': ['###', '  #', '  #', '  #', '  #'],
    '8': ['###', '# #', '###', '# #', '###'],
    '9': ['###', '# #', '###', '  #', '###'],
};

export default class PixelDisplay {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D | null;
    texture: THREE.CanvasTexture;
    pixels: string[];
    lastFrame: number;

    lookX: number;
    lookY: number;
    targetX: number;
    targetY: number;
    nextLook: number;
    blinkStart: number;
    nextBlink: number;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = GRID * CELL;
        this.canvas.height = GRID * CELL;
        this.context = this.canvas.getContext('2d');
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.encoding = THREE.sRGBEncoding;
        this.pixels = new Array(GRID * GRID).fill(BACKGROUND);
        this.lastFrame = -Infinity;

        this.lookX = 0;
        this.lookY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.nextLook = 0;
        this.blinkStart = -Infinity;
        this.nextBlink = 2500;

        this.update(0);
    }

    set(x: number, y: number, color: string) {
        if (x < 0 || y < 0 || x >= GRID || y >= GRID) return;
        this.pixels[y * GRID + x] = color;
    }

    /**
     * Sets a pixel and its mirror image on the other side of the tower
     */
    mirror(x: number, y: number, color: string) {
        this.set(x, y, color);
        this.set(GRID - 1 - x, y, color);
    }

    update(elapsed: number) {
        if (elapsed - this.lastFrame < FRAME_MS) return;
        this.lastFrame = elapsed;

        this.animate(elapsed);
        this.drawSky();
        this.drawTower();
        this.drawEye(elapsed);
        this.drawClock();
        this.render();
    }

    animate(elapsed: number) {
        // Pick somewhere new to look every so often
        if (elapsed >= this.nextLook) {
            const centre = Math.random() < 0.3;
            this.targetX = centre ? 0 : Math.random() * 2 - 1;
            this.targetY = centre ? 0 : Math.random() * 2 - 1;
            this.nextLook = elapsed + 700 + Math.random() * 1900;
        }
        this.lookX += (this.targetX - this.lookX) * 0.35;
        this.lookY += (this.targetY - this.lookY) * 0.35;

        if (elapsed >= this.nextBlink) {
            this.blinkStart = elapsed;
            this.nextBlink = elapsed + 2800 + Math.random() * 4200;
        }
    }

    /**
     * How open the eye is, from 0 (shut) to 1 (wide open)
     */
    openness(elapsed: number) {
        const progress = (elapsed - this.blinkStart) / 420;
        if (progress < 0 || progress > 1) return 1;
        return Math.abs(1 - progress * 2);
    }

    drawSky() {
        for (let y = 0; y < GRID; y++) {
            for (let x = 0; x < GRID; x++) {
                let color = BACKGROUND;
                if (y < 25) {
                    // Red glow around the eye
                    const distance = Math.hypot(x - EYE_X, (y - EYE_Y) * 1.4);
                    const glow = Math.max(0, 1 - distance / 14);
                    const flicker = 0.85 + Math.random() * 0.15;
                    const red = Math.round(8 + 95 * glow * glow * flicker);
                    const green = Math.round(2 + 14 * glow * glow);
                    color = `rgb(${red},${green},3)`;
                }
                this.pixels[y * GRID + x] = color;
            }
        }
    }

    drawTower() {
        // Body, widening towards the ground
        for (let y = 13; y < 25; y++) {
            const half = 3 + Math.floor((y - 13) * 0.5);
            for (let x = 16 - half; x <= 15 + half; x++) {
                const edge = x === 16 - half || x === 15 + half;
                this.set(x, y, edge ? TOWER_EDGE : TOWER);
            }
        }

        // The two horns that hold the eye, and the cradle between them
        for (let y = 5; y <= 13; y++) {
            this.mirror(5, y, TOWER_EDGE);
            this.mirror(6, y, TOWER);
        }
        this.mirror(6, 4, TOWER_EDGE);
        this.mirror(6, 3, TOWER_EDGE);
        this.mirror(7, 2, TOWER_EDGE);
        for (let x = 7; x <= 12; x++) {
            this.mirror(x, 13, TOWER_EDGE);
            if (x >= 9) this.mirror(x, 14, TOWER);
        }

        // Lit windows
        const windows = [
            [15, 17],
            [16, 20],
            [13, 22],
            [18, 23],
        ];
        for (const [x, y] of windows) {
            this.set(x, y, Math.random() < 0.85 ? '#ff7a1a' : '#8a3208');
        }
    }

    drawEye(elapsed: number) {
        const open = this.openness(elapsed);

        if (open < 0.12) {
            // Shut: a glowing slit
            for (let x = 8; x <= 23; x++) this.set(x, EYE_Y, '#8a2208');
            return;
        }

        const halfHeight = 3.7 * open;
        for (let y = 3; y <= 12; y++) {
            for (let x = 7; x <= 24; x++) {
                const dx = (x - EYE_X) / 8.6;
                const dy = (y - EYE_Y) / halfHeight;
                const lens = 1 - dx * dx;
                if (lens <= 0 || Math.abs(dy) > lens) continue;

                // Hot yellow core, orange flame, red rim
                const depth = Math.abs(dy) / lens;
                let color = '#ff8a1c';
                if (depth < 0.5 && Math.abs(dx) < 0.62) color = '#ffe66b';
                else if (depth > 0.8 || Math.abs(dx) > 0.86) color = '#e23a0a';
                if (color !== '#ffe66b' && Math.random() < 0.12) {
                    color = color === '#e23a0a' ? '#ff8a1c' : '#ffb02e';
                }
                this.set(x, y, color);
            }
        }

        // Slit pupil
        const pupilX = Math.round(15 + this.lookX * 4.2);
        const pupilY = EYE_Y + Math.round(this.lookY * 0.8);
        const pupilHalf = Math.max(1, Math.round(2.6 * open));
        for (let y = pupilY - pupilHalf; y <= pupilY + pupilHalf; y++) {
            const tip = y === pupilY - pupilHalf || y === pupilY + pupilHalf;
            this.set(pupilX, y, '#0a0000');
            if (!tip) this.set(pupilX + 1, y, '#0a0000');
        }
    }

    drawClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const top = 26;

        const drawDigit = (digit: string, left: number) => {
            DIGITS[digit].forEach((row, y) => {
                for (let x = 0; x < 3; x++) {
                    if (row[x] === '#') this.set(left + x, top + y, CLOCK);
                }
            });
        };

        drawDigit(hours[0], 8);
        drawDigit(hours[1], 12);
        drawDigit(minutes[0], 18);
        drawDigit(minutes[1], 22);

        // Colon, blinking once a second
        if (now.getSeconds() % 2 === 0) {
            this.set(16, top + 1, CLOCK);
            this.set(16, top + 3, CLOCK);
        }
    }

    render() {
        if (!this.context) return;
        this.context.fillStyle = '#000000';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        for (let y = 0; y < GRID; y++) {
            for (let x = 0; x < GRID; x++) {
                this.context.fillStyle = this.pixels[y * GRID + x];
                this.context.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
            }
        }
        this.texture.needsUpdate = true;
    }
}
