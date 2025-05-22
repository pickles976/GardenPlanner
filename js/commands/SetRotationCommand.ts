import * as THREE from 'three';
import { Command } from './Command';

class SetRotationCommand extends Command {

    object: THREE.Object3D
    startQuaternion: THREE.Quaternion
    endQuaternion: THREE.Quaternion

    constructor (object: THREE.Object3D, startQuaternion: THREE.Quaternion, endQuaternion: THREE.Quaternion) {
        super();
        this.object = object;
        this.startQuaternion = startQuaternion;
        this.endQuaternion = endQuaternion;
    }

    public execute() {
        this.object.quaternion.set(...this.endQuaternion);
    }

    public undo() {
        this.object.quaternion.set(...this.startQuaternion)
    }

}

export { SetRotationCommand };