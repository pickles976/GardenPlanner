import * as THREE from 'three';
import { Command } from './Command';
import { Editor } from '../Editor';

class DeleteObjectCommand extends Command {

    object: THREE.Object3D
    editor: Editor;

    constructor (object: THREE.Object3D, editor: Editor) {
        super();
        this.name = "DeleteObjectCommand"
        this.updateable = false
        this.object = object;
        this.editor = editor;
    }

    public canUpdate(newCommand: Command) : boolean {
        return this.name === newCommand.name && this.updateable
    }

    public execute() {
        // Deselect object before deleting
        this.editor.selector.deselect()
        this.editor.remove(this.object)
    }

    public undo() {
        this.editor.add(this.object);
    }

}

export { DeleteObjectCommand };