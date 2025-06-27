import { Object3D, Vector3, Mesh, Material, Box3, Vector2, ExtrudeGeometry, Shape } from "three";

import { getCentroid, createPhongMaterial, createPreviewMaterial } from "../Utils";
import { CreateObjectCommand } from "../commands/CreateObjectCommand";
import { eventBus, EventEnums } from "../EventBus";
import { CommandStack } from "../CommandStack";
import { LayerEnum } from "../Constants";
import { Editor } from "../Editor";

import { WHITE } from "../Colors";
import { setDefaultCursor } from "../Cursors";
import { LineEditor } from "./LineEditor";
import offsetPolygon from "offset-polygon";

const INITIAL_PATH_HEIGHT = 0.03;
const INITIAL_PATH_WIDTH = 0.3;
const CONFIG_CAMERA_OFFSET = new Vector3(0, -2, 2);

enum PathEditorMode {
    INACTIVE = "INACTIVE",
    LINE_EDITOR_MODE = "LINE_EDITOR_MODE",
    CONFIG_MODE = "CONFIG_MODE"
}

function createPath(vertices: Vector3[], width: number, height: number, numArcSegments: number, material: Material) : Mesh {
    /**
     * Take the vertices and extrude them vertically to create a path
     */

    const centroid = getCentroid(vertices);
    vertices = vertices.map((v) => v.clone().sub(centroid));

    const verts = vertices.map((v) => ({ "x": v.x, "y": v.y }));
    verts.push(...verts.slice(1, verts.length - 1).reverse())

    let border = offsetPolygon(verts, width / 2, numArcSegments).map((v) => new Vector2(v.x, v.y));
    border.push(border[0])
    const shape = new Shape(border);

    const extrudeSettings = {
        depth: height,
        bevelEnabled: false,
        bevelSegments: 2,
        steps: 2,
        bevelSize: 1,
        bevelThickness: 1
    };

    return new Mesh(new ExtrudeGeometry(shape, extrudeSettings), material);

}


class PathEditor {

    editor: Editor;
    lineEditor: LineEditor;
    commandStack: CommandStack;
    mode: PathEditorMode;

    vertices: Vector3[]; // Used during vertex placement mode and bed config mode

    // Original Fence
    oldObject?: Object3D;

    // Config Mode
    previewMesh?: Mesh;
    numArcSegments: number;
    pathWidth: number;
    pathHeight: number;
    pathColor: string;
    pathName: string;

    constructor(editor: Editor) {

        this.editor = editor;
        this.lineEditor = new LineEditor(
            editor, 
            EventEnums.PATH_VERTEX_EDITING_STARTED, 
            EventEnums.PATH_VERTEX_EDITING_UPDATED, 
            EventEnums.PATH_VERTEX_EDITING_FINISHED, 
            EventEnums.PATH_EDITING_CANCELLED,
            false);

        this.commandStack = new CommandStack();
        this.mode = PathEditorMode.INACTIVE;

        this.oldObject = undefined;
        this.vertices = [];

        // Config
        this.previewMesh = undefined;
        this.numArcSegments = 1;
        this.pathWidth = INITIAL_PATH_WIDTH;
        this.pathHeight = INITIAL_PATH_HEIGHT;
        this.pathColor = WHITE;
        this.pathName = "New Fence";

        eventBus.on(EventEnums.PATH_CONFIG_UPDATED, (command) => {
            this.commandStack.execute(command)
            this.createPreviewMesh()
            eventBus.emit(EventEnums.REQUEST_RENDER)
        });

        eventBus.on(EventEnums.PATH_VERTEX_EDITING_FINISHED, () => {
            this.setConfigMode();
            this.lineEditor.cleanUp();
        })

        eventBus.on(EventEnums.PATH_EDITING_FINISHED, (event) => {
            this.createMesh()
            this.cleanUp();
        })

        eventBus.on(EventEnums.PATH_EDITING_CANCELLED, (event) => {
            this.cancel();
        })

    }

    public updateFromProps(props: Object) {
        /**
         * Update bed config from properties
         */
        this.numArcSegments = props.numArcSegments;
        this.pathWidth = props.pathWidth;
        this.pathHeight = props.pathHeight;
        this.pathColor = props.pathColor;
        this.pathName = props.pathName;
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
        this.editor.remove(this.previewMesh)
        this.previewMesh = undefined;
    }

    // Change modes
    public beginEditing(path?: Object3D) {
        this.cleanUp();
        this.mode = PathEditorMode.LINE_EDITOR_MODE;

        if (path === undefined) { // Create new bed
            this.lineEditor.beginEditing()
        } else { // Edit existing bed
            this.lineEditor.beginEditing(path.userData.vertices);
            this.updateFromProps(path.userData)
            this.oldObject = path;
            this.editor.remove(path);
        }
    }

    private setConfigMode() {

        this.vertices = this.lineEditor.vertexHandles.map((item) => item.position.clone());
        this.mode = PathEditorMode.CONFIG_MODE;

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

        this.editor.remove(this.previewMesh)

        this.previewMesh = createPath(this.vertices, this.pathWidth, this.pathHeight, this.numArcSegments, createPreviewMaterial(this.pathColor))

        this.editor.add(this.previewMesh)

        // Move the mesh to the centroid so that it doesn't spawn at the origin
        const centroid = getCentroid(this.vertices);
        console.log(centroid)
        centroid.add(new Vector3(0, 0, 0.01)) // prevent z-fighting
        this.previewMesh.position.set(...centroid);
    }

    private createMesh() {

        const path = createPath(this.vertices, this.pathWidth, this.pathHeight, this.numArcSegments, createPhongMaterial(this.pathColor));

        path.receiveShadow = true;
        path.userData = { // Give mesh the data used to create it, so it can be edited. Add selection callbacks
            selectable: true,
            onSelect: () => eventBus.emit(EventEnums.PATH_SELECTED, true),
            onDeselect: () => eventBus.emit(EventEnums.PATH_SELECTED, false),
            vertices: this.vertices,
            numArcSegments: this.numArcSegments,
            pathWidth: this.pathWidth,
            pathHeight: this.pathHeight,
            pathColor: this.pathColor,
            name: this.pathName,
            editableFields: {
                name: true,
                position: true,
                rotation: true,
            }
        }
        path.layers.set(LayerEnum.Objects)
        path.name = this.pathName;

        // Move to position
        const box = new Box3().setFromObject(path);
        const size = new Vector3();
        box.getSize(size);

        // Create and merge border + bed meshes
        const centroid = getCentroid(this.vertices);
        console.log(centroid)
        path.position.set(...centroid.clone().add(new Vector3(0,0,size.z / 2)))

        // update mesh position, rotation, and scale if editing a pre-existing bed
        if (this.oldObject) {
            path.position.copy(this.oldObject.position)
            path.rotation.copy(this.oldObject.rotation)
            path.scale.copy(this.oldObject.scale)
        }

        this.editor.execute(new CreateObjectCommand(path, this.editor));

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
            case PathEditorMode.LINE_EDITOR_MODE:
                this.lineEditor.undo();
                break;
            case PathEditorMode.CONFIG_MODE:
                this.createPreviewMesh()
                break;
            default:
                break;
        }
        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    public handleMouseMove(intersections: Object3D[]) {
        this.lineEditor.handleMouseMove(intersections)
    }

    public handleMouseClick(intersections: Object3D[]) {
        this.lineEditor.handleMouseClick(intersections);
    }

}

export { PathEditor, PathEditorMode };