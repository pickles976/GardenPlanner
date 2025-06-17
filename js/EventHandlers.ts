import * as THREE from 'three';
import { Editor } from './Editor';
import { Selector } from './Selector';
import { render } from './Rendering';
import { eventBus } from './EventBus';
import { EditorMode, LayerEnum } from './Constants';
import { BLACK, YELLOW } from './Colors';
import { SetPositionCommand } from './commands/SetPositionCommand';
import { Vector3 } from 'three';
import { snapper } from './Snapping';

export function processIntersections(intersections) {
    if (intersections.length > 0) {
        const intersection = intersections[ 0 ];
        return [intersection.object, intersection.point]
    }
    return [undefined, undefined];
}

// TODO: CLEAN THIS UP
function performRaycast(event, editor, callback, layers){

    const selector = editor.selector;
    let intersections = selector.performRaycast(event, layers);
    callback(editor, intersections);

    return (intersections.length > 0) ? true : false;
}

function highlightMouseOverObject(editor: Editor, intersections) {

    const [object, point] = processIntersections(intersections)

    const selector = editor.selector;

    if (selector.currentMousedOverObject === object) {
        return
    }

    // If object is selectable
    if (object.userData.selectable === true) {

        // Un-highlight old mouseOverObject
        if (selector.currentMousedOverObject !== undefined) {
            if (Array.isArray(selector.currentMousedOverObject.material)) {
                selector.currentMousedOverObject.material.forEach((mat) => mat.emissive.setHex(0x000000));
            } else {
                selector.currentMousedOverObject.material.emissive.setHex(0x000000);
            }
        }

        // Highlight new mouseOverObject
        selector.currentMousedOverObject = object;
        if (Array.isArray(selector.currentMousedOverObject.material)) {
            selector.currentMousedOverObject.material.forEach((mat) => mat.emissive.setHex(0xFFFF00));
        } else {
            selector.currentMousedOverObject.material.emissive.setHex(0xFFFF00);
        }

    } else {
        // Un-highlight old mouseOverObject
        if (selector.currentMousedOverObject !== undefined) { 
            if (Array.isArray(selector.currentMousedOverObject.material)) {
                selector.currentMousedOverObject.material.forEach((mat) => mat.emissive.setHex(0x000000));
            } else {
                selector.currentMousedOverObject.material.emissive.setHex(0x000000);
            }
        } 
        selector.currentMousedOverObject = undefined;
    }
}

export function handleMouseMoveObjectMode(editor: Editor, intersections){

    const [object, point] = processIntersections(intersections)

    const selector = editor.selector;

    if (selector.currentSelectedObject) {

        if (selector.advancedTransformMode) {
            // Transform handles already handle the transforming
        } else {
            const box = new THREE.Box3().setFromObject(selector.currentSelectedObject);
            const size = new THREE.Vector3();
            box.getSize(size);

            let newPos = point.add(new Vector3(0,0,size.z / 2))
            newPos = snapper.snap(newPos);
            editor.execute(new SetPositionCommand(selector.currentSelectedObject, selector.currentSelectedObject.position, newPos))
        }

    } 

    highlightMouseOverObject(editor, intersections)

}

export function handleTransformControlsChange(editor) {
    editor.selector.drawRotationVisualizer()
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
            callback = (editor, intersections) => editor.bedEditor.handleMouseMove(editor, intersections);;
            layers = [LayerEnum.Objects, LayerEnum.BedVertices]
            break;
        default:
            break
    }

    performRaycast(event, editor, callback, layers)

}

export function handleMouseClickObjectMode(editor: Editor, intersections) {

    const [object, point] = processIntersections(intersections)

    // Don't do anything if we are actively using the transform controls
    if (editor.selector.isUsingTransformControls === true) {
        return
    }

    if (object.userData.selectable === true) {
        editor.selector.select(object)
    } else {
        editor.selector.deselect()
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
            callback = (editor, intersections) => editor.bedEditor.handleMouseClick(editor, intersections);
            layers = [LayerEnum.Objects, LayerEnum.BedVertices]
            break;
        default:
            break
    }

    performRaycast(event, editor, callback, layers)
}

export function handleKeyDown(event, editor: Editor, sidebar) {

    // UI Keypress events
    sidebar.handleKeyDown(event)

    // Editor keypress events
    switch (editor.mode) {
        case EditorMode.OBJECT:
            editor.handleKeyDown(event)
            break;
        case EditorMode.BED:
            editor.bedEditor.handleKeyDown(event)
            break;
        default:
            break;
    }
}
