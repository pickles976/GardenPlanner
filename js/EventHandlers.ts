import * as THREE from 'three';
import { Editor } from './Editor';
import { Selector } from './Selector';
import { render } from './Rendering';
import { eventBus } from './EventBus';
import { EditorMode, LayerEnums } from './Constants';

// TODO: CLEAN THIS UP
function performRaycast(event, editor, callback, layers){

    const selector = editor.selector;
    let intersections = selector.performRaycast(event, layers);
    if ( intersections.length > 0 ) {

        const intersection = intersections[ 0 ];
        const object = intersection.object;
        const point = intersection.point;

        callback(editor, object, point);
        return true;

    } else {

        callback(editor, undefined, undefined);
        return false;

    }
}

export function handleMouseMoveObjectMode(editor: Editor, object?: THREE.Mesh, point?: THREE.Vector3){
    const selector = editor.selector;

    if (selector.currentMousedOverObject === object) {
        return
    }

    // If object is selectable
    if (object.userData.selectable === true) {

        // Un-highlight old mouseOverObject
        if (selector.currentMousedOverObject !== undefined) {
            selector.currentMousedOverObject.material.emissive.setHex(0x000000)
        }

        // Highlight new mouseOverObject
        selector.currentMousedOverObject = object;
        object.material.emissive.setHex(0xFFFF00);

    } else {
        // Un-highlight old mouseOverObject
        if (selector.currentMousedOverObject !== undefined) { 
            selector.currentMousedOverObject.material.emissive.setHex(0x000000)
        } 
        selector.currentMousedOverObject = undefined;
    }
}

export function handleMouseMove(event, editor) {
    /**
     * Function that highlights objects when the mouse is over them, and returns them to their original color once the mouse has left.
     */

    let callback;
    let layers = []
    switch(editor.mode) {
        case EditorMode.OBJECT:
            callback = handleMouseMoveObjectMode;
            break;
        case EditorMode.BED:
            callback = (editor, object, point) => editor.bedEditor.handleMouseMove(editor, object, point);;
            layers = [LayerEnums.Objects, LayerEnums.BedVertices]
            break;
        default:
            break
    }

    performRaycast(event, editor, callback, layers)

}

export function handleMouseClickObjectMode(editor: Editor, object?: THREE.Mesh, point?: THREE.Vector3) {

    // Don't do anything if we are actively using the transform controls
    if (editor.selector.isUsingTransformControls === true) {
        return
    }

    if (object.userData.selectable === true) {
        editor.selector.select(object)
    }
}

export function handleMouseClick(event, editor) {

    // Only do a raycast if the LMB was used
    if (event.button !== 0) {
        return
    }

    let callback;
    let layers = [];
    switch(editor.mode) {
        case EditorMode.OBJECT:
            callback = handleMouseClickObjectMode;
            break;
        case EditorMode.BED:
            callback = (editor, object, point) => editor.bedEditor.handleMouseClick(editor, object, point);
            layers = [LayerEnums.Objects, LayerEnums.BedVertices]
            break;
        default:
            break
    }

    performRaycast(event, editor, callback, layers)
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
                switch (editor.mode) {
                    case EditorMode.OBJECT:
                        editor.undo();
                        break;
                    case EditorMode.BED:
                        editor.bedEditor.undo();
                        break;
                    default:
                        break;
                }
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
