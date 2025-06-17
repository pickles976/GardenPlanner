/**
 * 1. Place Vertices
 *  a. insert and undo
 *  b. close loop by clicking on start vertex
 * 2. Edit Vertices
 * 3. Configure Bed
 * 4. Save finalized mesh
 * 
 * TODO: make this all command-based at some point
 */

import { Object3D, ShapeGeometry, MeshBasicMaterial, MeshPhongMaterial, BoxGeometry, Line, Vector3, Mesh, Vector2, Shape, Material, ExtrudeGeometry, Path, Float32BufferAttribute, Group } from "three";
import * as THREE from "three";



import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import offsetPolygon from "offset-polygon";
import "external-svg-loader";

import { destructureVector3Array, getCentroid, polygonArea, mergeMeshes, createPhongMaterial, createPreviewMaterial, rad2deg, fontSizeString, getCSS2DText } from "./Utils";
import { CreateObjectCommand } from "./commands/CreateObjectCommand";
import { SetPositionCommand } from "./commands/SetPositionCommand";
import { eventBus, EventEnums } from "./EventBus";
import { CommandStack } from "./CommandStack";
import { FONT_SIZE, LayerEnum } from "./Constants";
import { Editor } from "./Editor";

import { DARK_GRAY, GREEN, UI_GRAY_COLOR, UI_GREEN_COLOR, VERTEX_COLOR, YELLOW } from "./Colors";
import { setCrossCursor, setDefaultCursor } from "./Cursors";
import { handleMouseMoveObjectMode, processIntersections } from "./EventHandlers";
import { snapper } from "./Snapping";

const INITIAL_BED_HEIGHT = 0.15;
const INITIAL_BORDER_WIDTH = 0.10;

const VERTEX_SIZE = 0.05;
const POLYGON_CLOSE_THRESH = 0.1;
const NUM_ARC_SEGMENTS = 1;
const BED_CONFIG_CAMERA_OFFSET = new Vector3(0, -2, 2);
const LINE_WIDTH = 5;

const SVG_SIZE = '50px';

const POLYGON_OPACITY = 0.2;



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

function createVertexHandle(): Mesh {
    /**
     * Create a grabbable and moveable 3D vertex object
     */
    const vertex = new Mesh(
        new BoxGeometry(VERTEX_SIZE, VERTEX_SIZE, VERTEX_SIZE),
        new MeshPhongMaterial({ color: VERTEX_COLOR }))
    vertex.layers.set(LayerEnum.BedVertices);
    vertex.userData = { selectable: true, isVertexHandle: true }
    vertex.renderOrder = 100001; // Always draw on top
    return vertex
}

