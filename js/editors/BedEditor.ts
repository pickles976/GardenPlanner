import { Object3D, Vector3, Mesh, Vector2, Shape, Material, ExtrudeGeometry, Path, Box3 } from "three";

import offsetPolygon from "offset-polygon";

import { getCentroid, polygonArea, mergeMeshes, createPhongMaterial, createPreviewMaterial } from "../Utils";
import { CreateObjectCommand } from "../commands/CreateObjectCommand";
import { eventBus, EventEnums } from "../EventBus";
import { CommandStack } from "../CommandStack";
import { LayerEnum } from "../Constants";
import { Editor } from "./Editor";

import { DARK_GRAY, VERTEX_COLOR } from "../Colors";
import { setDefaultCursor } from "../Cursors";
import { LineEditor } from "./LineEditor";

const INITIAL_BED_HEIGHT = 0.15;
const INITIAL_BORDER_WIDTH = 0.10;

const NUM_ARC_SEGMENTS = 1;
const BED_CONFIG_CAMERA_OFFSET = new Vector3(0, -2, 2);


function createBedBorder(vertices: Vector3[], width: number, height: number, material: Material): Mesh {
    /**
     * Create the border of the bed in 3D from a series of points defining the inner bed, plus the border width. 
     * This will be a "donut" shape with an inner-loop the shape of the bed, and the outer loop 
     * a similar shape, but expanded in all directions by the specified `width`
     */

    const verts = vertices.map((v) => ({ "x": v.x, "y": v.y }));

    // Grow the border polygon by `width`
    // Depending on if the vertices were placed CW or CCW, the polygon will shrink or grow. If the border area is smaller than the bed area, 
    // then we need to re-calculate the offset with a flipped sign
    let border = offsetPolygon(verts, width, 1).map((v) => new Vector3(v.x, v.y, 0.0));
    if (polygonArea(border.map((v) => new Vector3(v["x"], v["y"], 0.0))) < polygonArea(vertices)) {
        border = offsetPolygon(verts, -width, NUM_ARC_SEGMENTS).map((v) => new Vector3(v.x, v.y, 0.0));
    }
    border.push(border[0]); // close loop

    const centroid = getCentroid(vertices); // Use the centroid to set the origin of the object at 0,0

    const points = border.map((p) => {
        const temp = p.clone().sub(centroid);
        return new Vector2(temp.x, temp.y);
    });

    const holes = vertices.map((p) => {
        const temp = p.clone().sub(centroid);
        return new Vector2(temp.x, temp.y);
    });

    // Create a "donut" polygon
    const shape = new Shape(points);
    shape.holes.push(new Path(holes));

    const extrudeSettings = {
        depth: height,
        bevelEnabled: false,
        bevelSegments: 2,
        steps: 2,
        bevelSize: 1,
        bevelThickness: 1
    };

    // Extrude 2D polygon to 3D mesh
    return new Mesh(new ExtrudeGeometry(shape, extrudeSettings), material);
}

