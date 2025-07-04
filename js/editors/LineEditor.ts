/**
 * 1. Place Vertices
 *  a. insert and undo
 *  b. close loop by clicking on start vertex
 * 2. Edit Vertices
 * 
 * TODO: make this all command-based at some point
 * 1. create a mapping of vertex handle objects to vertices
 * 2. add a callback to the vertex handles to update the vertices based on index
 * 3. make everything command-based, use UUIDs to track
 */

import * as THREE from "three";

import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import "external-svg-loader";

import { destructureVector3Array, getCentroid, polygonArea, rad2deg, fontSizeString, getCSS2DText, northAngleToVec } from "../Utils";
import { CreateObjectCommand } from "../commands/CreateObjectCommand";
import { SetPositionCommand } from "../commands/SetPositionCommand";
import { eventBus, EventEnums } from "../EventBus";
import { CommandStack } from "../CommandStack";
import { FONT_SIZE, LayerEnum } from "../Constants";
import { Editor } from "../Editor";

import { DARK_GRAY, GREEN, UI_GRAY_COLOR, UI_GREEN_COLOR, VERTEX_COLOR, YELLOW } from "../Colors";
import { setCrossCursor, setDefaultCursor } from "../Cursors";
import { processIntersections } from "../EventHandlers";
import { snapper } from "../Snapping";

const VERTEX_SIZE = 0.05;
const POLYGON_CLOSE_THRESH = VERTEX_SIZE;
const LINE_WIDTH = 5;

const SVG_SIZE = '50px';

const POLYGON_OPACITY = 0.2;


function createVertexHandle(): THREE.Mesh {
    /**
     * Create a grabbable and moveable 3D vertex object
     */
    const vertex = new THREE.Mesh(
        new THREE.BoxGeometry(VERTEX_SIZE, VERTEX_SIZE, VERTEX_SIZE),
        new THREE.MeshPhongMaterial({ color: VERTEX_COLOR }))
    vertex.layers.set(LayerEnum.LineVertices);
    vertex.userData = { selectable: true, isVertexHandle: true }
    vertex.renderOrder = 100001; // Always draw on top
    return vertex
}

function createLineSegment(point: THREE.Vector3, lastPoint: THREE.Vector3): THREE.Object3D {
    /**
     * Create a line segment object from 2 points. Includes label for the length of the line.
     */

    // Get Distance Text
    let textPos = lastPoint.clone().add(point.clone()).divideScalar(2);
    const lineLabel = getCSS2DText(snapper.getText(lastPoint.distanceTo(point)), fontSizeString(FONT_SIZE));
    lineLabel.position.set(...textPos)

    // Get line segment
    const geometry = new LineGeometry();
    const p1 = point.clone();
    const p2 = lastPoint.clone();
    p1.y = 0.01;
    p2.y = 0.01;
    geometry.setPositions(destructureVector3Array([p1, p2]));
    const material = new LineMaterial({ color: GREEN, linewidth: 5, depthWrite: false, depthTest: false });
    const line = new Line2(geometry, material);

    const group = new THREE.Group();
    group.add(line);
    group.add(lineLabel);

    return group;

}

function createButton(position: THREE.Vector3, icon: string, color: string): CSS2DObject {
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

export function createPolygon(points: THREE.Vector3[]): THREE.Mesh {
    /** Create a Polygon from an array of points */
    let polyShape = new THREE.Shape(points.map((coord) => new THREE.Vector2(coord.x, coord.z)))
    const polyGeometry = new THREE.ShapeGeometry(polyShape);
    polyGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points.map(coord => [coord.x, coord.y, coord.z]).flat(), 3))
    const polygon = new THREE.Mesh(polyGeometry, new THREE.MeshBasicMaterial({ color: GREEN, side: THREE.DoubleSide, transparent: true, opacity: POLYGON_OPACITY, depthWrite: false, depthTest: false }))
    polygon.layers.set([LayerEnum.NoRaycast])
    return polygon;
}

function createLinePreview(startPoint: THREE.Vector3, endPoint: THREE.Vector3) : Line2 {
    const geometry = new LineGeometry();
    geometry.setPositions(destructureVector3Array([startPoint, endPoint]))
    const material = new LineMaterial({ color: YELLOW, linewidth: LINE_WIDTH, depthWrite: false, depthTest: false });
    const linePreview = new Line2(geometry, material);
    linePreview.renderOrder = 100000; // Always draw on top
    return linePreview;
}

