import * as THREE from 'three';
import Application from '../Application';
import BakedModel from '../Utils/BakedModel';
import Resources from '../Utils/Resources';
import { BAKED_FLOOR_Y, FLOOR_Y } from './SetupConfig';

// The baked decor pieces that are used. The coffee mug sits on the desk and
// the plant stands on the floor beside it.
const KEEP = ['coffee', 'plant'];

export default class Decor {
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
            this.resources.items.gltfModel.decorModel,
            this.resources.items.texture.decorTexture,
            900
        );
    }

    setModel() {
        const model = this.bakedModel.getModel();

        for (const child of [...model.children]) {
            if (!KEEP.includes(child.name)) model.remove(child);
            else child.castShadow = true;
        }

        // Move the plant down to the lowered floor and clear of the desk
        const plant = model.getObjectByName('plant');
        if (plant) {
            plant.position.y += FLOOR_Y - BAKED_FLOOR_Y;
            plant.position.x += 500;
        }

        this.scene.add(model);
    }
}
