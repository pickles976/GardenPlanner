import * as THREE from 'three';
import { Command } from './Command';

class MoveObjectCommand extends Command {

    object: THREE.Object3D
    startPosition: THREE.Vector3
    endPosition: THREE.Vector3

    constructor (object: THREE.Object3D, startPosition: THREE.Vector3, endPosition: THREE.Vector3) {
        super();
        this.object = object;
        this.startPosition = startPosition;
        this.endPosition = endPosition;
    }

    public execute() {
        this.object.position.set(...this.endPosition);
    }

    public undo() {
        this.object.position.set(...this.startPosition)
    }

}

export { MoveObjectCommand };