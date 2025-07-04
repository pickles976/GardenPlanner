import * as THREE from 'three';
import { Command } from './Command';
import { eventBus, EventEnums } from '../EventBus';

class SetVisibilityCommand extends Command {

    object: THREE.Object3D
    visibility: boolean;

    constructor (object: THREE.Object3D, visibility: boolean) {
        super();
        this.name = "SetVisibilityCommand"
        this.updateable = true
        this.object = object;
        this.visibility = visibility;
    }

    public canUpdate(newCommand: Command) : boolean {
        return this.name === newCommand.name && this.updateable
    }

    public update(newCommand: SetVisibilityCommand) {
        this.visibility = newCommand.visibility;
    }

    public execute() {
        this.object.visible = this.visibility;
        eventBus.emit(EventEnums.OBJECT_CHANGED, this.object);
    }

    public undo() {
        this.object.visible = !this.visibility;
        eventBus.emit(EventEnums.OBJECT_CHANGED, this.object);
    }

}

export { SetVisibilityCommand };