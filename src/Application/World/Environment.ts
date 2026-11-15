import * as THREE from 'three';
import Application from '../Application';
import BakedModel from '../Utils/BakedModel';
import Resources from '../Utils/Resources';
import { BAKED_FLOOR_Y, FLOOR_Y } from './SetupConfig';

// The only part of the baked environment that is used: the floor and backdrop
const KEEP = ['Background'];

export default class Environment {
    application: Application;
    scene: THREE.Scene;
    resources: Resources;
    bakedModel: BakedModel;

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.resources = this.application.resources;

        this.bakeModel();
        this.setModel();
    }

    bakeModel() {
        this.bakedModel = new BakedModel(
            this.resources.items.gltfModel.environmentModel,
            this.resources.items.texture.environmentTexture,
            900
        );
    }

    setModel() {
        const model = this.bakedModel.getModel();

        // Drop the baked desk and chair, they are replaced by DeskSetup
        for (const child of [...model.children]) {
            if (!KEEP.includes(child.name)) model.remove(child);
        }

        // Lower the floor so the desk stands at standing-desk height
        model.position.y = FLOOR_Y - BAKED_FLOOR_Y;

        this.scene.add(model);
    }

    update() {}
}
