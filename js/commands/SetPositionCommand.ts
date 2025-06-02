import * as THREE from 'three';
import { Command } from './Command';
import { eventBus } from '../EventBus';

class SetPositionCommand extends Command {

    object: THREE.Object3D
    startPosition: THREE.Vector3
    endPosition: THREE.Vector3

    constructor (object: THREE.Object3D, startPosition: THREE.Vector3, endPosition: THREE.Vector3) {
        super();
        this.name = "SetPositionCommand";
        this.updateable = true;
        this.object = object;
        this.startPosition = startPosition;
        this.endPosition = endPosition;
    }

    public canUpdate(newCommand: Command): boolean {
        return this.name === newCommand.name && this.updateable && this.object.uuid === newCommand.object.uuid;
    }

    public update(newCommand: SetPositionCommand) {
        this.endPosition = newCommand.endPosition.clone();
    }

    public execute() {
        this.object.position.set(...this.endPosition);
        eventBus.emit('objectChanged', this.object);
    }

    public undo() {
        this.object.position.set(...this.startPosition)
        eventBus.emit('objectChanged', this.object);
    }

}

export { SetPositionCommand };