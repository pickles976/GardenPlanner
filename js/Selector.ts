import * as THREE from 'three';
import { Editor } from "./Editor";
import { Object3D } from 'three';
import { eventBus, EventEnums } from './EventBus';
import { LayerEnums } from './Constants';

const raycaster = new THREE.Raycaster();

class Selector {

    // TODO: move the TransformControls to here!

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

    public performRaycast(event: Event, layers: LayerEnums[]) : THREE.Object3D[] {

        // Set up layers        
        if (layers.length > 0) {
            raycaster.layers.disableAll();
            layers.forEach((layer) => {
                raycaster.layers.enable(layer)
            })
        } else {
            raycaster.layers.enableAll();
            raycaster.layers.disable(LayerEnums.NoRaycast)
        }

        // Get mouse position
        const pos = this.getCanvasRelativePosition(event);
        const pickPosition = new THREE.Vector2();
        pickPosition.x = (pos.x / this.editor.canvas.width ) *  2 - 1;
        pickPosition.y = (pos.y / this.editor.canvas.height) * -2 + 1;  // note we flip Y

        raycaster.setFromCamera( pickPosition, this.editor.currentCamera );

        return raycaster.intersectObjects(this.editor.scene.children);

    }

    public select(object: Object3D) {

        if (object === this.currentSelectedObject) {
            return;
        }

        // Remove transform controls gizmo
        this.editor.transformControls.detach();
        this.editor.scene.remove(this.transformControlsGizmo);
        this.transformControlsGizmo = undefined;

        if (object === undefined) { // hide controls
            this.editor.transformControls.visible = false;
            this.currentSelectedObject = undefined
        } else { // show controls
            this.editor.transformControls.visible = true;
            this.currentSelectedObject = object;

            // Attach controls and gizmo
            this.editor.transformControls.attach(object);
            this.transformControlsGizmo = this.editor.transformControls.getHelper();
            this.editor.scene.add(this.transformControlsGizmo);
            this.transformControlsGizmo.layers.set(LayerEnums.NoRaycast)

            // Call object callback if exists
            object.userData?.onSelect()

        }

        eventBus.emit(EventEnums.OBJECT_SELECTED, object);
    }

    public deselect() {

        if(this.currentSelectedObject === undefined) {
            return
        }

        // Detach transform controls and remove gizmo
        this.editor.transformControls.detach();
        this.editor.transformControls.visible = false;

        this.editor.scene.remove(this.transformControlsGizmo);
        this.transformControlsGizmo = undefined;

        // Call callback if exists
        this.currentSelectedObject.userData?.onDeselect()

        // Clear selection
        this.currentSelectedObject = undefined;

        eventBus.emit(EventEnums.OBJECT_SELECTED, undefined);
    }

}

export { Selector };




