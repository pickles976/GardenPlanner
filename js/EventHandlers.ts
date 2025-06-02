import * as THREE from 'three';
import { Editor } from './Editor';
import { Selector } from './Selector';
import { render } from './Rendering';
import { eventBus } from './EventBus';
import { EditorMode } from './Constants';

function handleMouseMoveObjectMode(editor: Editor, object?: THREE.Mesh, point?: THREE.Vector3){
    const selector = editor.selector;

    if (selector.currentMousedOverObject === object) {
        return
    }

    // If object is unselectable
    if (object === undefined) {
        // Un-highlight old mouseOverObject
        if (selector.currentMousedOverObject !== undefined) { 
            selector.currentMousedOverObject.material.emissive.setHex(0x000000)
        } 
        selector.currentMousedOverObject = undefined;
    } else {
        // Un-highlight old mouseOverObject
        if (selector.currentMousedOverObject !== undefined) {
            selector.currentMousedOverObject.material.emissive.setHex(0x000000)
        }

        // Highlight new mouseOverObject
        selector.currentMousedOverObject = object;
        object.material.emissive.setHex(0xFFFF00);

    }
}

function handleMouseMoveBedEditorMode(editor: Editor, object?: THREE.Mesh, point?: THREE.Vector3) {
    if (point === undefined) {
        return
    }
    editor.bedEditor.updateMousePosition(point);
}

export function handleMouseMove(editor: Editor, object?: THREE.Mesh, point?: THREE.Vector3) {
    /**
     * Function that highlights objects when the mouse is over them, and returns them to their original color once the mouse has left.
     */

    let callback;
    switch(editor.mode) {
        case EditorMode.OBJECT:
            callback = handleMouseMoveObjectMode;
            break;
        case EditorMode.BED:
            callback = handleMouseMoveBedEditorMode;
            break;
        default:
            break
    }
    if (callback !== undefined) {
        callback(editor, object, point)
    }


}

function handleMouseClickObjectMode(editor: Editor, object?: THREE.Mesh, point?: THREE.Vector3) {
    // Don't do anything if we are actively using the transform controls
    if (editor.selector.isUsingTransformControls === true) {
        return
    }

    editor.selector.select(object)
}

function handleMouseClickBedEditorMode(editor: Editor, object?: THREE.Mesh, point?: THREE.Vector3) {
    if (point === undefined) {
        return
    }

    if (object === undefined) {
        if (editor.selector.currentSelectedObject === undefined) {
            editor.bedEditor.createBedVertex(point);
        }
    } else {
        editor.selector.select(object)
    }

}

export function handleMouseClick(editor: Editor, object?: THREE.Mesh, point?: THREE.Vector3) {

    let callback;
    switch(editor.mode) {
        case EditorMode.OBJECT:
            callback = handleMouseClickObjectMode;
            break;
        case EditorMode.BED:
            callback = handleMouseClickBedEditorMode;
            break;
        default:
            break
    }
    if (callback !== undefined) {
        callback(editor, object, point)
    }
}


export function handleKeyDown(event, editor: Editor) {
    switch ( event.key ) {

        case 't':
            editor.transformControls.setMode( 'translate' );
            break;

        case 'r':
            editor.transformControls.setMode( 'rotate' );
            break;

        case 's':
            editor.transformControls.setMode( 'scale' );
            break;

        case '+':
        case '=':
            editor.transformControls.setSize( editor.transformControls.size + 0.1 );
            break;

        case '-':
        case '_':
            editor.transformControls.setSize( Math.max( editor.transformControls.size - 0.1, 0.1 ) );
            break;

        case 'x':
            editor.transformControls.showX = ! editor.transformControls.showX;
            break;

        case 'y':
            editor.transformControls.showY = ! editor.transformControls.showY;
            break;

        case 'z':

            if (event.ctrlKey) {
                editor.undo();
            } else {
                editor.transformControls.showZ = ! editor.transformControls.showZ;
            }

            break;

        case ' ':
            editor.transformControls.enabled = ! editor.transformControls.enabled;
            break;

        case 'Escape':
            editor.selector.deselect();
            break;

    }
}
