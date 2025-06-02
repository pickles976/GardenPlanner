import * as THREE from 'three';
import { Command } from './Command';
import { eventBus } from '../EventBus';

class SetScaleCommand extends Command {

    object: THREE.Object3D
    startScale: THREE.Vector3
    endScale: THREE.Vector3

    constructor (object: THREE.Object3D, startScale: THREE.Vector3, endScale: THREE.Vector3) {
        super();
        this.name = "SetScaleCommand";
        this.updateable = true;
        this.object = object;
        this.startScale = startScale;
        this.endScale = endScale;
    }

    public canUpdate(newCommand: Command): boolean {
        return this.name === newCommand.name && this.updateable && this.object.uuid === newCommand.object.uuid;
    }

    public update(newCommand: SetScaleCommand) {
        this.endScale = newCommand.endScale;
    }

    public execute() {
        this.object.scale.set(...this.endScale);
        eventBus.emit('objectChanged', this.object);
    }

    public undo() {
        this.object.scale.set(...this.startScale);
        eventBus.emit('objectChanged', this.object);
    }

}

export { SetScaleCommand };