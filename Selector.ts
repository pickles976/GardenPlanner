import * as THREE from 'three';
import { Editor } from "./Editor";

class Selector {

    editor: Editor
    oldColor?: THREE.Color;
    currentMousedOverObject?: THREE.Object3D;
    currentSelectedObject?: THREE.Object3D;

    constructor (editor: Editor) {
        this.editor = editor;
        this.oldColor = undefined;
        this.currentMousedOverObject = undefined;
        this.currentSelectedObject = undefined;
    }

    private getCanvasRelativePosition(event) {
        const rect = this.editor.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * this.editor.canvas.width  / rect.width,
            y: (event.clientY - rect.top ) * this.editor.canvas.height / rect.height,
        };
    }

    public performRaycast(event, callback: (editor: Editor, selector: Selector, object?: THREE.Object3D) => void) : boolean {

        const pos = this.getCanvasRelativePosition(event);
        const pickPosition = new THREE.Vector2();
        pickPosition.x = (pos.x / this.editor.canvas.width ) *  2 - 1;
        pickPosition.y = (pos.y / this.editor.canvas.height) * -2 + 1;  // note we flip Y

        this.editor.raycaster.setFromCamera( pickPosition, this.editor.camera );

        // const intersects = raycaster.intersectObjects( interactiveObjects );
        const intersects = this.editor.raycaster.intersectObjects(this.editor.scene.children);

        if ( intersects.length > 0 ) {

            const intersection = intersects[ 0 ];
            const object = intersection.object;

            callback(this.editor, this, object);

            return true;

        } else {

            callback(this.editor, this, undefined);

            return false;

        }

    }

}

export { Selector };




