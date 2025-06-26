import { Object3D, Vector3, Mesh, Material, Box3, BufferGeometry, Float32BufferAttribute, Vector2, ExtrudeGeometry, Shape } from "three";

import { getCentroid, createPhongMaterial, createPreviewMaterial, destructureVector3Array } from "../Utils";
import { CreateObjectCommand } from "../commands/CreateObjectCommand";
import { eventBus, EventEnums } from "../EventBus";
import { CommandStack } from "../CommandStack";
import { LayerEnum } from "../Constants";
import { Editor } from "./Editor";

import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

import { WHITE } from "../Colors";
import { setDefaultCursor } from "../Cursors";
import { createPolygon, LineEditor } from "./LineEditor";
import offsetPolygon from "offset-polygon";

const INITIAL_PATH_HEIGHT = 0.03;
const INITIAL_PATH_WIDTH = 0.3;
const CONFIG_CAMERA_OFFSET = new Vector3(0, -2, 2);
const NUM_ARC_SEGMENTS = 1;

enum PathEditorMode {
    INACTIVE = "INACTIVE",
    LINE_EDITOR_MODE = "LINE_EDITOR_MODE",
    CONFIG_MODE = "CONFIG_MODE"
}

function createPath(vertices: Vector3[], width: number, height: number, material: Material) : Mesh {
    /**
     * Take the vertices and extrude them vertically to create a path
     */

    const verts = vertices.map((v) => ({ "x": v.x, "y": v.y }));
    verts.push(...verts.slice(1, verts.length - 1).reverse())

    let border = offsetPolygon(verts, width / 2, 1).map((v) => new Vector2(v.x, v.y));
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
    oldPath?: Object3D;

    // Config Mode
    pathPreviewMesh?: Mesh;
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

        this.oldPath = undefined;
        this.vertices = [];

        // Config
        this.pathPreviewMesh = undefined;
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
        this.pathWidth = props.pathWidth;
        this.pathHeight = props.pathHeight;
        this.pathColor = props.pathColor;
        this.pathName = props.pathName;
    }

    public cancel() {
        if (this.oldPath) {
            this.editor.execute(new CreateObjectCommand(this.oldPath, this.editor))
        }
        this.cleanUp();
        this.lineEditor.cancel();
    }

    // Cleanup
    public cleanUp() {
        this.oldPath = undefined;
        this.lineEditor.cleanUp()
        this.cleanUpBedConfigState()

        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    private cleanUpBedConfigState() {
        this.editor.remove(this.pathPreviewMesh)
        this.pathPreviewMesh = undefined;
    }

    // Change modes
    public beginEditing(path?: Object3D) {
        this.cleanUp();
        this.mode = PathEditorMode.LINE_EDITOR_MODE;

        if (path === undefined) { // Create new bed
            this.lineEditor.beginLineEditing()
        } else { // Edit existing bed
            this.lineEditor.beginLineEditing(path.userData.vertices);
            this.updateFromProps(path.userData)
            this.oldPath = path;
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

        this.editor.remove(this.pathPreviewMesh)

        this.pathPreviewMesh = createPath(this.vertices, this.pathWidth, this.pathHeight, createPreviewMaterial(this.pathColor))

        this.editor.add(this.pathPreviewMesh)

        // Move the mesh to the centroid so that it doesn't spawn at the origin
        const centroid = getCentroid(this.vertices);
        centroid.add(new Vector3(0, 0, 0.01)) // prevent z-fighting
        this.pathPreviewMesh.position.set(...centroid);
    }

    private createMesh() {

        // Create and merge border + bed meshes
        const centroid = getCentroid(this.vertices);

        const path = createPath(this.vertices, this.pathWidth, this.pathHeight, createPhongMaterial(this.pathColor));
        path.geometry.computeBoundingBox();  
        path.geometry.center();  

        path.receiveShadow = true;
        path.userData = { // Give mesh the data used to create it, so it can be edited. Add selection callbacks
            selectable: true,
            onSelect: () => eventBus.emit(EventEnums.PATH_SELECTED, true),
            onDeselect: () => eventBus.emit(EventEnums.PATH_SELECTED, false),
            vertices: this.vertices,
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
        path.position.set(...centroid.clone().add(new Vector3(0,0,size.z / 2)))

        // update mesh position, rotation, and scale if editing a pre-existing bed
        if (this.oldPath) {
            path.position.copy(this.oldPath.position)
            path.rotation.copy(this.oldPath.rotation)
            path.scale.copy(this.oldPath.scale)
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

    public handleMouseMove(editor: Editor, intersections: Object3D[]) {
        this.lineEditor.handleMouseMove(editor, intersections)
    }

    public handleMouseClick(editor: Editor, intersections: Object3D[]) {
        this.lineEditor.handleMouseClick(editor, intersections);
    }

}

export { PathEditor, PathEditorMode };