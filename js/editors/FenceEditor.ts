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
import { chainLinkMaterial, mudMaterial } from "../Materials";
import offsetPolygon from "offset-polygon";

const INITIAL_FENCE_HEIGHT = 2.0;
const CONFIG_CAMERA_OFFSET = new THREE.Vector3(0, -2, 2);

enum FenceEditorMode {
    INACTIVE = "INACTIVE",
    LINE_EDITOR_MODE = "LINE_EDITOR_MODE",
    CONFIG_MODE = "CONFIG_MODE"
}

// TODO: do this properly so that we dont get these stupid fucking artifacts
// TODO: 
// 1. create planes
// 2. merge meshes
function createFence(vertices: THREE.Vector3[], height: number, material: THREE.Material): THREE.Mesh {
    /**
     * Take the vertices and extrude them vertically to create a fence
     */

    const centroid = getCentroid(vertices);
    vertices = vertices.map((v) => v.clone().sub(centroid));

    // Wrap around
    const verts = vertices.map((v) => ({ "x": v.x, "y": v.z }));
    verts.push(...verts.slice(1, verts.length - 1).reverse())

    let border = offsetPolygon(verts, 0.0001, 1.0).map((v) => new THREE.Vector2(v.x, v.y));

    // border.push(border[0])
    const shape = new THREE.Shape(border);

    const extrudeSettings = {
        depth: height,
        bevelEnabled: false,
        bevelSegments: 2,
        steps: 2,
        bevelSize: 1,
        bevelThickness: 1
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(Math.PI / 2);
    geometry.center();

    return new THREE.Mesh(geometry, material);
}

class FenceProps extends Props {

    fenceHeight: number;
    fenceColor: string;
    name: string;
    chainLink: boolean;

    constructor (fenceHeight, fenceColor, name, chainLink) {
        super(["fenceColor", "name", "chainLink"])
        this.fenceHeight = fenceHeight;
        this.fenceColor = fenceColor;
        this.name = name;
        this.chainLink = chainLink;
    }

    public clone() {
        return new FenceProps(
            this.fenceHeight,
            this.fenceColor,
            this.name, 
            this.chainLink
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
        
    }

    // Drawing

    private createPreviewMesh() {

        const props = this.props;

        this.editor.remove(this.fencePreviewMesh)

        this.fencePreviewMesh = createFence(this.vertices, props.fenceHeight, createPreviewMaterial(props.fenceColor))

        this.editor.add(this.fencePreviewMesh)

        // Move the mesh to the centroid so that it doesn't spawn at the origin
        const centroid = getCentroid(this.vertices)
        this.fencePreviewMesh.position.set(...centroid.add(new THREE.Vector3(0, props.fenceHeight / 2, 0)));
    }

    private createMesh() {
        const props = this.props;

        let mat = createPhongMaterial(props.fenceColor);
        if (props.chainLink) {
            mat = chainLinkMaterial.clone();
            mat.color.set(WHITE);
            mat.transparent = true;
            mat.alphaTest = 0.005;
        }
        
        const fence = createFence(this.vertices, props.fenceHeight, mat);

        fence.castShadow = true;
        fence.receiveShadow = false;
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
        fence.position.set(...centroid.add(new THREE.Vector3(0,size.y / 2,0)))

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
        
    }

    public handleKeyDown(event) {

        if (event.key === 'Escape') {
            eventBus.emit(EventEnums.FENCE_EDITING_CANCELLED)
            return;
        }

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
    }

    public handleMouseMove(intersections: THREE.Object3D[]) {
        this.lineEditor.handleMouseMove(intersections)
    }

    public handleMouseClick(intersections: THREE.Object3D[]) {
        this.lineEditor.handleMouseClick(intersections);
    }

}

export { FenceEditor, FenceEditorMode, FenceProps };