import * as THREE from "three";

import { getCentroid, createPhongMaterial, createPreviewMaterial } from "../Utils";
import { CreateObjectCommand } from "../commands/CreateObjectCommand";
import { eventBus, EventEnums } from "../EventBus";
import { CommandStack } from "../CommandStack";
import { LayerEnum, Props } from "../Constants";
import { Editor } from "../Editor";

import { WHITE } from "../Colors";
import { setDefaultCursor } from "../Cursors";
import { LineEditor } from "./LineEditor";

const INITIAL_FENCE_HEIGHT = 2.0;
const CONFIG_CAMERA_OFFSET = new THREE.Vector3(0, -2, 2);

enum FenceEditorMode {
    INACTIVE = "INACTIVE",
    LINE_EDITOR_MODE = "LINE_EDITOR_MODE",
    CONFIG_MODE = "CONFIG_MODE"
}

function createFence(vertices: THREE.Vector3[], height: number, material: THREE.Material) : THREE.Mesh {
    /**
     * Take the vertices and extrude them vertically to create a fence
     */

    const centroid = getCentroid(vertices);
    const bottom = vertices.map((v) => v.clone().sub(centroid));
    const top = bottom.map((v) => new THREE.Vector3(v.x, v.y, height));

    const positions = [];
    for (let i = 0; i < bottom.length; i++) {
        const b = bottom[i];
        const t = top[i];
        positions.push(b.x, b.y, b.z);
        positions.push(t.x, t.y, t.z);
    }

    const indices = [];
    for (let i = 0; i < bottom.length - 1; i++) {
        const i0 = i * 2;
        const i1 = i * 2 + 1;
        const i2 = i * 2 + 2;
        const i3 = i * 2 + 3;

        indices.push(i0, i2, i1); // Triangle 1: i0, i2, i1
        indices.push(i2, i3, i1); // Triangle 2: i2, i3, i1
    } 

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.translate(0,0, -height / 2);

    return new THREE.Mesh(geometry, material);

}

class FenceProps extends Props {

    fenceHeight: number;
    fenceColor: string;
    name: string;
    shadow: boolean;

    constructor (fenceHeight, fenceColor, name, shadow) {
        super(["fenceColor", "name", "shadow"])
        this.fenceHeight = fenceHeight;
        this.fenceColor = fenceColor;
        this.name = name;
        this.shadow = shadow;
    }

    public clone() {
        return new FenceProps(
            this.fenceHeight,
            this.fenceColor,
            this.name, 
            this.shadow
        )
    }
}


class FenceEditor {

    editor: Editor;
    lineEditor: LineEditor;
    commandStack: CommandStack;
    mode: FenceEditorMode;

    vertices: THREE.Vector3[];

    // Original Fence, used for editing existing objects
    oldObject?: THREE.Object3D;

    // Config Mode
    fencePreviewMesh?: THREE.Mesh;

    props: FenceProps;


    constructor(editor: Editor) {

        this.editor = editor;
        this.lineEditor = new LineEditor(
            editor, 
            EventEnums.FENCE_VERTEX_EDITING_STARTED, 
            EventEnums.FENCE_VERTEX_EDITING_UPDATED, 
            EventEnums.FENCE_VERTEX_EDITING_FINISHED, 
            EventEnums.FENCE_EDITING_CANCELLED,
            false);

        this.commandStack = new CommandStack();
        this.mode = FenceEditorMode.INACTIVE;

        this.oldObject = undefined;
        this.vertices = [];

        // Config
        this.fencePreviewMesh = undefined;

        this.props = new FenceProps(
            INITIAL_FENCE_HEIGHT,
            WHITE,
            "New Fence",
            true
        )

        eventBus.on(EventEnums.FENCE_CONFIG_UPDATED, (command) => {
            this.commandStack.execute(command)
            this.createPreviewMesh()
            eventBus.emit(EventEnums.REQUEST_RENDER)
        });

        eventBus.on(EventEnums.FENCE_VERTEX_EDITING_FINISHED, () => {
            this.setConfigMode();
            this.lineEditor.cleanUp();
        })

        eventBus.on(EventEnums.FENCE_EDITING_FINISHED, (event) => {
            this.createMesh()
            this.cleanUp();
        })

        eventBus.on(EventEnums.FENCE_EDITING_CANCELLED, (event) => {
            this.cancel();
        })

    }

    public updateFromProps(props: FenceProps) {
        this.props = props;
    }

    public cancel() {
        if (this.oldObject) {
            this.editor.execute(new CreateObjectCommand(this.oldObject, this.editor))
        }
        this.cleanUp();
        this.lineEditor.cancel();
    }