function createBed(vertices: Vector3[], height: number, material: Material) : Mesh {
    /**
     * Create the 3D bed object from an array of points.
     */

    const verts = vertices.map((v) => v.clone());
    const centroid = getCentroid(verts); // Use the centroid to set the origin of the object at 0,0

    verts.push(vertices[0]);
    const points = verts.map((p) => {
        const temp = p.clone().sub(centroid);
        return new Vector2(temp.x, temp.y);
    });

    const shape = new Shape(points);

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


enum BedEditorMode {
    INACTIVE = "INACTIVE",
    LINE_EDITOR_MODE = "LINE_EDITOR_MODE",
    BED_CONFIG_MODE = "BED_CONFIG_MODE"
}


class BedEditor {

    editor: Editor;
    lineEditor: LineEditor;
    commandStack: CommandStack;
    mode: BedEditorMode;

    vertices: Vector3[]; // Used during vertex placement mode and bed config mode

    // Original bed
    oldBed?: Object3D;

    // Bed Config Mode
    bedPreviewMesh?: Mesh;
    bedPreviewBorder?: Mesh;
    bedHeight: number;
    borderHeight: number;
    borderWidth: number;

    bedColor: string;
    borderColor: string;
    bedName: string;

    constructor(editor: Editor) {

        this.editor = editor;
        this.lineEditor = new LineEditor(
            editor, 
            EventEnums.BED_VERTEX_EDITING_STARTED, 
            EventEnums.BED_VERTEX_EDITING_UPDATED, 
            EventEnums.BED_VERTEX_EDITING_FINISHED, 
            EventEnums.BED_EDITING_CANCELLED,
            true);

        this.commandStack = new CommandStack();
        this.mode = BedEditorMode.INACTIVE;

        this.oldBed = undefined;
        this.vertices = [];

        // Bed Config
        this.bedPreviewMesh = undefined;
        this.bedPreviewBorder = undefined;

        // Default values
        this.bedHeight = INITIAL_BED_HEIGHT;
        this.borderHeight = INITIAL_BED_HEIGHT;
        this.borderWidth = INITIAL_BORDER_WIDTH;

        this.bedColor = DARK_GRAY;
        this.borderColor = VERTEX_COLOR;
        this.bedName = "New Bed";

        eventBus.on(EventEnums.BED_CONFIG_UPDATED, (command) => {
            this.commandStack.execute(command)
            this.createPreviewMesh()
            eventBus.emit(EventEnums.REQUEST_RENDER)
        });

        eventBus.on(EventEnums.BED_VERTEX_EDITING_FINISHED, () => {
            this.setBedConfigMode();
            this.lineEditor.cleanUp();
        })

        eventBus.on(EventEnums.BED_EDITING_FINISHED, (event) => {
            this.createMesh()
            this.cleanUp();
        })

        eventBus.on(EventEnums.BED_EDITING_CANCELLED, (event) => {
            this.cancel();
        })

    }

    public updateBed(props: Object) {
        /**
         * Update bed config from properties
         */
        this.bedHeight = props.bedHeight;
        this.borderHeight = props.borderHeight;
        this.borderWidth = props.borderWidth;
        this.bedColor = props.bedColor;
        this.borderColor = props.borderColor;
        this.bedName = props.name;
    }

    public cancel() {
        if (this.oldBed) {
            this.editor.execute(new CreateObjectCommand(this.oldBed, this.editor))
        }
        this.cleanUp();
        this.lineEditor.cancel();
    }

    // Cleanup
    public cleanUp() {
        this.oldBed = undefined;
        this.lineEditor.cleanUp()
        this.cleanUpBedConfigState()

        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    private cleanUpBedConfigState() {
        this.editor.remove(this.bedPreviewMesh)
        this.editor.remove(this.bedPreviewBorder)
        this.bedPreviewMesh = undefined;
        this.bedPreviewBorder = undefined;
    }

    // Change modes
    public beginBedEditing(bed?: Object3D) {
        this.cleanUp();
        this.mode = BedEditorMode.LINE_EDITOR_MODE;

        if (bed === undefined) { // Create new bed
            this.lineEditor.beginLineEditing()
        } else { // Edit existing bed
            this.lineEditor.beginLineEditing(bed.userData.vertices);
            this.updateBed(bed.userData)
            this.oldBed = bed;
            this.editor.remove(bed);
        }
    }

    private setBedConfigMode() {

        this.vertices = this.lineEditor.vertexHandles.map((item) => item.position.clone());
        this.mode = BedEditorMode.BED_CONFIG_MODE;

        // Reset cursor
        setDefaultCursor()
        this.lineEditor.cleanUp()
        this.editor.setPerspectiveCamera()
        this.createPreviewMesh()

        // get the centroid of the points
        const centroid = getCentroid(this.vertices);

        // make the camera south of the newly-created bed + Make the camera look at the newly-created bed
        this.editor.currentCamera.position.set(...centroid.clone().add(BED_CONFIG_CAMERA_OFFSET))
        this.editor.currentCameraControls.target.copy(centroid)

        eventBus.emit(EventEnums.CHANGE_CAMERA_UI, false) // change UI
        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    // Drawing

    private createPreviewMesh() {

        this.editor.remove(this.bedPreviewBorder)
        this.editor.remove(this.bedPreviewMesh)

        this.bedPreviewBorder = createBedBorder(this.vertices, this.borderWidth, this.borderHeight, createPreviewMaterial(this.borderColor));
        this.editor.add(this.bedPreviewBorder)

        this.bedPreviewMesh = createBed(this.vertices, this.bedHeight, createPreviewMaterial(this.bedColor))
        this.editor.add(this.bedPreviewMesh)

        // Move the mesh to the centroid so that it doesn't spawn at the origin
        const centroid = getCentroid(this.vertices);
        centroid.add(new Vector3(0, 0, 0.01)) // prevent z-fighting
        this.bedPreviewBorder.position.set(...centroid);
        this.bedPreviewMesh.position.set(...centroid);
    }

    private createMesh() {

        // Create and merge border + bed meshes
        const centroid = getCentroid(this.vertices);

        const border = createBedBorder(this.vertices, this.borderWidth, this.borderHeight, createPhongMaterial(this.borderColor));
        const bed = createBed(this.vertices, this.bedHeight, createPhongMaterial(this.bedColor));

        let mergedMesh = mergeMeshes([border, bed]);
        mergedMesh.geometry.computeBoundingBox();  
        mergedMesh.geometry.center();             

        mergedMesh.castShadow = true;
        mergedMesh.receiveShadow = true;
        mergedMesh.userData = { // Give mesh the data used to create it, so it can be edited. Add selection callbacks
            selectable: true,
            onSelect: () => eventBus.emit(EventEnums.BED_SELECTED, true),
            onDeselect: () => eventBus.emit(EventEnums.BED_SELECTED, false),
            vertices: this.vertices,
            bedHeight: this.bedHeight,
            borderHeight: this.borderHeight,
            borderWidth: this.borderWidth,
            bedColor: this.bedColor,
            borderColor: this.borderColor,
            name: this.bedName,
            editableFields: {
                name: true,
                position: true,
                rotation: true,
            }
        }
        mergedMesh.layers.set(LayerEnum.Objects)
        mergedMesh.name = this.bedName;

        // Move to position
        const box = new Box3().setFromObject(mergedMesh);
        const size = new Vector3();
        box.getSize(size);
        mergedMesh.position.set(...centroid.clone().add(new Vector3(0,0,size.z / 2)))


        // update mesh position, rotation, and scale if editing a pre-existing bed
        if (this.oldBed) {
            mergedMesh.position.copy(this.oldBed.position)
            mergedMesh.rotation.copy(this.oldBed.rotation)
            mergedMesh.scale.copy(this.oldBed.scale)
        }

        this.editor.execute(new CreateObjectCommand(mergedMesh, this.editor));

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
            case BedEditorMode.LINE_EDITOR_MODE:
                this.lineEditor.undo();
                break;
            case BedEditorMode.BED_CONFIG_MODE:
                this.createPreviewMesh()
                break;
            default:
                break;
        }
        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    public getBedArea(): number {
        switch (this.mode) {
            case BedEditorMode.INACTIVE:
                return NaN;
            case BedEditorMode.LINE_EDITOR_MODE:
                return this.lineEditor.getPolygonArea();
            default:
                return polygonArea(this.vertices);
        }
    }

    public handleMouseMove(editor: Editor, intersections: Object3D[]) {
        this.lineEditor.handleMouseMove(editor, intersections)
    }

    public handleMouseClick(editor: Editor, intersections: Object3D[]) {
        this.lineEditor.handleMouseClick(editor, intersections);
    }

}

export { BedEditor, BedEditorMode };