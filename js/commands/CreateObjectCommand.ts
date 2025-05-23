import * as THREE from 'three';
import { Command } from './Command';
import { Editor } from '../Editor';

class CreateObjectCommand extends Command {

    object: THREE.Object3D
    editor: Editor;

    constructor (object: THREE.Object3D, editor: Editor) {
        super();
        this.object = object;
        this.editor = editor;
    }

    public execute() {
        this.editor.add(this.object);
    }

    public undo() {
        this.editor.remove(this.object);
    }

}

export { CreateObjectCommand };