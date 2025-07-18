import * as THREE from "three";

import { getCentroid, createPhongMaterial, createPreviewMaterial, mergeMeshes, jsonToVector3Array, vector3ArrayToJson } from "../Utils";
import { CreateObjectCommand } from "../commands/CreateObjectCommand";
import { eventBus, EventEnums } from "../EventBus";
import { CommandStack } from "../CommandStack";
import { LayerEnum, Props } from "../Constants";
import { Editor } from "../Editor";

import { WHITE } from "../Colors";
import { setDefaultCursor } from "../Cursors";
import { LineEditor } from "./LineEditor";
import offsetPolygon from "offset-polygon";

const INITIAL_PATH_HEIGHT = 0.03;
const INITIAL_PATH_WIDTH = 0.3;
const INITIAL_PATH_COLOR = WHITE;
const INITIAL_PATH_NAME = "New Path";
const CONFIG_CAMERA_OFFSET = new THREE.Vector3(0, 4, -4);

enum PathEditorMode {
    INACTIVE = "INACTIVE",
    LINE_EDITOR_MODE = "LINE_EDITOR_MODE",
    CONFIG_MODE = "CONFIG_MODE"
}

function createPath(vertices: THREE.Vector3[], width: number, height: number, numArcSegments: number, material: THREE.Material) : THREE.Mesh {
    /**
     * Take the vertices and extrude them vertically to create a path
     */

    const centroid = getCentroid(vertices);
    vertices = vertices.map((v) => v.clone().sub(centroid));

    const verts = vertices.map((v) => ({ "x": v.x, "y": v.z }));
    verts.push(...verts.slice(1, verts.length - 1).reverse())

    let border = offsetPolygon(verts, width / 2, numArcSegments).map((v) => new THREE.Vector2(v.x, v.y));
    border.push(border[0])
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

    // Hack to fix serialization of mesh
    return mergeMeshes([new THREE.Mesh(geometry, material)]);

}

export class PathProps extends Props {
    numArcSegments: number;
    pathWidth: number;
    pathHeight: number;
    pathColor: string;
    name: string;

    constructor (numArcSegments, pathWidth, pathHeight, pathColor, name) {
        super(["numArcSegments", "pathColor", "name"])
        this.numArcSegments = numArcSegments;
        this.pathWidth = pathWidth;
        this.pathHeight = pathHeight;
        this.pathColor = pathColor;
        this.name = name;
    }

    public clone() {
        return new PathProps(
            this.numArcSegments,
            this.pathWidth,
            this.pathHeight,
            this.pathColor,
            this.name
        )
    }
}


class PathEditor {

    editor: Editor;
    lineEditor: LineEditor;
    commandStack: CommandStack;
    mode: PathEditorMode;

    vertices: THREE.Vector3[]; // Used during vertex placement mode and bed config mode

    // Original Fence
    oldObject?: THREE.Object3D;

    // Config Mode
    previewMesh?: THREE.Mesh;
    props: PathProps;

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
        this.props = new PathProps(
            1,
            INITIAL_PATH_WIDTH,
            INITIAL_PATH_HEIGHT,
            INITIAL_PATH_COLOR,
            INITIAL_PATH_NAME
        )

        eventBus.on(EventEnums.PATH_CONFIG_UPDATED, (command) => {
            this.commandStack.execute(command)
            this.createPreviewMesh()
            
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

    public updateFromProps(props: PathProps) {
        /**
         * Update bed config from properties
         */
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
        this.commandStack.clear()

        
    }

    private cleanUpBedConfigState() {
        this.editor.remove(this.previewMesh)
        this.previewMesh = undefined;
    }

    // Change modes
    public beginEditing(path?: THREE.Object3D) {
        this.cleanUp();
        this.mode = PathEditorMode.LINE_EDITOR_MODE;

        if (path === undefined) { // Create new bed
            this.lineEditor.beginEditing()
        } else { // Edit existing bed
            this.lineEditor.beginEditing(jsonToVector3Array(path.userData.vertices));
            this.updateFromProps(path.userData.props)
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
        
    }

    // Drawing

    private createPreviewMesh() {

        const props = this.props;

        this.editor.remove(this.previewMesh)

        this.previewMesh = createPath(this.vertices, props.pathWidth, props.pathHeight, props.numArcSegments, createPreviewMaterial(props.pathColor))
        this.previewMesh.layers.set(LayerEnum.Objects)
        this.editor.add(this.previewMesh)

        // Move the mesh to the centroid so that it doesn't spawn at the origin
        const centroid = getCentroid(this.vertices);
        centroid.add(new THREE.Vector3(0, 0.01, 0)) // prevent z-fighting
        this.previewMesh.position.set(...centroid);
    }

    private createMesh() {

        const props = this.props;

        const path = createPath(this.vertices, props.pathWidth, props.pathHeight, props.numArcSegments, createPhongMaterial(props.pathColor));

        path.receiveShadow = true;
        path.userData = { // Give mesh the data used to create it, so it can be edited. Add selection callbacks
            selectable: true,
            selectionEnum: EventEnums.PATH_SELECTED,
            vertices: vector3ArrayToJson(this.vertices),
            props: this.props.clone(),
            editableFields: {
                name: true,
                position: true,
                rotation: true,
                visible: true
            }
        }
        path.layers.set(LayerEnum.Objects)
        path.name = this.props.name;

        // Move to position
        const box = new THREE.Box3().setFromObject(path);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Create and merge border + bed meshes
        const centroid = getCentroid(this.vertices);
        path.position.set(...centroid.clone().add(new THREE.Vector3(0,size.y / 2,0)))

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
        
    }

    public handleKeyDown(event) {

        if (event.key === 'Escape') {
            eventBus.emit(EventEnums.PATH_EDITING_CANCELLED)
            return;
        }

        switch (this.mode) {
            case PathEditorMode.LINE_EDITOR_MODE:
                this.lineEditor.handleKeyDown(event)
                break;
            case PathEditorMode.CONFIG_MODE:
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
        ;
    }

    public handleMouseMove(intersections: THREE.Object3D[]) {
        this.lineEditor.handleMouseMove(intersections)
    }

    public handleMouseClick(intersections: THREE.Object3D[]) {
        this.lineEditor.handleMouseClick(intersections);
    }

}

export { PathEditor, PathEditorMode };