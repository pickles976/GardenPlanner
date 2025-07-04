import * as THREE from 'three';
import { Command } from './Command';
import { eventBus, EventEnums } from '../EventBus';

class SetValueCommand extends Command {

    object: THREE.Object3D
    field: string;
    value: any;
    oldValue: any;

    constructor (object: THREE.Object3D, field: string, value: any, oldValue: any) {
        super();
        this.name = "SetValueCommand"
        this.updateable = true
        this.object = object;
        this.field = field;
        this.value = value;
        this.oldValue = oldValue;
    }

    public canUpdate(newCommand: Command) : boolean {
        return this.name === newCommand.name && 
            this.field == newCommand.field && 
            this.updateable
    }

    public update(newCommand: SetValueCommand) {
        this.value = newCommand.value;
    }

    public execute() {
        this.object[this.field] = this.value;
        eventBus.emit(EventEnums.OBJECT_CHANGED, this.object);
    }

    public undo() {
        this.object[this.field]  = this.oldValue;
        eventBus.emit(EventEnums.OBJECT_CHANGED, this.object);
    }

}

export { SetValueCommand };