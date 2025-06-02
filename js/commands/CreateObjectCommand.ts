import * as THREE from 'three';
import { Command } from './Command';
import { Editor } from '../Editor';
import { eventBus } from '../EventBus';

class CreateObjectCommand extends Command {

    object: THREE.Object3D
    editor: Editor;

    constructor (object: THREE.Object3D, editor: Editor) {
        super();
        this.name = "CreateObjectCommand"
        this.updateable = false
        this.object = object;
        this.editor = editor;
    }

    public canUpdate(newCommand: Command) : boolean {
        return this.name === newCommand.name && this.updateable
    }

    public execute() {
        this.editor.add(this.object);
        eventBus.emit('requestRender', this.object);
    }

    public undo() {

        // Deselect object before deleting
        if (this.object === this.editor.selector.currentSelectedObject) {
            this.editor.selector.deselect();
        }
        this.editor.remove(this.object);
        eventBus.emit('requestRender', this.object);
    }

}

export { CreateObjectCommand };