function createBed(vertices: Vector3[], height: number, material: Material) {
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


function createLineSegment(point: Vector3, lastPoint: Vector3): Object3D {
    /**
     * Create a line segment object from 2 points. Includes label for the length of the line.
     */

    // Get Distance Text
    let textPos = lastPoint.clone().add(point.clone()).divideScalar(2);
    const lineLabel = getCSS2DText(snapper.getText(lastPoint.distanceTo(point)), fontSizeString(FONT_SIZE));
    lineLabel.position.set(...textPos)

    // Get line segment
    const geometry = new LineGeometry();
    geometry.setPositions(destructureVector3Array([point, lastPoint]));
    const material = new LineMaterial({ color: GREEN, linewidth: 5, depthWrite: false, depthTest: false });
    const line = new Line2(geometry, material);

    const group = new Group();
    group.add(line);
    group.add(lineLabel);

    return group;

}

function createButton(position: Vector3, icon: string, color: string): CSS2DObject {
    /**
     * Create a clickable button as a CSS2DObject
     */

    const button = document.createElement('button');
    button.style.backgroundColor = 'transparent';
    button.style.pointerEvents = "all"

    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    svgEl.setAttribute('data-src', icon);
    svgEl.setAttribute('fill', 'currentColor');
    svgEl.setAttribute('width', SVG_SIZE);
    svgEl.setAttribute('height', SVG_SIZE);
    svgEl.style.color = color;
    button.appendChild(svgEl)

    button.addEventListener('mouseenter', () => {
        // For each child element, increase brightness
        svgEl.style.filter = 'brightness(2.0)';
    });

    button.addEventListener('mouseleave', () => {
        // Remove the brightness filter
        svgEl.style.filter = '';
    });

    const label = new CSS2DObject(button);
    label.position.set(...position);
    return label;
}

function createPolygon(points: Vector3[]): Mesh {
    /** Create a Polygon from an array of points */
    let polyShape = new Shape(points.map((coord) => new Vector2(coord.x, coord.y)))
    const polyGeometry = new ShapeGeometry(polyShape);
    polyGeometry.setAttribute("position", new Float32BufferAttribute(points.map(coord => [coord.x, coord.y, coord.z]).flat(), 3))
    return new Mesh(polyGeometry, new MeshBasicMaterial({ color: GREEN, side: THREE.DoubleSide, transparent: true, opacity: POLYGON_OPACITY, depthWrite: false, depthTest: false }))
}

enum BedEditorMode {
    INACTIVE = "INACTIVE",
    PLACE_VERTEX_MODE = "PLACE_VERTEX_MODE",
    EDIT_VERTEX_MODE = "EDIT_VERTEX_MODE",
    BED_CONFIG_MODE = "BED_CONFIG_MODE"
}


class BedEditor {

    editor: Editor;
    commandStack: CommandStack;
    mode: BedEditorMode;

    vertices: Vector3[]; // Used during vertex placement mode and bed config mode

    // Original bed
    oldBed?: Object3D;

    // Vertex Placement mode
    lastPoint?: Vector3;
    linePreview?: Line;
    angleText?: TextGeometry;
    distanceText?: TextGeometry;

    // Vertex Edit mode
    vertexHandles: Object3D[];
    lineSegments: Object3D[];
    polygon?: Object3D;
    selectedHandle?: Object3D;
    saveButton?: CSS2DObject;
    cancelButton?: CSS2DObject;

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
        this.commandStack = new CommandStack();
        this.mode = BedEditorMode.INACTIVE;

        this.oldBed = undefined;

        // Placement mode
        this.vertices = []
        this.lastPoint = undefined;
        this.linePreview = undefined;
        this.angleText = undefined;
        this.distanceText = undefined;

        // Edit mode
        this.vertexHandles = []
        this.lineSegments = []
        this.polygon = undefined;
        this.selectedHandle = undefined;

        this.saveButton = undefined;
        this.cancelButton = undefined;

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

        eventBus.on(EventEnums.VERTEX_EDITING_FINISHED, () => this.setBedConfigMode())

        eventBus.on(EventEnums.BED_EDITING_FINISHED, (event) => {
            this.createMesh()
            this.cleanUp();
        })

        eventBus.on(EventEnums.BED_EDITING_CANCELLED, (event) => {
            this.cancel();
        })

        eventBus.on(EventEnums.METRIC_CHANGED, () => {
            if (this.mode === BedEditorMode.EDIT_VERTEX_MODE) {
                this.drawBedPolygon()
            }
            // TODO: figure out how to change text when in vertex placement mode
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
    }

    // Cleanup
    public cleanUp() {
        this.oldBed = undefined;
        this.cleanUpVertexPlacementState()
        this.cleanUpVertexEditingState()
        this.cleanUpBedConfigState()

        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    private cleanUpVertexPlacementState() {
        this.editor.remove(this.linePreview)
        this.editor.remove(this.angleText)
        this.editor.remove(this.distanceText)

        this.vertices = []

        while (this.commandStack.stack.length > 0) {
            this.commandStack.undo()
        }

    }

    private cleanUpVertexEditingState() {
        for (const vertex of this.vertexHandles) {
            this.editor.remove(vertex)
        }

        for (const segment of this.lineSegments) {
            this.editor.remove(segment)
        }

        this.editor.remove(this.polygon)
        this.editor.remove(this.saveButton)
        this.editor.remove(this.cancelButton)

        this.lineSegments = []
        this.vertexHandles = []

        setDefaultCursor()
    }

    private cleanUpBedConfigState() {
        this.editor.remove(this.bedPreviewMesh)
        this.editor.remove(this.bedPreviewBorder)
        this.bedPreviewMesh = undefined;
        this.bedPreviewBorder = undefined;
    }

    // Change modes
    public beginBedEditing(bed?: Object3D) {
        if (bed === undefined) { // Create new bed
            this.setVertexPlacementMode()
        } else { // Edit existing bed
            this.vertices = bed.userData.vertices;
            this.updateBed(bed.userData)
            this.setVertexEditMode()
            this.oldBed = bed;
            this.editor.remove(bed);
        }
    }

    private setVertexPlacementMode() {
        this.cleanUp()
        this.mode = BedEditorMode.PLACE_VERTEX_MODE;

        setCrossCursor()
        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    private setVertexEditMode() {
        // Reset cursor
        setDefaultCursor()
        this.createVertexHandles();
        this.cleanUpVertexPlacementState()
        this.drawBedPolygon();
        this.mode = BedEditorMode.EDIT_VERTEX_MODE;
        eventBus.emit(EventEnums.VERTEX_EDITING_STARTED)
    }

    private setBedConfigMode() {

        this.vertices = this.vertexHandles.map((item) => item.position.clone());
        this.mode = BedEditorMode.BED_CONFIG_MODE;

        // Reset cursor
        setDefaultCursor()
        this.cleanUpVertexEditingState()
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

        const mergedMesh = mergeMeshes([border, bed]);
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
            borderColor: this.borderColor
        }
        mergedMesh.layers.set(LayerEnum.Objects)
        mergedMesh.position.set(...centroid)
        mergedMesh.name = this.bedName;

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
        this.editor.setObjectMode()
        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    private drawBedPolygon() {
        /**
         * Draw line segments between vertex handles, with a transparent polygon + labels
         */

        // Redraw Line Segments
        for (const segment of this.lineSegments) {
            this.editor.remove(segment)
        }

        this.lineSegments = []

        const len = this.vertexHandles.length;
        for (let i = 0; i < len; i++) {
            const p1 = this.vertexHandles[i % len].position
            const p2 = this.vertexHandles[(i + 1) % len].position
            const lineSegment = createLineSegment(p1, p2)
            const line = lineSegment.children[0]
            line.userData = {
                isLineSegment: true,
                p1: i % len,
                p2: (i + 1) % len
            }
            line.layers.set(LayerEnum.BedVertices)
            this.lineSegments.push(lineSegment)
        }

        for (const segment of this.lineSegments) {
            this.editor.add(segment)
        }

        // Redraw Polygon
        this.editor.remove(this.polygon)
        this.polygon = createPolygon(this.vertexHandles.map((item) => item.position));
        this.editor.add(this.polygon)

        // Redraw buttons
        const vertices = this.vertexHandles.map((item) => item.position.clone());
        const centroid = getCentroid(vertices);

        this.editor.remove(this.saveButton)
        this.saveButton = createButton(centroid, "/icons/check-circle.svg", UI_GREEN_COLOR)
        this.saveButton.center.set(1.0, 0.5);
        this.editor.add(this.saveButton)

        this.saveButton.element.addEventListener('click', () => {
            eventBus.emit(EventEnums.VERTEX_EDITING_FINISHED)
        });

        this.editor.remove(this.cancelButton)
        this.cancelButton = createButton(centroid, "/icons/cancel.svg", UI_GRAY_COLOR)
        this.cancelButton.center.set(0.0, 0.5);
        this.editor.add(this.cancelButton)

        this.cancelButton.element.addEventListener('click', () => {
            eventBus.emit(EventEnums.BED_EDITING_CANCELLED)
        });

    }

    private createVertexHandles() {
        /**
         * Create interactable vertex objects from 3D points
         */

        for (const point of this.vertices) {
            const vertex = createVertexHandle();
            this.editor.add(vertex);
            vertex.position.set(...point)
            this.vertexHandles.push(vertex)
        }

    }

    // Event Handling

    private tryCloseLoop(point: Vector3): boolean {

        if (this.vertices.length > 0) {
            const startVertex = this.vertices[0];
            if (startVertex.distanceTo(point) < POLYGON_CLOSE_THRESH) {
                this.setVertexEditMode()
                return true;
            }
        }

        return false;
    }

    private handleMouseClickPlaceVerticesMode(editor: Editor, object: Object3D, point: Vector3) {

        // If loop is closed, go to `VERTEX_EDIT_MODE`
        if (this.tryCloseLoop(point)) {
            eventBus.emit(EventEnums.REQUEST_RENDER)
            return
        }

        this.vertices.push(point);

        if (this.vertices.length < 2) {
            return
        }

        // Create line segment
        const lineSegment = createLineSegment(point, this.vertices[this.vertices.length - 2].clone());
        this.commandStack.execute(new CreateObjectCommand(lineSegment, this.editor));

        // Remove previous labels
        this.editor.remove(this.angleText)
        this.editor.remove(this.distanceText)

        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    private handleMouseClickEditVerticesMode(editor: Editor, object: Object3D, point: Vector3) {

        if (this.selectedHandle === undefined) {

            // Insert vertex
            if (object.userData.isLineSegment) {
                // TODO: make this undoable (would need to make a custom command that stores the old and new arrays of VertexHandle objects?)
                const vertex = createVertexHandle()
                this.editor.add(vertex)
                vertex.position.set(...point)
                this.vertexHandles.splice(object.userData.p1 + 1, 0, vertex)
                this.drawBedPolygon()
                return
            }

            // Select clicked handle
            if (object.userData.isVertexHandle) {
                this.selectedHandle = object;
                return
            }

        } else {
            this.selectedHandle = undefined; // deselect
        }


    }

    public handleMouseClick(editor: Editor, intersections: THREE.Object3D[]) {

        let [object, point] = processIntersections(intersections)

        if (point === undefined) {
            return
        }

        point = snapper.snap(point)

        switch (this.mode) {
            case BedEditorMode.PLACE_VERTEX_MODE:
                this.handleMouseClickPlaceVerticesMode(editor, object, point)
                break;
            default:
                this.handleMouseClickEditVerticesMode(editor, object, point)
                break;
        }
    }

    private handleMouseMovePlaceVerticesMode(editor: Editor, object: Object3D, point: Vector3) {

        this.lastPoint = point;

        this.editor.remove(this.linePreview)
        this.editor.remove(this.angleText)
        this.editor.remove(this.distanceText)

        if (this.vertices.length == 0) {
            return
        }

        // Draw line preview to show what new line segment would look like
        const lastPoint = this.vertices[this.vertices.length - 1]
        const geometry = new LineGeometry();
        geometry.setPositions(destructureVector3Array([lastPoint, point]))
        const material = new LineMaterial({ color: YELLOW, linewidth: LINE_WIDTH, depthWrite: false, depthTest: false });
        this.linePreview = new Line2(geometry, material);
        this.linePreview.renderOrder = 100000; // Always draw on top
        this.editor.add(this.linePreview)

        // Angle text
        const segment = lastPoint.clone().sub(point)
        let angle = rad2deg(segment.angleTo(new Vector3(0, -1, 0)));
        let textPos = lastPoint.clone().add(point.clone()).divideScalar(2);
        this.angleText = getCSS2DText(`${angle.toFixed(2)}°`, fontSizeString(FONT_SIZE))
        this.angleText.position.set(...textPos)
        this.editor.add(this.angleText)

        // Distance
        textPos = lastPoint.clone().add(point.clone()).divideScalar(2);
        this.distanceText = getCSS2DText(snapper.getText(lastPoint.distanceTo(point)), fontSizeString(-1 * FONT_SIZE))
        this.distanceText.position.set(...textPos)
        this.editor.add(this.distanceText)

    }

    private handleMouseMoveEditVerticesMode(editor: Editor, object: Object3D, point: Vector3) {

        setDefaultCursor();

        if (point === undefined) {
            return
        }

        // This is here because the raycast intersects the vertex continuously, causing it to "climb"
        // TODO: figure out a way to do this without hardcoding the location to z=0
        point.z = 0.0

        if (this.selectedHandle === undefined) { // No vertex selected

            if (object === undefined) {
                return
            }

            if (object.userData.isLineSegment === true) { // mouse over line segment
                setCrossCursor()
            }
        } else { // vertex selected
            this.commandStack.execute(new SetPositionCommand(this.selectedHandle, this.selectedHandle.position, point))
            this.drawBedPolygon()
        }
    }

    public handleMouseMove(editor: Editor, intersections: THREE.Object3D[]) {

        let [object, point] = processIntersections(intersections);

        if (point === undefined) {
            return
        }

        point = snapper.snap(point)


        switch (this.mode) {
            case BedEditorMode.PLACE_VERTEX_MODE:
                this.handleMouseMovePlaceVerticesMode(editor, object, point);
                break;
            case BedEditorMode.EDIT_VERTEX_MODE:
                // call this function for free highlighting
                handleMouseMoveObjectMode(editor, object, point);
                this.handleMouseMoveEditVerticesMode(editor, object, point);
                eventBus.emit(EventEnums.VERTEX_EDITING_UPDATED);
                break;
            default:
                break;
        }


    }

    public handleKeyDown(event) {
        switch (event.key) {

            case 'z':
                if (event.ctrlKey) {
                    this.undo();
                }
                break;

            case 'Escape':
                // Deselect vertex handle
                this.editor.selector.deselect();
                this.selectedHandle = undefined;
                break;

            case 'Delete':
                switch (this.mode) {
                    case BedEditorMode.EDIT_VERTEX_MODE:
                        this.deleteSelectedHandle();
                        break;
                    default:
                        break;
                }
                break;

        }
    }

    private deleteSelectedHandle() {

        if (this.selectedHandle === undefined) {
            return
        }

        // don't allow user to deleteSelectedHandle the loop
        if (this.vertexHandles.length === 3) {
            return
        }

        this.editor.remove(this.selectedHandle)

        for (let i = 0; i < this.vertexHandles.length; i++) {
            if (this.vertexHandles[i] === this.selectedHandle) {
                this.vertexHandles.splice(i, 1)
            }
        }

        this.drawBedPolygon()
        eventBus.emit(EventEnums.REQUEST_RENDER)

    }

    public undo() {
        this.commandStack.undo();
        switch (this.mode) {
            case BedEditorMode.PLACE_VERTEX_MODE:
                this.vertices.pop();
                break;
            case BedEditorMode.EDIT_VERTEX_MODE:
                this.drawBedPolygon();
                break;
            case BedEditorMode.BED_CONFIG_MODE:
                this.createPreviewMesh()
                break;
            default:
                break;
        }
        this.handleMouseMove(this.editor, undefined, this.lastPoint);
        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    public getBedArea(): number {
        switch (this.mode) {
            case BedEditorMode.INACTIVE:
                return NaN;
            case BedEditorMode.EDIT_VERTEX_MODE:
                return polygonArea(this.vertexHandles.map((item) => item.position.clone()));
            default:
                return polygonArea(this.vertices);

        }
    }

}

export { BedEditor, BedEditorMode };