enum LineEditorMode {
    INACTIVE = "INACTIVE",
    PLACE_VERTEX_MODE = "PLACE_VERTEX_MODE",
    EDIT_VERTEX_MODE = "EDIT_VERTEX_MODE"
}

class LineEditor {

    vertex_editing_started_enum: EventEnums;
    vertex_editing_updated_enum: EventEnums;
    vertex_editing_finished_enum: EventEnums;
    cancelled_enum: EventEnums;  
    closedLoop: boolean;

    editor: Editor;
    commandStack: CommandStack;
    mode: LineEditorMode;

    vertices: THREE.Vector3[]; // Used during vertex placement mode and bed config mode

    // Vertex Placement mode
    lastPoint?: THREE.Vector3;
    linePreview?: THREE.Line;
    angleText?: TextGeometry;
    distanceText?: TextGeometry;

    // Vertex Edit mode
    vertexHandles: THREE.Object3D[];
    lineSegments: THREE.Object3D[];
    polygon?: THREE.Object3D;
    selectedHandle?: THREE.Object3D;
    saveButton?: CSS2DObject;
    cancelButton?: CSS2DObject;

    constructor(
        editor: Editor, 
        vertex_editing_started_enum: EventEnums,
        vertex_editing_updated_enum: EventEnums,
        vertex_editing_finished_enum: EventEnums,
        cancelled_enum: EventEnums,  
        closedLoop: boolean = false) {

        this.vertex_editing_started_enum = vertex_editing_started_enum;
        this.vertex_editing_updated_enum = vertex_editing_updated_enum;
        this.vertex_editing_finished_enum = vertex_editing_finished_enum;
        this.cancelled_enum = cancelled_enum;

        this.closedLoop = closedLoop;
        this.editor = editor;
        this.commandStack = new CommandStack();
        this.mode = LineEditorMode.INACTIVE;

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

        eventBus.on(EventEnums.METRIC_CHANGED, () => {
            if (this.mode === LineEditorMode.EDIT_VERTEX_MODE) {
                this.drawPreview()
            }
            // TODO: figure out how to change text when in vertex placement mode
        })

    }


    public cancel() {
        this.cleanUp();
    }

    // Cleanup
    public cleanUp() {
        this.cleanUpVertexPlacementState()
        this.cleanUpVertexEditingState()
        this.commandStack.clear()

        
    }

