import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import Application from '../Application';
import Camera from '../Camera/Camera';
import EventEmitter from '../Utils/EventEmitter';
import UIEventBus from '../UI/EventBus';
import { SCREEN } from './SetupConfig';

// The page shown on the monitor. It lives in static/os and is served
// alongside this site.
const SCREEN_URL = 'os/index.html';

// Events the page on the monitor forwards to this window
const FORWARDED_EVENTS = [
    'mousemove',
    'mousedown',
    'mouseup',
    'keydown',
    'keyup',
];

export default class MonitorScreen extends EventEmitter {
    application: Application;
    scene: THREE.Scene;
    cssScene: THREE.Scene;
    screenSize: THREE.Vector2;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    camera: Camera;
    prevInComputer: boolean;
    shouldLeaveMonitor: boolean;
    inComputer: boolean;
    mouseClickInProgress: boolean;
    dimmingPlane: THREE.Mesh;
    iframe: HTMLIFrameElement;
    glare: THREE.Mesh;
    poweredOn: boolean;

    constructor() {
        super();
        this.application = new Application();
        this.scene = this.application.scene;
        this.cssScene = this.application.cssScene;
        this.screenSize = new THREE.Vector2(SCREEN.width, SCREEN.height);
        this.camera = this.application.camera;
        this.position = new THREE.Vector3().copy(SCREEN.position);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.mouseClickInProgress = false;
        this.shouldLeaveMonitor = false;

        // Create screen
        this.initializeScreenEvents();
        this.createIframe();
        this.createPerspectiveDimmer();
        this.createGlare();
        this.createPowerButton();
    }

    initializeScreenEvents() {
        document.addEventListener(
            'mousemove',
            (event) => {
                // @ts-ignore
                const id = event.target.id;
                if (id === 'computer-screen' || id === 'monitor-power') {
                    // @ts-ignore
                    event.inComputer = true;
                }

                // @ts-ignore
                this.inComputer = event.inComputer;

                if (this.inComputer && !this.prevInComputer) {
                    this.camera.trigger('enterMonitor');
                }

                if (
                    !this.inComputer &&
                    this.prevInComputer &&
                    !this.mouseClickInProgress
                ) {
                    this.camera.trigger('leftMonitor');
                }

                if (
                    !this.inComputer &&
                    this.mouseClickInProgress &&
                    this.prevInComputer
                ) {
                    this.shouldLeaveMonitor = true;
                } else {
                    this.shouldLeaveMonitor = false;
                }

                this.application.mouse.trigger('mousemove', [event]);

                this.prevInComputer = this.inComputer;
            },
            false
        );
        document.addEventListener(
            'mousedown',
            (event) => {
                // @ts-ignore
                this.inComputer = event.inComputer;
                this.application.mouse.trigger('mousedown', [event]);

                this.mouseClickInProgress = true;
                this.prevInComputer = this.inComputer;
            },
            false
        );
        document.addEventListener(
            'mouseup',
            (event) => {
                // @ts-ignore
                this.inComputer = event.inComputer;
                this.application.mouse.trigger('mouseup', [event]);

                if (this.shouldLeaveMonitor) {
                    this.camera.trigger('leftMonitor');
                    this.shouldLeaveMonitor = false;
                }

                this.mouseClickInProgress = false;
                this.prevInComputer = this.inComputer;
            },
            false
        );
    }

