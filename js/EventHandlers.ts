import * as THREE from 'three';
import { Vector3 } from 'three';
import { Editor } from './Editor';
import { snapper } from './Snapping';
import { EditorMode, LayerEnum } from './Constants';
import { SetPositionCommand } from './commands/SetPositionCommand';

const raycaster = new THREE.Raycaster();


export function processIntersections(intersections: THREE.Object3D[]) {
    /**
     * Get the closest intersection
     */
    if (intersections.length > 0) {
        const intersection = intersections[ 0 ];
        return [intersection.object, intersection.point]
    }
    return [undefined, undefined];
}

function filterCurrentlySelected(intersections: THREE.Object3D[], editor: Editor): THREE.Object3D[] {
    /**
     * Filter out the currently selected object
     */
    const selector = editor.selector;

    // Ignore selected object
    if (selector.currentSelectedObject) {
        intersections = intersections.filter((item) => item.object !== selector.currentSelectedObject)
    }

    return intersections
}

function getCanvasRelativePosition(event, editor: Editor) {
    const rect = editor.canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * editor.canvas.width  / rect.width,
        y: (event.clientY - rect.top ) * editor.canvas.height / rect.height,
    };
}

function performRaycast(event: Event, editor: Editor, layers: LayerEnum[]) : THREE.Object3D[] {

    // Set up layers        
    if (layers.length > 0) {
        raycaster.layers.disableAll();
        layers.forEach((layer) => { raycaster.layers.enable(layer)});
    } else {
        raycaster.layers.enableAll();
        raycaster.layers.disable(LayerEnum.NoRaycast);
    }

    // Get mouse position
    const pos = getCanvasRelativePosition(event, editor);
    const pickPosition = new THREE.Vector2();
    pickPosition.x = (pos.x / editor.canvas.width ) *  2 - 1;
    pickPosition.y = (pos.y / editor.canvas.height) * -2 + 1;  // note we flip Y

    raycaster.setFromCamera( pickPosition, editor.currentCamera );

    return raycaster.intersectObjects(editor.scene.children);

}

function highlightMouseOverObject(editor: Editor, intersections: THREE.Object3D[]) {

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

export function handleMouseMoveObjectMode(editor: Editor, intersections: THREE.Object3D[]){

    intersections = filterCurrentlySelected(intersections, editor)
    const [object, point] = processIntersections(intersections)

    const selector = editor.selector;
    if (selector.currentSelectedObject) {

        if (selector.advancedTransformMode) {
            // Transform handles already handle the transforming
        } else {
            // Move the object to the raycast point
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
     * Configure the raycaster, and pass intersections to the correct handler
     */

    switch(editor.mode) {
        case EditorMode.OBJECT:
            handleMouseMoveObjectMode(
                editor, 
                performRaycast(event, editor, []));
            break;
        case EditorMode.BED:
            editor.bedEditor.handleMouseMove(
                editor, 
                performRaycast(event, editor, [LayerEnum.Objects, LayerEnum.BedVertices]))
            break;
        default:
            break
    }
}

export function handleMouseClickObjectMode(editor: Editor, intersections: THREE.Object3D[]) {

    // Ignore currently selected object
    intersections = filterCurrentlySelected(intersections, editor);
    const [object, point] = processIntersections(intersections);

    // Don't do anything if we are actively using the transform controls
    if (editor.selector.isUsingTransformControls === true) {
        return
    }

    (object.userData.selectable === true) ? editor.selector.select(object) : editor.selector.deselect();
}

export function handleMouseClick(event, editor) {

    // Only do a raycast if the LMB was used
    if (event.button !== 0) {
        return
    }

    switch(editor.mode) {
        case EditorMode.OBJECT:
            handleMouseClickObjectMode(
                editor, 
                performRaycast(event, editor, []));
            break;
        case EditorMode.BED:
            editor.bedEditor.handleMouseClick(
                editor, 
                performRaycast(event, editor, [LayerEnum.Objects, LayerEnum.BedVertices]))
            break;
        default:
            break
    }

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
