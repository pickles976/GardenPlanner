import * as THREE from 'three';
import { Editor } from "./Editor";
import { Object3D } from 'three';
import { eventBus, EventEnums } from './EventBus';
import { LayerEnums } from './Constants';
import { destructureVector3Array } from './Utils';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { GREEN, WHITE } from './Colors';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const raycaster = new THREE.Raycaster();

class Selector {

    // TODO: move the TransformControls to here!

    editor: Editor
    currentMousedOverObject?: THREE.Object3D;
    currentSelectedObject?: THREE.Object3D;
    transformControlsGizmo?: THREE.Object3D;
    isUsingTransformControls: boolean

    rotationAngleVisualizer?: THREE.Object3D;

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
            if (object.userData?.onSelect) {
                object.userData.onSelect()
            }

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

    public handleRotationChange() {


        const object = this.currentSelectedObject;
        const origin = object.position.clone();
        origin.z = 0;

        // let textPos = lastPoint.clone().add(point.clone()).divideScalar(2);
        // const lineLabel = getCSS2DText(snapper.getText(lastPoint.distanceTo(point)), fontSizeString(FONT_SIZE));
        // lineLabel.position.set(...textPos)

        // Get North line
        let endPos = origin.clone().add(new THREE.Vector3(0,1,0));
        let material = new LineMaterial({ color: WHITE, linewidth: 3, depthWrite: false, depthTest: false });
        let geometry = new LineGeometry();
        geometry.setPositions(destructureVector3Array([origin, endPos]));
        const north = new Line2(geometry, material);

        // Get Angle line
        const rotation = object.rotation.z + (Math.PI / 2)
        endPos = origin.clone().add(new THREE.Vector3(Math.cos(rotation),Math.sin(rotation),0));
        material = new LineMaterial({ color: WHITE, linewidth: 2, depthWrite: false, depthTest: false });
        geometry = new LineGeometry();
        geometry.setPositions(destructureVector3Array([origin, endPos]));
        const angle = new Line2(geometry, material);

        // Draw arc

        // Draw semi-circle

        // Draw angle text
        // let textPos = lastPoint.clone().add(point.clone()).divideScalar(2);
        // // const lineLabel = getCSS2DText(snapper.getText(lastPoint.distanceTo(point)), fontSizeString(FONT_SIZE));
        // // lineLabel.position.set(...textPos)

        // return group;
        this.editor.add(north)
        this.editor.add(angle)
    }

}

export { Selector };




