import { Object3D, Vector3, Mesh, Material, Box3, BufferGeometry, Float32BufferAttribute } from "three";

import { getCentroid, createPhongMaterial, createPreviewMaterial } from "../Utils";
import { CreateObjectCommand } from "../commands/CreateObjectCommand";
import { eventBus, EventEnums } from "../EventBus";
import { CommandStack } from "../CommandStack";
import { LayerEnum } from "../Constants";
import { Editor } from "./Editor";

import { WHITE } from "../Colors";
import { setDefaultCursor } from "../Cursors";
import { LineEditor } from "./LineEditor";

const INITIAL_FENCE_HEIGHT = 2.0;
const CONFIG_CAMERA_OFFSET = new Vector3(0, -2, 2);

enum FenceEditorMode {
    INACTIVE = "INACTIVE",
    LINE_EDITOR_MODE = "LINE_EDITOR_MODE",
    CONFIG_MODE = "CONFIG_MODE"
}

function createFence(vertices: Vector3[], height: number, material: Material) : Mesh {
    /**
     * Take the vertices and extrude them vertically to create a fence
     */

    const centroid = getCentroid(vertices);
    const bottom = vertices.map((v) => v.clone().sub(centroid));
    const top = bottom.map((v) => new Vector3(v.x, v.y, height));

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

        // Triangle 1: i0, i2, i1
        // Triangle 2: i2, i3, i1
        indices.push(i0, i2, i1);
        indices.push(i2, i3, i1);
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return new Mesh(geometry, material);

}


class FenceEditor {

    editor: Editor;
    lineEditor: LineEditor;
    commandStack: CommandStack;
    mode: FenceEditorMode;

    vertices: Vector3[]; // Used during vertex placement mode and bed config mode

    // Original Fence
    oldFence?: Object3D;

    // Config Mode
    fencePreviewMesh?: Mesh;
    fenceHeight: number;
    fenceColor: string;
    fenceName: string;
    shadow: boolean;

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

        this.oldFence = undefined;
        this.vertices = [];

        // Config
        this.fencePreviewMesh = undefined;
        this.fenceHeight = INITIAL_FENCE_HEIGHT;
        this.fenceColor = WHITE;
        this.fenceName = "New Fence";
        this.shadow = true;

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

    public updateFromProps(props: Object) {
        /**
         * Update bed config from properties
         */
        this.fenceHeight = props.fenceHeight;
        this.fenceColor = props.fenceColor;
        this.fenceName = props.fenceName;
        this.shadow = props.shadow;
    }

    public cancel() {
        if (this.oldFence) {
            this.editor.execute(new CreateObjectCommand(this.oldFence, this.editor))
        }
        this.cleanUp();
        this.lineEditor.cancel();
    }

    // Cleanup
    public cleanUp() {
        this.oldFence = undefined;
        this.lineEditor.cleanUp()
        this.cleanUpBedConfigState()

        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    private cleanUpBedConfigState() {
        this.editor.remove(this.fencePreviewMesh)
        this.fencePreviewMesh = undefined;
    }

    // Change modes
    public beginFenceEditing(fence?: Object3D) {
        this.cleanUp();
        this.mode = FenceEditorMode.LINE_EDITOR_MODE;

        if (fence === undefined) { // Create new bed
            this.lineEditor.beginLineEditing()
        } else { // Edit existing bed
            this.lineEditor.beginLineEditing(fence.userData.vertices);
            this.updateFromProps(fence.userData)
            this.oldFence = fence;
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

        this.editor.remove(this.fencePreviewMesh)

        this.fencePreviewMesh = createFence(this.vertices, this.fenceHeight, createPreviewMaterial(this.fenceColor))
        this.fencePreviewMesh.castShadow = this.shadow;

        this.editor.add(this.fencePreviewMesh)

        // Move the mesh to the centroid so that it doesn't spawn at the origin
        const centroid = getCentroid(this.vertices);
        centroid.add(new Vector3(0, 0, 0.01)) // prevent z-fighting
        this.fencePreviewMesh.position.set(...centroid);
    }

    private createMesh() {

        // Create and merge border + bed meshes
        const centroid = getCentroid(this.vertices);

        const fence = createFence(this.vertices, this.fenceHeight, createPhongMaterial(this.fenceColor));
        fence.geometry.computeBoundingBox();  
        fence.geometry.center();  

        fence.castShadow = this.shadow;
        fence.receiveShadow = true;
        fence.userData = { // Give mesh the data used to create it, so it can be edited. Add selection callbacks
            selectable: true,
            onSelect: () => eventBus.emit(EventEnums.FENCE_SELECTED, true),
            onDeselect: () => eventBus.emit(EventEnums.FENCE_SELECTED, false),
            vertices: this.vertices,
            fenceHeight: this.fenceHeight,
            fenceColor: this.fenceColor,
            name: this.fenceName,
            shadow: this.shadow,
            editableFields: {
                name: true,
                position: true,
                rotation: true,
            }
        }
        fence.layers.set(LayerEnum.Objects)
        fence.name = this.fenceName;

        // Move to position
        const box = new Box3().setFromObject(fence);
        const size = new Vector3();
        box.getSize(size);
        fence.position.set(...centroid.clone().add(new Vector3(0,0,size.z / 2)))

        // update mesh position, rotation, and scale if editing a pre-existing bed
        if (this.oldFence) {
            fence.position.copy(this.oldFence.position)
            fence.rotation.copy(this.oldFence.rotation)
            fence.scale.copy(this.oldFence.scale)
        }

        this.editor.execute(new CreateObjectCommand(fence, this.editor));

        // Reset cursor
        setDefaultCursor()
        this.cleanUp()
        eventBus.emit(EventEnums.CHANGE_CAMERA_UI, false)
        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    public handleKeyDown(event) {
        this.lineEditor.handleKeyDown(event)
    }

    public undo() {
        this.commandStack.undo();
        switch (this.mode) {
            case FenceEditorMode.LINE_EDITOR_MODE:
                this.lineEditor.undo();
                break;
            case FenceEditorMode.CONFIG_MODE:
                this.createPreviewMesh()
                break;
            default:
                break;
        }
        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    public handleMouseMove(editor: Editor, intersections: Object3D[]) {
        this.lineEditor.handleMouseMove(editor, intersections)
    }

    public handleMouseClick(editor: Editor, intersections: Object3D[]) {
        this.lineEditor.handleMouseClick(editor, intersections);
    }

}

export { FenceEditor, FenceEditorMode };