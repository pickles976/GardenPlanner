import * as THREE from "three";

import offsetPolygon from "offset-polygon";

import { getCentroid, polygonArea, mergeMeshes, createPhongMaterial, createPreviewMaterial } from "../Utils";
import { CreateObjectCommand } from "../commands/CreateObjectCommand";
import { eventBus, EventEnums } from "../EventBus";
import { CommandStack } from "../CommandStack";
import { LayerEnum, Props } from "../Constants";
import { Editor } from "../Editor";

import { DARK_GRAY, VERTEX_COLOR, WHITE } from "../Colors";
import { setDefaultCursor } from "../Cursors";
import { LineEditor } from "./LineEditor";
import { mudMaterial, mulchMaterial, rockMaterial } from "../Materials";
import { setCurrentTransformationAsDefault } from "../ModelLoader";

const INITIAL_BED_HEIGHT = 0.15;
const INITIAL_BORDER_WIDTH = 0.10;

const NUM_ARC_SEGMENTS = 1;
const BED_CONFIG_CAMERA_OFFSET = new THREE.Vector3(0, 2, -2);


function createBedBorder(vertices: THREE.Vector3[], width: number, height: number, material: THREE.Material): THREE.Mesh {
    /**
     * Create the border of the bed in 3D from a series of points defining the inner bed, plus the border width. 
     * This will be a "donut" shape with an inner-loop the shape of the bed, and the outer loop 
     * a similar shape, but expanded in all directions by the specified `width`
     */

    const verts = vertices.map((v) => ({ "x": v.x, "y": v.z }));

    // Grow the border polygon by `width`
    // Depending on if the vertices were placed CW or CCW, the polygon will shrink or grow. If the border area is smaller than the bed area, 
    // then we need to re-calculate the offset with a flipped sign
    let border = offsetPolygon(verts, width, 1).map((v) => new THREE.Vector3(v.x, 0.0, v.y));
    if (polygonArea(border.map((v) => new THREE.Vector3(v["x"], 0.0, v["z"]))) < polygonArea(vertices)) {
        border = offsetPolygon(verts, -width, NUM_ARC_SEGMENTS).map((v) => new THREE.Vector3(v.x, 0.0, v.y));
    }
    border.push(border[0]); // close loop

    const centroid = getCentroid(vertices); // Use the centroid to set the origin of the object at 0,0

    const points = border.map((p) => {
        const temp = p.clone().sub(centroid);
        return new THREE.Vector2(temp.x, temp.z);
    });

    const holes = vertices.map((p) => {
        const temp = p.clone().sub(centroid);
        return new THREE.Vector2(temp.x, temp.z);
    });

    // Create a "donut" polygon
    const shape = new THREE.Shape(points);
    shape.holes.push(new THREE.Path(holes));

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

    // Extrude 2D polygon to 3D mesh
    return new THREE.Mesh(geometry, material);;
}

function createBed(vertices: THREE.Vector3[], height: number, material: THREE.Material) : THREE.Mesh {
    /**
     * Create the 3D bed object from an array of points.
     */

    const verts = vertices.map((v) => v.clone());
    const centroid = getCentroid(verts); // Use the centroid to set the origin of the object at 0,0

    verts.push(vertices[0]);
    const points = verts.map((p) => {
        const temp = p.clone().sub(centroid);
        return new THREE.Vector3(temp.x, temp.z);
    });

    const shape = new THREE.Shape(points);

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

    return new THREE.Mesh(geometry, material);;
}


enum BedEditorMode {
    INACTIVE = "INACTIVE",
    LINE_EDITOR_MODE = "LINE_EDITOR_MODE",
    CONFIG_MODE = "CONFIG_MODE"
}

export class BedProps extends Props {

    bedHeight: number;
    borderHeight: number;
    borderWidth: number;

    bedColor: string;
    borderColor: string;
    name: string;

    constructor(bedHeight, borderHeight, borderWidth, bedColor, borderColor, name) {
        super(["bedColor", "borderColor", "name"])
        this.bedHeight = bedHeight;
        this.borderHeight = borderHeight;
        this.borderWidth = borderWidth;
        this.bedColor = bedColor;
        this.borderColor = borderColor;
        this.name = name;
    }

    public clone() {
        return new BedProps(
            this.bedHeight,
            this.borderHeight,
            this.borderWidth,
            this.bedColor,
            this.borderColor,
            this.name
        )
    }

}


class BedEditor {

    editor: Editor;
    lineEditor: LineEditor;
    commandStack: CommandStack;
    mode: BedEditorMode;

    vertices: THREE.Vector3[]; // Used during vertex placement mode and bed config mode

    // Original bed
    oldBed?: THREE.Object3D;

