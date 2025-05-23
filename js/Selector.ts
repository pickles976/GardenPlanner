import * as THREE from 'three';
import { Editor } from "./Editor";

const raycaster = new THREE.Raycaster();

class Selector {

    editor: Editor
    currentMousedOverObject?: THREE.Object3D;
    currentSelectedObject?: THREE.Object3D;
    transformControlsGizmo?: THREE.Object3D;
    isUsingTransformControls: boolean

    constructor (editor: Editor) {
        this.editor = editor;
        this.currentMousedOverObject = undefined;
        this.currentSelectedObject = undefined;
        this.transformControlsGizmo = undefined;
        this.isUsingTransformControls = false;
    }

    private getCanvasRelativePosition(event) {
        const rect = this.editor.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * this.editor.canvas.width  / rect.width,
            y: (event.clientY - rect.top ) * this.editor.canvas.height / rect.height,
        };
    }

    public performRaycast(event: Event) : THREE.Object3D[] {

        const pos = this.getCanvasRelativePosition(event);
        const pickPosition = new THREE.Vector2();
        pickPosition.x = (pos.x / this.editor.canvas.width ) *  2 - 1;
        pickPosition.y = (pos.y / this.editor.canvas.height) * -2 + 1;  // note we flip Y

        raycaster.setFromCamera( pickPosition, this.editor.camera );

        return raycaster.intersectObjects(this.editor.scene.children);

    }

}

export { Selector };