    private cleanUpVertexPlacementState() {
        this.editor.remove(this.linePreview)
        this.editor.remove(this.angleText)
        this.editor.remove(this.distanceText)

        this.vertices = []

        while (this.commandStack.stack.length > 0) {
            this.commandStack.undo()
        }

        this.linePreview = undefined;
        this.angleText = undefined;
        this.distanceText = undefined;

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

    // // Change modes
    public beginEditing(vertices?: THREE.Vector3[]) {
        if (vertices === undefined || vertices.length === 0) { // Create new bed
            this.setVertexPlacementMode()
        } else { // Edit existing bed
            this.vertices = vertices;
            this.setVertexEditMode()
        }
    }

    private setVertexPlacementMode() {
        this.cleanUp()
        this.mode = LineEditorMode.PLACE_VERTEX_MODE;

        setCrossCursor()
        
    }

    public setVertexEditMode() {
        // Reset cursor
        setDefaultCursor()
        this.createVertexHandles();
        this.cleanUpVertexPlacementState()
        this.drawPreview();
        this.mode = LineEditorMode.EDIT_VERTEX_MODE;
        eventBus.emit(this.vertex_editing_started_enum) // TODO: change
    }

    private drawEdges() {
        /**
         * Draw line segments between vertex handles, with a transparent polygon + labels
         */

        // Redraw Line Segments
        for (const segment of this.lineSegments) {
            this.editor.remove(segment)
        }

        this.lineSegments = []

        let len = this.vertexHandles.length;
        let iter = this.closedLoop ? len : len - 1;
        for (let i = 0; i < iter; i++) {
            const p1 = this.vertexHandles[i % len].position
            const p2 = this.vertexHandles[(i + 1) % len].position
            const lineSegment = createLineSegment(p1, p2)
            const line = lineSegment.children[0]
            line.userData = {
                isLineSegment: true,
                p1: i % len,
                p2: (i + 1) % len
            }
            line.layers.set(LayerEnum.LineVertices)
            this.lineSegments.push(lineSegment)
        }

        for (const segment of this.lineSegments) {
            this.editor.add(segment)
        }

        // Redraw buttons
        const vertices = this.vertexHandles.map((item) => item.position.clone());
        const centroid = getCentroid(vertices);

        if (this.saveButton === undefined) {
            this.saveButton = createButton(centroid, "/icons/check-circle.svg", UI_GREEN_COLOR)
            this.saveButton.center.set(1.0, 0.5);
            this.saveButton.element.addEventListener('click', () => {
                eventBus.emit(this.vertex_editing_finished_enum)
            });
            this.editor.add(this.saveButton)
        } else {
            this.saveButton.position.set(...centroid);
        }

        if (this.cancelButton === undefined) {
            this.cancelButton = createButton(centroid, "/icons/cancel.svg", UI_GRAY_COLOR)
            this.cancelButton.center.set(0.0, 0.5);
            this.editor.add(this.cancelButton)

            this.cancelButton.element.addEventListener('click', () => {
                eventBus.emit(this.cancelled_enum)
            });
        } else {
            this.cancelButton.position.set(...centroid);
        }
    }


    // Drawing
    private drawPreview() {
        if (this.closedLoop) {
            // Redraw Polygon
            this.editor.remove(this.polygon)
            this.polygon = createPolygon(this.vertexHandles.map((item) => item.position));
            this.editor.add(this.polygon)
        } 
        this.drawEdges()
        

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
    private tryCloseLoop(point: THREE.Vector3): boolean {

        if (this.vertices.length > 0) {
            const startVertex = this.vertices[0];
            if (startVertex.distanceTo(point) < POLYGON_CLOSE_THRESH) {
                this.setVertexEditMode()
                return true;
            }
        }

        return false;
    }

    private handleMouseClickPlaceVerticesMode(object: THREE.Object3D, point: THREE.Vector3) {

        // If loop is closed, go to `VERTEX_EDIT_MODE`
        if (this.closedLoop) {
            if (this.tryCloseLoop(point)) {
                
                return
            }
        }

        this.vertices.push(point);

        if (this.closedLoop && this.vertices.length == 1) {
            const startPoint = createVertexHandle();
            startPoint.position.set(...point);
            this.commandStack.execute(new CreateObjectCommand(startPoint, this.editor))
        }

        if (this.vertices.length < 2) {
            return
        }

        // Create line segment
        const lineSegment = createLineSegment(point, this.vertices[this.vertices.length - 2].clone());
        this.commandStack.execute(new CreateObjectCommand(lineSegment, this.editor));
        // TODO: add a callback to this guy?

        // Remove previous labels
        this.editor.remove(this.angleText)
        this.editor.remove(this.distanceText)
        this.angleText = undefined;
        this.distanceText = undefined;

        
    }

    private handleMouseClickEditVerticesMode(object: THREE.Object3D, point: THREE.Vector3) {

        if (this.selectedHandle === undefined) {

            // Insert vertex
            if (object.userData.isLineSegment) {
                // TODO: make this undoable (would need to make a custom command that stores the old and new arrays of VertexHandle objects?)
                const vertex = createVertexHandle()
                this.editor.add(vertex)
                vertex.position.set(...point)
                this.vertexHandles.splice(object.userData.p1 + 1, 0, vertex)
                this.drawPreview()
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

    public handleMouseClick(intersections: THREE.Object3D[]) {

        let [object, point] = processIntersections(intersections)

        if (point === undefined) {
            return
        }

        point = snapper.snap(point)

        switch (this.mode) {
            case LineEditorMode.PLACE_VERTEX_MODE:
                this.handleMouseClickPlaceVerticesMode(object, point)
                break;
            default:
                this.handleMouseClickEditVerticesMode(object, point)
                break;
        }
    }

    private handleMouseMovePlaceVerticesMode(object: THREE.Object3D, point: THREE.Vector3) {

        this.lastPoint = point;

        if (this.vertices.length == 0) {
            this.editor.remove(this.linePreview)
            this.editor.remove(this.angleText)
            this.editor.remove(this.distanceText)
            this.linePreview = undefined;
            this.angleText = undefined;
            this.distanceText = undefined;
            return
        }

        // Draw line preview to show what new line segment would look like
        const lastPoint = this.vertices[this.vertices.length - 1]
        if (this.linePreview === undefined) {
            this.linePreview = createLinePreview(lastPoint, point)
            this.editor.add(this.linePreview)
        } else {
            this.linePreview.geometry.setPositions(destructureVector3Array([lastPoint, point]));
        }

        // Angle text
        const segment = point.clone().sub(lastPoint)
        let angle, textPos;
        if (this.vertices.length < 2) { // If only 2 points or less, calculate angle to north
            angle = rad2deg(segment.angleTo(northAngleToVec(this.editor.north)));
            textPos = lastPoint.clone().add(point.clone()).divideScalar(2);
        } else { // Otherwise calculate angle between last line segment
            const prevPrevPoint = this.vertices[this.vertices.length - 2];
            const previousSegment = lastPoint.clone().sub(prevPrevPoint);
            angle = rad2deg(segment.angleTo(previousSegment));
            textPos = lastPoint.clone().add(point.clone()).divideScalar(2);
        }


        if (this.angleText === undefined) {
            this.angleText = getCSS2DText(`${angle.toFixed(2)}°`, fontSizeString(FONT_SIZE))
            this.angleText.position.set(...textPos)
            this.editor.add(this.angleText)
        } else {
            this.angleText.element.textContent = `${angle.toFixed(2)}°`
            this.angleText.position.set(...textPos)
        }


        // Distance
        textPos = lastPoint.clone().add(point.clone()).divideScalar(2);
        if (this.distanceText === undefined) {
            this.distanceText = getCSS2DText(snapper.getText(lastPoint.distanceTo(point)), fontSizeString(-1 * FONT_SIZE))
            this.distanceText.position.set(...textPos)
            this.editor.add(this.distanceText)
        } else {
            this.distanceText.element.textContent = snapper.getText(lastPoint.distanceTo(point));
            this.distanceText.position.set(...textPos)
        }


    }

    private handleMouseMoveEditVerticesMode(object: THREE.Object3D, point: THREE.Vector3) {

        setDefaultCursor();

        if (point === undefined) {
            return
        }

        // This is here because the raycast intersects the vertex continuously, causing it to "climb"
        // TODO: figure out a way to do this without hardcoding the location to z=0
        point.y = 0.0

        if (this.selectedHandle === undefined) { // No vertex selected

            if (object === undefined) {
                return
            }

            if (object.userData.isLineSegment === true) { // mouse over line segment
                setCrossCursor()
            }
        } else { // vertex selected
            this.commandStack.execute(new SetPositionCommand(this.selectedHandle, this.selectedHandle.position, point))
            this.drawPreview()
        }
    }

    public handleMouseMove(intersections: THREE.Object3D[]) {

        let [object, point] = processIntersections(intersections);

        if (point === undefined) {
            return
        }

        point = snapper.snap(point)


        switch (this.mode) {
            case LineEditorMode.PLACE_VERTEX_MODE:
                this.handleMouseMovePlaceVerticesMode(object, point);
                break;
            case LineEditorMode.EDIT_VERTEX_MODE:
                // call this function for free highlighting
                this.editor.handleMouseMoveObjectMode(intersections);
                this.handleMouseMoveEditVerticesMode(object, point);
                eventBus.emit(this.vertex_editing_updated_enum); // TODO: change this
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
            case 'Enter':
                if (!this.closedLoop && this.mode === LineEditorMode.PLACE_VERTEX_MODE) {
                    this.setVertexEditMode();
                }
            case 'Escape':
                // Deselect vertex handle
                this.editor.selector.deselect();
                this.selectedHandle = undefined;
                break;

            case 'Delete':
                switch (this.mode) {
                    case LineEditorMode.EDIT_VERTEX_MODE:
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

        this.drawPreview()
        

    }

    public undo() {
        this.commandStack.undo();
        switch (this.mode) {
            case LineEditorMode.PLACE_VERTEX_MODE:
                this.vertices.pop();
                break;
            case LineEditorMode.EDIT_VERTEX_MODE:
                this.drawPreview();
                break;
            default:
                break;
        }
        this.handleMouseMove(this.editor, [{object: undefined, point: this.lastPoint}]);
        
    }

    public getPolygonArea(): number {
        switch (this.mode) {
            case LineEditorMode.INACTIVE:
                return NaN;
            case LineEditorMode.EDIT_VERTEX_MODE:
                return polygonArea(this.vertexHandles.map((item) => item.position.clone()));
            default:
                return polygonArea(this.vertices);

        }
    }

}

export { LineEditor, LineEditorMode };