    // Bed Config Mode
    bedPreviewMesh?: THREE.Mesh;
    bedPreviewBorder?: THREE.Mesh;
    
    props: BedProps;

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
        this.props = new BedProps(
            INITIAL_BED_HEIGHT,
            INITIAL_BED_HEIGHT,
            INITIAL_BORDER_WIDTH,
            DARK_GRAY,
            VERTEX_COLOR,
            "New Bed"
        )

        eventBus.on(EventEnums.BED_CONFIG_UPDATED, (command) => {
            this.commandStack.execute(command)
            this.createPreviewMesh()
            
        });

        eventBus.on(EventEnums.BED_VERTEX_EDITING_FINISHED, () => {
            this.setConfigMode();
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

    public updateFromProps(props: BedProps) {
        this.props = props
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
        this.commandStack.clear()
    }

    private cleanUpBedConfigState() {
        this.editor.remove(this.bedPreviewMesh)
        this.editor.remove(this.bedPreviewBorder)
        this.bedPreviewMesh = undefined;
        this.bedPreviewBorder = undefined;
    }

    // Change modes
    public beginEditing(bed?: THREE.Object3D) {
        this.cleanUp();
        this.mode = BedEditorMode.LINE_EDITOR_MODE;

        if (bed === undefined) { // Create new bed
            this.lineEditor.beginEditing()
        } else { // Edit existing bed
            this.lineEditor.beginEditing(bed.userData.vertices);
            this.updateFromProps(bed.userData.props)
            this.oldBed = bed;
            this.editor.remove(bed);
        }
    }

    private setConfigMode() {

        this.vertices = this.lineEditor.vertexHandles.map((item) => item.position.clone());
        this.mode = BedEditorMode.CONFIG_MODE;

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
        
    }

    // Drawing

    private createPreviewMesh() {

        this.editor.remove(this.bedPreviewBorder)
        this.editor.remove(this.bedPreviewMesh)

        this.bedPreviewBorder = createBedBorder(this.vertices, this.props.borderWidth, this.props.borderHeight, createPreviewMaterial(this.props.borderColor));
        this.editor.add(this.bedPreviewBorder)

        this.bedPreviewMesh = createBed(this.vertices, this.props.bedHeight, createPreviewMaterial(this.props.bedColor))
        this.editor.add(this.bedPreviewMesh)

        // Move the mesh to the centroid so that it doesn't spawn at the origin
        const centroid = getCentroid(this.vertices);
        centroid.add(new THREE.Vector3(0, 0, 0.01)) // prevent z-fighting
        this.bedPreviewBorder.position.set(...centroid);
        this.bedPreviewMesh.position.set(...centroid);
    }

    private createMesh() {

        // Create and merge border + bed meshes
        const centroid = getCentroid(this.vertices);

        const border = createBedBorder(this.vertices, this.props.borderWidth, this.props.borderHeight, createPhongMaterial(this.props.borderColor));
        const bed = createBed(this.vertices, this.props.bedHeight, createPhongMaterial(this.props.bedColor));

        // Set origin at the halfway point of the bed object
        let mergedMesh = mergeMeshes([border, bed]);
        mergedMesh.geometry.setAttribute('uv2', new THREE.BufferAttribute(mergedMesh.geometry.attributes.uv.array, 2));

        const box = new THREE.Box3().setFromObject(mergedMesh);
        const size = new THREE.Vector3();
        box.getSize(size);

        mergedMesh.geometry.translate(0,-size.y / 2,0)

        mergedMesh.castShadow = true;
        mergedMesh.receiveShadow = true;
        mergedMesh.userData = { // Give mesh the data used to create it, so it can be edited. Add selection callbacks
            selectable: true,
            onSelect: () => eventBus.emit(EventEnums.BED_SELECTED, true),
            onDeselect: () => eventBus.emit(EventEnums.BED_SELECTED, false),
            vertices: this.vertices,
            props: this.props,
            editableFields: {
                name: true,
                position: true,
                rotation: true,
            }
        }
        mergedMesh.layers.set(LayerEnum.Objects)
        mergedMesh.name = this.props.name;

        // Move to position
        mergedMesh.position.set(...centroid.clone().add(new THREE.Vector3(0,size.y / 2,0)))

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
    }

    public handleKeyDown(event) {
        switch (this.mode) {
            case BedEditorMode.LINE_EDITOR_MODE:
                this.lineEditor.handleKeyDown(event)
                break;
            case BedEditorMode.CONFIG_MODE:
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

    public handleMouseMove(intersections: THREE.Object3D[]) {
        this.lineEditor.handleMouseMove(intersections)
    }

    public handleMouseClick(intersections: THREE.Object3D[]) {
        this.lineEditor.handleMouseClick(intersections);
    }

}

export { BedEditor, BedEditorMode };