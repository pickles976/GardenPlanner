import * as THREE from 'three';
import { Editor } from './Editor';
import { LayerEnum } from './Constants';
import { Menubar } from './menubar/Menubar';
import { Sidebar } from './sidebar/Sidebar';

const raycaster = new THREE.Raycaster();

// Utility functions

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

export function filterCurrentlySelected(intersections: THREE.Object3D[], editor: Editor): THREE.Object3D[] {
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

export function getCanvasRelativePosition(event, editor: Editor) {
    const rect = editor.canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * editor.canvas.width  / rect.width,
        y: (event.clientY - rect.top ) * editor.canvas.height / rect.height,
    };
}

export function performRaycast(event: Event, editor: Editor, layers: LayerEnum[]) : THREE.Object3D[] {

    // Set up layers        
    if (layers.length > 0) {
        raycaster.layers.disableAll();
        layers.forEach((layer) => { raycaster.layers.enable(layer)});
    } else {
        raycaster.layers.enableAll();
        raycaster.layers.disable(LayerEnum.NoRaycast);
        raycaster.layers.disable(LayerEnum.Grass);
    }

    // Get mouse position
    const pos = getCanvasRelativePosition(event, editor);
    const pickPosition = new THREE.Vector2();
    pickPosition.x = (pos.x / editor.canvas.width ) *  2 - 1;
    pickPosition.y = (pos.y / editor.canvas.height) * -2 + 1;  // note we flip Y

    raycaster.setFromCamera( pickPosition, editor.currentCamera );

    return raycaster.intersectObjects(editor.scene.children);

}

export function highlightMouseOverObject(editor: Editor, intersections: THREE.Object3D[]) {

    const [object, point] = processIntersections(intersections)

    const selector = editor.selector;

    if (selector.currentMousedOverObject === object) {
        return
    }

    // Un-highlight currently select object
    if (selector.currentSelectedObject !== undefined &&
        selector.currentMousedOverObject !== undefined) {
        if (Array.isArray(selector.currentMousedOverObject.material)) {
            selector.currentMousedOverObject.material.forEach((mat) => mat.emissive.setHex(0x000000));
        } else {
            selector.currentMousedOverObject.material.emissive.setHex(0x000000);
        }
        return
    }

    if (object.userData === undefined) {
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


// Handlers

export function handleTransformControlsChange(editor) {
    editor.selector.drawRotationVisualizer()
}

export function handleMouseMove(event, editor) {
    editor.handleMouseMove(event);
}

export function handleMouseClick(event, editor) {
    editor.handleMouseClick(event);
}

export function handleKeyDown(event, editor: Editor, sidebar: Sidebar, menuBar: Menubar) {
    menuBar.handleKeyDown(event)
    sidebar.handleKeyDown(event)
    editor.handleKeyDown(event)
}

export function handleKeyUp(event, editor: Editor, sidebar: Sidebar, menuBar: Menubar) {
    // menuBar.handleKeyUp(event)
    // sidebar.handleKeyUp(event)
    editor.handleKeyUp(event)
}


