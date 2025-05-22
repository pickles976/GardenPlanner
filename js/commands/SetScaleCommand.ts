import * as THREE from 'three';
import { Command } from './Command';

class SetScaleCommand extends Command {

    object: THREE.Object3D
    startScale: THREE.Vector3
    endScale: THREE.Vector3

    constructor (object: THREE.Object3D, startScale: THREE.Vector3, endScale: THREE.Vector3) {
        super();
        this.object = object;
        this.startScale = startScale;
        this.endScale = endScale;
    }

    public execute() {
        this.object.scale.set(...this.endScale);
    }

    public undo() {
        this.object.scale.set(...this.startScale)
    }

}

export { SetScaleCommand };