import * as THREE from 'three';

/**
 * Shared dimensions and colours for the desk setup.
 *
 * Everything here is in world units (roughly 1 unit = 0.28mm), so these are
 * the numbers to tweak when matching the scene to the real setup.
 */

// Height of the desk surface. The baked decor (coffee mug) sits at this height.
export const DESK_SURFACE_Y = -450;

// The baked environment has its floor at this height...
export const BAKED_FLOOR_Y = -2988;
// ...and it is lowered to here so the desk stands at standing-desk height.
export const FLOOR_Y = -4300;

export const DESK = {
    width: 5000,
    depth: 2400,
    thickness: 70,
    centerZ: 100,
    legInset: 500,
    topColor: 0x8a6a4a,
    frameColor: 0x18191b,
};

// The screen is a 16:9 panel. The page shown on it is rendered at this size
// in CSS pixels, so the inner site is designed for 1600x900.
export const SCREEN = {
    width: 1600,
    height: 900,
    position: new THREE.Vector3(0, 450, -200),
};

export const MONITOR = {
    bezelColor: 0x101113,
    standColor: 0x1b1c1f,
    logoText: 'AOC',
};

// Corsair Crystal Series 680X RGB: a wide dual-chamber case with glass on
// the front, side and top of the main chamber, and red LED fans.
export const PC = {
    width: 1230,
    height: 1800,
    depth: 1510,
    // Width of the glass-walled main chamber; the rest is the closed chamber
    mainWidth: 800,
    position: new THREE.Vector3(1880, DESK_SURFACE_Y, -250),
    caseColor: 0x0c0d0f,
    interiorColor: 0x17181c,
    ledColor: 0xff1414,
};

// Divoom Ditoo pixel display. Drawn larger than life so its screen can be read.
export const DITOO = {
    scale: 1.5,
    position: new THREE.Vector3(-1560, DESK_SURFACE_Y, 330),
    rotationY: 0.35,
    bodyColor: 0xe9e6df,
    keyColor: 0x8fd3a5,
};

// Ergonomic mesh office chair, standing on the floor in front of the desk
export const CHAIR = {
    position: new THREE.Vector3(-1150, FLOOR_Y, 2500),
    // Math.PI faces the desk; the extra turn leaves it at a casual angle
    rotationY: Math.PI + 0.5,
    frameColor: 0x1a1b1e,
    meshColor: 0x25272b,
};

// Picture frames on the desk. Each image is a file in static/. To add a
// frame, copy an entry and change the image, position and size.
export const PICTURE_FRAMES = [
    {
        image: 'images/frame-farm.jpg',
        position: new THREE.Vector3(-2110, DESK_SURFACE_Y, -480),
        rotationY: 0.4,
        width: 760,
        height: 430,
        frameColor: 0x2a2019,
    },
    {
        image: 'images/frame-graduation.jpg',
        position: new THREE.Vector3(-1150, DESK_SURFACE_Y, -640),
        rotationY: 0.22,
        width: 440,
        height: 620,
        frameColor: 0x15161a,
    },
];

// Belfast City Marathon finisher's medal, hanging on a small stand
export const MEDAL = {
    position: new THREE.Vector3(1045, DESK_SURFACE_Y, -480),
    rotationY: -0.25,
    scale: 1.15,
    ribbonColor: '#1668c9',
    ribbonStripe: '#5fb2f2',
    // Shown on the left of the name plate: name, then a smaller line under it
    charity: ['Air Ambulance', 'NORTHERN IRELAND'],
};

// Desk mat, which the keyboard and mouse sit on
export const MAT = {
    thickness: 6,
    color: 0x15161a,
};

// Retro-styled mechanical keyboard
export const KEYBOARD = {
    position: new THREE.Vector3(-100, DESK_SURFACE_Y + MAT.thickness, 860),
    caseColor: 0xd8d4c3,
    trimColor: 0x8e8c83,
    alphaColor: 0xe6e2d3,
    modColor: 0x74757c,
    arrowColor: 0x3f4045,
    redColor: 0xd3202d,
    // Two lines on the name plate above the keys
    plateText: ['SG-87', 'RETRO KEYBOARD'],
};

// Matching wireless mouse
export const MOUSE = {
    position: new THREE.Vector3(1010, DESK_SURFACE_Y + MAT.thickness, 900),
    rotationY: 0.06,
    width: 235,
    height: 135,
    length: 440,
    color: 0xe1ddce,
    panelColor: 0x74757c,
    buttonColor: 0xd3202d,
};

// Floor lamp beside the desk. Its pull cord switches the room between light
// and dark.
export const LAMP = {
    position: new THREE.Vector3(-3050, FLOOR_Y, -350),
    height: 5650,
    // How far the cord hangs out from the pole, towards the desk
    cordOffset: 230,
    cordLength: 640,
    standColor: 0x1b1c1f,
    shadeColor: 0xe9e2d0,
};