    // Cleanup
    public cleanUp() {
        this.oldObject = undefined;
        this.lineEditor.cleanUp()
        this.cleanUpBedConfigState()

        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    private cleanUpBedConfigState() {
        this.editor.remove(this.fencePreviewMesh)
        this.fencePreviewMesh = undefined;
    }

    // Change modes
    public beginEditing(fence?: THREE.Object3D) {
        this.cleanUp();
        this.mode = FenceEditorMode.LINE_EDITOR_MODE;

        if (fence === undefined) { // Create new bed
            this.lineEditor.beginEditing();
        } else { // Edit existing bed
            this.lineEditor.beginEditing(fence.userData.vertices);
            this.updateFromProps(fence.userData.props);
            this.oldObject = fence;
            this.editor.remove(fence);
        }
    }

    private setConfigMode() {

        this.vertices = this.lineEditor.vertexHandles.map((item) => item.position.clone());
        this.mode = FenceEditorMode.CONFIG_MODE;

        // Reset cursor
        setDefaultCursor()
        this.lineEditor.cleanUp()
        this.editor.setPerspectiveCamera()
        this.createPreviewMesh()

        // get the centroid of the points
        const centroid = getCentroid(this.vertices);

        // make the camera south of the newly-created bed + Make the camera look at the newly-created bed
        this.editor.currentCamera.position.set(...centroid.clone().add(CONFIG_CAMERA_OFFSET))
        this.editor.currentCameraControls.target.copy(centroid)

        eventBus.emit(EventEnums.CHANGE_CAMERA_UI, false) // change UI
        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    // Drawing

    private createPreviewMesh() {

        const props = this.props;

        this.editor.remove(this.fencePreviewMesh)

        this.fencePreviewMesh = createFence(this.vertices, props.fenceHeight, createPreviewMaterial(props.fenceColor))
        this.fencePreviewMesh.castShadow = props.shadow;

        this.editor.add(this.fencePreviewMesh)

        // Move the mesh to the centroid so that it doesn't spawn at the origin
        const centroid = getCentroid(this.vertices)
        this.fencePreviewMesh.position.set(...centroid.add(new THREE.Vector3(0, 0, props.fenceHeight / 2)));
    }

    private createMesh() {
        const props = this.props;
        const fence = createFence(this.vertices, props.fenceHeight, createPhongMaterial(props.fenceColor));

        fence.castShadow = props.shadow;
        fence.receiveShadow = true;
        fence.userData = { // Give mesh the data used to create it, so it can be edited. Add selection callbacks
            selectable: true,
            onSelect: () => eventBus.emit(EventEnums.FENCE_SELECTED, true),
            onDeselect: () => eventBus.emit(EventEnums.FENCE_SELECTED, false),
            vertices: this.vertices,
            props: this.props,
            editableFields: {
                name: true,
                position: true,
                rotation: true,
            }
        }
        fence.layers.set(LayerEnum.Objects)
        fence.name = props.name;

        // Move to position
        const box = new THREE.Box3().setFromObject(fence);
        const size = new THREE.Vector3();
        box.getSize(size);
        const centroid = getCentroid(this.vertices);
        fence.position.set(...centroid.add(new THREE.Vector3(0,0,size.z / 2)))

        // update mesh position, rotation, and scale if editing a pre-existing bed
        if (this.oldObject) {
            fence.position.copy(this.oldObject.position)
            fence.rotation.copy(this.oldObject.rotation)
            fence.scale.copy(this.oldObject.scale)
        }

        this.editor.execute(new CreateObjectCommand(fence, this.editor));

        // Reset cursor
        setDefaultCursor()
        this.cleanUp()
        eventBus.emit(EventEnums.CHANGE_CAMERA_UI, false)
        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    public handleKeyDown(event) {
        switch (this.mode) {
            case FenceEditorMode.LINE_EDITOR_MODE:
                this.lineEditor.handleKeyDown(event)
                break;
            case FenceEditorMode.CONFIG_MODE:
                switch (event.key) {
                    case 'z':
                        if (event.ctrlKey) {
                            this.undo();
                        } 
                        break;
                }
        }
    }

    public undo() {
        this.commandStack.undo();
        this.createPreviewMesh();
        eventBus.emit(EventEnums.REQUEST_RENDER);
    }

    public handleMouseMove(intersections: THREE.Object3D[]) {
        this.lineEditor.handleMouseMove(intersections)
    }

    public handleMouseClick(intersections: THREE.Object3D[]) {
        this.lineEditor.handleMouseClick(intersections);
    }

}

export { FenceEditor, FenceEditorMode, FenceProps };