    /**
     * Creates the iframe for the computer screen
     */
    createIframe() {
        // Create container
        const container = document.createElement('div');
        container.style.width = this.screenSize.width + 'px';
        container.style.height = this.screenSize.height + 'px';
        container.style.opacity = '1';
        container.style.background = '#000';

        // Create iframe
        const iframe = document.createElement('iframe');
        this.iframe = iframe;
        this.poweredOn = true;

        // Bubble mouse and key events to the main application, so we can
        // affect the camera and play sounds
        window.addEventListener('message', (event) => {
            const data = event.data;
            if (!data || !FORWARDED_EVENTS.includes(data.type)) return;

            const evt = new CustomEvent(data.type, {
                bubbles: true,
                cancelable: false,
            });

            // @ts-ignore
            evt.inComputer = true;
            if (data.type === 'mousemove') {
                const { top, left, width, height } =
                    iframe.getBoundingClientRect();
                const widthRatio = width / this.screenSize.width;
                const heightRatio = height / this.screenSize.height;

                // @ts-ignore
                evt.clientX = Math.round(data.clientX * widthRatio + left);
                //@ts-ignore
                evt.clientY = Math.round(data.clientY * heightRatio + top);
            } else if (data.type === 'keydown' || data.type === 'keyup') {
                // @ts-ignore
                evt.key = String(data.key);
            }

            iframe.dispatchEvent(evt);
        });

        // Keep the desktop's theme in step with the room's lighting
        let dark = false;
        const sendTheme = () => {
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'theme', dark }, '*');
            }
        };
        iframe.addEventListener('load', sendTheme);
        UIEventBus.on('darkMode', (value: boolean) => {
            dark = value;
            sendTheme();
        });

        // Set iframe attributes
        iframe.src = SCREEN_URL;
        iframe.style.width = this.screenSize.width + 'px';
        iframe.style.height = this.screenSize.height + 'px';
        iframe.style.boxSizing = 'border-box';
        iframe.style.opacity = '1';
        iframe.style.border = '0';
        iframe.id = 'computer-screen';
        iframe.title = 'Séamus Grew - Portfolio';

        // Add iframe to container
        container.appendChild(iframe);

        // Create CSS plane
        this.createCssPlane(container);
    }

    /**
     * Creates a CSS plane and GL plane to properly occlude the CSS plane
     * @param element the element to create the css plane for
     */
    createCssPlane(
        element: HTMLElement,
        width = this.screenSize.width,
        height = this.screenSize.height,
        position = this.position
    ) {
        // Create CSS3D object
        const object = new CSS3DObject(element);

        // copy monitor position and rotation
        object.position.copy(position);
        object.rotation.copy(this.rotation);

        // Add to CSS scene
        this.cssScene.add(object);

        // Create GL plane
        const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
        material.side = THREE.DoubleSide;
        material.opacity = 0;
        material.transparent = true;
        // NoBlending allows the GL plane to occlude the CSS plane
        material.blending = THREE.NoBlending;
        // Keeps the plane in front of the monitor casing just behind it
        material.polygonOffset = true;
        material.polygonOffsetFactor = -4;
        material.polygonOffsetUnits = -4;

        // Create plane geometry
        const geometry = new THREE.PlaneGeometry(width, height);

        // Create the GL plane mesh
        const mesh = new THREE.Mesh(geometry, material);

        // Copy the position, rotation and scale of the CSS plane to the GL plane
        mesh.position.copy(object.position);
        mesh.rotation.copy(object.rotation);
        mesh.scale.copy(object.scale);

        // Add to gl scene
        this.scene.add(mesh);
    }

    /**
     * Dims the screen when it is viewed from far away or at an angle
     */
    createPerspectiveDimmer() {
        const material = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            color: 0x000000,
            transparent: true,
            blending: THREE.AdditiveBlending,
        });

        const plane = new THREE.PlaneGeometry(
            this.screenSize.width,
            this.screenSize.height
        );

        const mesh = new THREE.Mesh(plane, material);

        mesh.position.copy(this.position);
        mesh.position.z += 3;
        mesh.rotation.copy(this.rotation);

        this.dimmingPlane = mesh;

        this.scene.add(mesh);
    }

    /**
     * The reflection of the room on the glass, seen when the screen is off
     */
    createGlare() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 576;
        const context = canvas.getContext('2d');
        if (context) {
            // A soft sheen across the glass
            const sheen = context.createLinearGradient(0, 0, 1024, 576);
            sheen.addColorStop(0, 'rgba(255,255,255,0.10)');
            sheen.addColorStop(0.45, 'rgba(255,255,255,0.02)');
            sheen.addColorStop(1, 'rgba(255,255,255,0)');
            context.fillStyle = sheen;
            context.fillRect(0, 0, 1024, 576);

            // Two window panes reflected at an angle
            context.filter = 'blur(14px)';
            context.fillStyle = 'rgba(255,255,255,0.20)';
            for (const x of [560, 760]) {
                context.beginPath();
                context.moveTo(x, 40);
                context.lineTo(x + 170, 70);
                context.lineTo(x + 130, 400);
                context.lineTo(x - 40, 350);
                context.closePath();
                context.fill();
            }

            // A lamp
            context.filter = 'blur(30px)';
            context.fillStyle = 'rgba(255,255,255,0.22)';
            context.beginPath();
            context.arc(230, 150, 60, 0, Math.PI * 2);
            context.fill();
        }

        const material = new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(canvas),
            transparent: true,
            opacity: 0,
            depthWrite: false,
        });
        this.glare = new THREE.Mesh(
            new THREE.PlaneGeometry(this.screenSize.width, this.screenSize.height),
            material
        );
        this.glare.position.copy(this.position);
        this.glare.position.z += 5;
        this.glare.visible = false;
        this.scene.add(this.glare);
    }

    /**
     * The power button on the monitor's chin. It is a real HTML button placed
     * in the 3D scene, so it can be clicked.
     */
    createPowerButton() {
        const width = 56;
        const height = 36;

        const button = document.createElement('div');
        button.id = 'monitor-power';
        button.title = 'Monitor power';
        button.setAttribute('role', 'button');
        button.style.cssText = `width:${width}px;height:${height}px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;background:#1b1c20;border:2px solid #3a3c42;border-radius:10px;color:#d6d9de;cursor:pointer;`;
        button.innerHTML =
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" style="pointer-events:none"><path d="M12 3v8"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0"/></svg>';
        button.addEventListener('mouseenter', () => {
            button.style.borderColor = '#8b9099';
        });
        button.addEventListener('mouseleave', () => {
            button.style.borderColor = '#3a3c42';
        });
        button.addEventListener('mousedown', () => {
            this.setPower(!this.poweredOn);
        });

        // Bottom right of the chin, sitting on the front of the casing
        const position = new THREE.Vector3(
            this.position.x + this.screenSize.width / 2 - 60,
            this.position.y - this.screenSize.height / 2 - 31,
            this.position.z - 6
        );
        this.createCssPlane(button, width, height, position);
    }

    setPower(on: boolean) {
        this.poweredOn = on;
        this.iframe.style.visibility = on ? 'visible' : 'hidden';
        this.glare.visible = !on;
        // @ts-ignore
        this.glare.material.opacity = on ? 0 : 1;
        UIEventBus.dispatch('monitorPower', on);
    }

    update() {
        if (this.dimmingPlane) {
            const planeNormal = new THREE.Vector3(0, 0, 1);
            const viewVector = new THREE.Vector3();
            viewVector.copy(this.camera.instance.position);
            viewVector.sub(this.position);
            viewVector.normalize();

            const dot = viewVector.dot(planeNormal);

            const distance = this.camera.instance.position.distanceTo(
                this.dimmingPlane.position
            );

            const opacity = 1 / (distance / 10000);

            const DIM_FACTOR = 0.7;

            // @ts-ignore
            this.dimmingPlane.material.opacity =
                (1 - opacity) * DIM_FACTOR + (1 - dot) * DIM_FACTOR;
        }
    }
}
