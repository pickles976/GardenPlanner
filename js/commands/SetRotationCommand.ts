import * as THREE from 'three';
import { Command } from './Command';
import { eventBus, EventEnums } from '../EventBus';

class SetRotationCommand extends Command {

    object: THREE.Object3D
    startQuaternion: THREE.Quaternion
    endQuaternion: THREE.Quaternion

    constructor (object: THREE.Object3D, startQuaternion: THREE.Quaternion, endQuaternion: THREE.Quaternion) {
        super();
        this.name = "SetRotationCommand";
        this.updateable = true;
        this.object = object;
        this.startQuaternion = startQuaternion.clone();
        this.endQuaternion = endQuaternion.clone();
    }

    public canUpdate(newCommand: Command): boolean {
        return this.name === newCommand.name && this.updateable && this.object.uuid === newCommand.object.uuid;
    }

    public update(newCommand: SetRotationCommand) {
        this.endQuaternion = newCommand.endQuaternion;
    }

    public execute() {
        this.object.quaternion.set(...this.endQuaternion);
        eventBus.emit(EventEnums.OBJECT_CHANGED, this.object);
    }

    public undo() {
        this.object.quaternion.set(...this.startQuaternion);
        eventBus.emit(EventEnums.OBJECT_CHANGED, this.object);
    }

}

export { SetRotationCommand };