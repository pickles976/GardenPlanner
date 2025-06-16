import * as THREE from 'three';
import { Editor } from "./Editor";
import { Object3D } from 'three';
import { eventBus, EventEnums } from './EventBus';
import { FONT_SIZE, LayerEnums } from './Constants';
import { destructureVector3Array, fontSizeString, getCSS2DText, rad2deg } from './Utils';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { GREEN, WHITE } from './Colors';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { Group } from 'three';

const raycaster = new THREE.Raycaster();

class Selector {

    // TODO: move the TransformControls to here!

    editor: Editor
    currentMousedOverObject?: THREE.Object3D;
    currentSelectedObject?: THREE.Object3D;
    transformControlsGizmo?: THREE.Object3D;
    isUsingTransformControls: boolean

    rotationAngleVisualizer?: THREE.Object3D;

    advancedTransformMode: boolean;

    constructor (editor: Editor) {
        this.editor = editor;
        this.currentMousedOverObject = undefined;
        this.currentSelectedObject = undefined;
        this.transformControlsGizmo = undefined;
        this.isUsingTransformControls = false;
        this.advancedTransformMode = false;

        eventBus.on(EventEnums.OBJECT_CHANGED, () => this.drawRotationVisualizer());
        eventBus.on(EventEnums.TRANSFORM_MODE_CHANGED, (value) => this.setTransformMode(value));
    }

    private setTransformMode(value: boolean) {
        this.advancedTransformMode = value
        if (value) {
            if (this.currentSelectedObject !== undefined) this.attachTransformControls(this.currentSelectedObject)
        } else {
            this.removeTransformControls()
        }
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

    private removeTransformControls(){
        // Remove transform controls gizmo
        this.editor.transformControls.detach();
        this.editor.scene.remove(this.transformControlsGizmo);
        this.transformControlsGizmo = undefined;
    }

    private attachTransformControls(object: Object3D) {
        // Attach controls and gizmo
        this.editor.transformControls.visible = true;
        this.editor.transformControls.attach(object);
        this.transformControlsGizmo = this.editor.transformControls.getHelper();
        this.editor.scene.add(this.transformControlsGizmo);
        this.transformControlsGizmo.layers.set(LayerEnums.NoRaycast)
    }

    private advancedTransformSelect(object: Object3D) {

        this.removeTransformControls()

        if (object === undefined) { // hide controls
            this.editor.transformControls.visible = false;
            this.currentSelectedObject = undefined
        } else { // show controls
            this.currentSelectedObject = object;
            this.attachTransformControls(object);

            // Call object callback if exists
            if (object.userData?.onSelect) {
                object.userData.onSelect()
            }

        }
    }

    private simpleTransformSelect(object: Object3D) {
        if (object === undefined) { // hide controls
            this.currentSelectedObject = undefined
        } else { // show controls
            this.currentSelectedObject = object;

            // Call object callback if exists
            if (object.userData?.onSelect) {
                object.userData.onSelect()
            }

        }
    }

    public select(object: Object3D) {

        if (object === this.currentSelectedObject) {
            return;
        }

        if (this.advancedTransformMode) {
            this.advancedTransformSelect(object)
        } else {
            this.simpleTransformSelect(object)
        }

        this.drawRotationVisualizer()

        eventBus.emit(EventEnums.OBJECT_SELECTED, object);
    }

    private advancedTransformDeselect() {
        // Detach transform controls and remove gizmo
        this.editor.transformControls.detach();
        this.editor.transformControls.visible = false;

        this.editor.scene.remove(this.transformControlsGizmo);
        this.transformControlsGizmo = undefined;
    }

    private simpleTransformDeselect() {

    }

    public deselect() {

        if(this.currentSelectedObject === undefined) {
            return
        }

        if (this.advancedTransformMode) {
            this.advancedTransformDeselect()
        } else {
            this.simpleTransformDeselect()
        }

        // Call callback if exists
        if (this.currentSelectedObject.userData.onDeselect) {
            this.currentSelectedObject.userData?.onDeselect()
        }

        // Clear selection
        this.currentSelectedObject = undefined;

        // Remove rotation thing
        this.editor.remove(this.rotationAngleVisualizer)

        eventBus.emit(EventEnums.OBJECT_SELECTED, undefined);
    }

    public drawRotationVisualizer() {

        if (this.currentSelectedObject === undefined) { return }

        const object = this.currentSelectedObject;
        const origin = object.position.clone();
        origin.z = 0;

        // Get North line
        const northEnd = origin.clone().add(new THREE.Vector3(0,1,0));
        let material = new LineMaterial({ color: WHITE, linewidth: 3, depthWrite: false, depthTest: false });
        let geometry = new LineGeometry();
        geometry.setPositions(destructureVector3Array([origin, northEnd]));
        const north = new Line2(geometry, material);

        // Get Angle line
        let rotation = object.rotation.z + (Math.PI / 2)
        const angleEnd = origin.clone().add(new THREE.Vector3(Math.cos(rotation),Math.sin(rotation),0));
        material = new LineMaterial({ color: WHITE, linewidth: 2, depthWrite: false, depthTest: false });
        geometry = new LineGeometry();
        geometry.setPositions(destructureVector3Array([origin, angleEnd]));
        const angle = new Line2(geometry, material);

        // Draw Arc
        // TODO: fix bug with arc drawing
	
		// set interpolation points
        const radius = 0.5
		northEnd.sub( origin ).setLength( radius ).add( origin );
		angleEnd.sub( origin ).setLength( radius ).add( origin );

        const N = 30;
        var points = [];
		// collect points along the arc
        for( var i=0; i<=N; i++ ) points.push( new THREE.Vector3( ) );
        for( var i=0; i<=N; i++ ) points[i].lerpVectors( northEnd, angleEnd, (i/N)).sub( origin ).setLength( radius ).add( origin );
        geometry = new LineGeometry();
        geometry.setPositions(destructureVector3Array(points))
        let arcLine = new Line2(
            geometry, 
            new LineMaterial( { color: WHITE, linewidth: 2, depthWrite: false, depthTest: false  } )
            );

        // Draw angle text
        rotation = (object.rotation.z / 2) + (Math.PI / 2)
        const textPos = origin.clone().add(new THREE.Vector3(Math.cos(rotation),Math.sin(rotation),0));
        textPos.sub(origin).multiplyScalar(0.4).add(origin)
        const angleLabel = getCSS2DText(`${rad2deg(object.rotation.z).toFixed(2)}°`, fontSizeString(FONT_SIZE));
        angleLabel.position.set(...textPos)

        // Create Group
        this.editor.remove(this.rotationAngleVisualizer)
        const group = new Group();
        group.add(north, angle, arcLine, angleLabel)
        this.rotationAngleVisualizer = group
        this.editor.add(this.rotationAngleVisualizer)
    }
    

}

export { Selector };




