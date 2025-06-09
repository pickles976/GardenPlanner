/**
 * 1. Place Vertices
 *  a. insert and undo
 *  b. close loop by clicking on start vertex
 * 2. Edit Vertices
 * 3. Configure Bed
 * 
 * TODO: make this all command-based at some point
 */


import { Vector2, Object3D, MeshPhongMaterial, BoxGeometry, Line, Vector3, Mesh } from "three";
import * as THREE from "three"
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';


import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { handleMouseMoveObjectMode } from "./EventHandlers";
import { Line2 } from 'three/addons/lines/Line2.js';

import { destructureVector3Array, getCentroid, getTextGeometry } from "./Utils";
import { CreateObjectCommand } from "./commands/CreateObjectCommand";
import { SetPositionCommand } from "./commands/SetPositionCommand";
import { CommandStack } from "./CommandStack";
import { LayerEnums } from "./Constants";
import { eventBus, EventEnums } from "./EventBus";
import { Editor } from "./Editor";


import "external-svg-loader";
import { GREEN, UI_GRAY_COLOR, UI_GREEN_COLOR, VERTEX_COLOR, YELLOW } from "./Colors";


function createVertexHandle() : Mesh {
    const vertex = new Mesh(
                new BoxGeometry(0.1, 0.1, 0.1), 
                new MeshPhongMaterial({color: VERTEX_COLOR}))
    vertex.layers.set(LayerEnums.BedVertices);
    vertex.userData = {selectable: true, isVertexHandle: true}
    return vertex
}


function createLineSegment(point: Vector3, lastPoint: Vector3) : Object3D{

    // Get Distance Text
    const distance = lastPoint.distanceTo(point);
    const lineLabel = getTextGeometry(`${distance.toFixed(2)}m`)
    let textPos = lastPoint.clone().add(point.clone()).divideScalar(2);
    textPos.z = 0.3;
    lineLabel.position.set(...textPos)

    // Get line segment
    const geometry = new LineGeometry();
    geometry.setPositions( destructureVector3Array([point, lastPoint]) );
    const material = new LineMaterial({ color: GREEN, linewidth: 5 });
    const line = new Line2(geometry, material);

    const group = new THREE.Group();
    group.add( line );
    group.add( lineLabel );

    return group;

}

function createButton(position: Vector3, icon: string, color: string) : CSS2DObject {

    // TODO: cleanup button between frames
    // TODO: mouse over callback
    // TODO: mouse click callback
    // button.className = 'button';
    // button.textContent = '7.342e22 kg';
    const button = document.createElement( 'button' );
    button.style.backgroundColor = 'transparent';
    button.style.pointerEvents = "all"

    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    svgEl.setAttribute('data-src', icon);
    svgEl.setAttribute('fill', 'currentColor');
    svgEl.setAttribute('width', '50px');
    svgEl.setAttribute('height', '50px');
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

    const label = new CSS2DObject( button );
    label.position.set(...position);
    return label;
}

function createPolygon(points: Vector3[]) : Mesh {
    let polyShape = new THREE.Shape(points.map((coord) => new THREE.Vector2(coord.x, coord.y)))
    const polyGeometry = new THREE.ShapeGeometry(polyShape);
    polyGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points.map(coord => [coord.x, coord.y, coord.z]).flat(), 3))
    return new THREE.Mesh(polyGeometry, new THREE.MeshBasicMaterial({ color: GREEN, side: THREE.DoubleSide, transparent: true, opacity: 0.2}))
}

enum BedEditorMode {
    NONE = "NONE",
    PLACE_VERTICES = "PLACE_VERTICES",
    EDIT_VERTICES = "EDIT_VERTICES",
    BED_CONFIG = "BED_CONFIG"
}

const CLOSE_THRESH = 0.5;

class BedEditor {

    editor: Editor;
    commandStack: CommandStack;
    mode: BedEditorMode;

    vertices: Vector3[];

    // Placement mode
    lastPoint?: Vector3;
    linePreview?: Line;
    angleText?: TextGeometry;
    distanceText?: TextGeometry;

    // Edit mode
    vertexHandles: Object3D[];
    lineSegments: Object3D[];
    polygon?: Object3D;
    selectedHandle?: Object3D;
    saveButton?: CSS2DObject;
    cancelButton?: CSS2DObject;

    constructor(editor: Editor) {

        this.editor = editor;
        this.commandStack = new CommandStack();
        this.mode = BedEditorMode.NONE;

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

    }

    public cleanUp() {
        this.cleanUpVertexPlacementState()
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

        document.getElementsByTagName("body")[0].style.cursor = "auto";
        
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

    // TODO: rename this method it is confusing
    public createNewBed() {
        this.cleanUpVertexPlacementState()
        this.mode = BedEditorMode.PLACE_VERTICES;

        // TODO: move cursor changes out to function
        document.getElementsByTagName("body")[0].style.cursor = "url('/cross_black.cur'), auto";
        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    public setBedConfigMode() {
        this.mode = BedEditorMode.BED_CONFIG;

        const height = 1;

        // get the centroid of the points
        const vertices = this.vertexHandles.map((item) => item.position.clone());
        const centroid = getCentroid(vertices);

        vertices.push(vertices[0]);
        const points = vertices.map((p) => {
            const temp = p.clone().sub(centroid);
            return new Vector2(temp.x, temp.y);
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

        const geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );

        const mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial({ color: 0xDDDDDD, side: THREE.DoubleSide, transparent: true, opacity: 0.4}) );

        mesh.userData = {"selectable": true}
        mesh.layers.set(LayerEnums.Objects)
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = "New Bed"

        // Move the mesh to the centroid so that it doesn't spawn at the origin
        mesh.position.set(...centroid);

        this.editor.execute(new CreateObjectCommand(mesh, this.editor));

        // Reset cursor
        document.getElementsByTagName("body")[0].style.cursor = "auto";
        this.cleanUp()

        // this.editor.setObjectMode()
        this.editor.setPerspectiveCamera()

        // Make the camera look at the newly-created bed
        // TODO: make the camera south of the newly-created bed
        this.editor.currentCameraControls.target.copy(centroid)

        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    public createMesh() {

        const height = 1;

        // get the centroid of the points
        const vertices = this.vertexHandles.map((item) => item.position.clone());
        const centroid = getCentroid(vertices);

        vertices.push(vertices[0]);
        const points = vertices.map((p) => {
            const temp = p.clone().sub(centroid);
            return new Vector2(temp.x, temp.y);
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

        const geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );

        const mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial() );

        mesh.userData = {"selectable": true}
        mesh.layers.set(LayerEnums.Objects)
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = "New Bed"

        // Move the mesh to the centroid so that it doesn't spawn at the origin
        mesh.position.set(...centroid);

        this.editor.execute(new CreateObjectCommand(mesh, this.editor));

        // Reset cursor
        document.getElementsByTagName("body")[0].style.cursor = "auto";
        this.cleanUp()

        this.editor.setObjectMode()

        // Make the camera look at the newly-created bed
        // TODO: make the camera south of the newly-created bed
        this.editor.currentCameraControls.target.copy(centroid)

        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    private closeLoop() {
        // Reset cursor
        document.getElementsByTagName("body")[0].style.cursor = "auto";
        this.createVertexHandles();
        this.cleanUpVertexPlacementState()
        this.drawVertexEdges();
        this.mode = BedEditorMode.EDIT_VERTICES;
        eventBus.emit(EventEnums.VERTEX_EDITING_STARTED)
    }

    private drawVertexEdges() {
        // TODO: rename to draw the other stuff

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
            line.layers.set(LayerEnums.BedVertices)
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
        this.saveButton.center.set( 1.0, 0.5 );
        this.editor.add(this.saveButton)

        this.saveButton.element.addEventListener('click', () => {
            eventBus.emit(EventEnums.VERTEX_EDITING_FINISHED)
        });

        this.editor.remove(this.cancelButton)
        this.cancelButton = createButton(centroid, "/icons/cancel.svg", UI_GRAY_COLOR)
        this.cancelButton.center.set( 0.0, 0.5 );
        this.editor.add(this.cancelButton)

        this.cancelButton.element.addEventListener('click', () => {
            eventBus.emit(EventEnums.BED_EDITING_CANCELLED)
        });

    }

    private tryCloseLoop(point: Vector3) : boolean {

        if (this.vertices.length > 0) {
            const startVertex = this.vertices[0];
            if (startVertex.distanceTo(point) < CLOSE_THRESH) {
                    this.closeLoop()
                    return true;
            }
        }

        return false;
    }

    private createVertexHandles() {

        for (const point of this.vertices) {
            const vertex = createVertexHandle();
            this.editor.add(vertex);
            vertex.position.set(...point)
            this.vertexHandles.push(vertex)
        }

    }

    private handleMouseClickPlaceVerticesMode(editor: Editor, object: Object3D, point: Vector3) {
        if (this.tryCloseLoop(point)) {
            eventBus.emit(EventEnums.REQUEST_RENDER)
            return
        }

        this.vertices.push(point);

        if (this.vertices.length < 2){
            return
        }

        const lineSegment = createLineSegment(point, this.vertices[this.vertices.length - 2].clone());

        this.commandStack.execute(new CreateObjectCommand(lineSegment, this.editor));

        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    private handleMouseClickEditVerticesMode(editor: Editor, object: Object3D, point: Vector3) {

        if (this.selectedHandle === undefined) {

            // Insert vertex
            if (object.userData.isLineSegment) {
                // TODO: make this undoable (use a command)
                console.log("Line segment clicked")
                const vertex = createVertexHandle()
                this.editor.add(vertex)
                vertex.position.set(...point)
                this.vertexHandles.splice(object.userData.p1 + 1, 0, vertex)
                this.drawVertexEdges()
                return
            }

            if (object.userData.isVertexHandle) {
                this.selectedHandle = object;
                return
            }

        } else {
            this.selectedHandle = undefined;
        }


    }

    public handleMouseClick(editor: Editor, object: Object3D, point: Vector3) {

        switch (this.mode) {
            case BedEditorMode.PLACE_VERTICES:
                this.handleMouseClickPlaceVerticesMode(editor, object, point)
                break;
            default:
                this.handleMouseClickEditVerticesMode(editor, object, point)
                break;
        }
    }

    public undo() {
        this.commandStack.undo();
        switch (this.mode) {
            case BedEditorMode.PLACE_VERTICES:
                this.vertices.pop();
                break;
            case BedEditorMode.EDIT_VERTICES:
                this.drawVertexEdges();
                break;
            default:
                break;
        }
        this.handleMouseMove(this.editor, undefined, this.lastPoint);
        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    private handleMouseMovePlaceVerticesMode(editor: Editor, object: Object3D, point: Vector3) {

        this.lastPoint = point;

        this.editor.remove(this.linePreview)
        this.editor.remove(this.angleText)
        this.editor.remove(this.distanceText)

        if (this.vertices.length == 0) {
            return
        }

        const lastPoint = this.vertices[this.vertices.length - 1]
        const geometry = new LineGeometry();
        geometry.setPositions(destructureVector3Array([lastPoint, point]))
        const material = new LineMaterial({ color: YELLOW, linewidth: 5});
        this.linePreview = new Line2(geometry, material);
        this.editor.add(this.linePreview)

        // TODO: fix the 

        // Angle between north
        const segment = lastPoint.clone().sub(point)
        let angle = segment.angleTo(new Vector3(0,-1,0)) * 180 / Math.PI;

        this.angleText = getTextGeometry(`${angle.toFixed(2)}°`)

        let textPos = lastPoint.clone().add(point.clone()).divideScalar(2);
        textPos.z = 0.03;
        textPos.y -= 0.3;

        this.angleText.position.set(...textPos)
        this.editor.add(this.angleText)

        // Distance Label
        const distance = lastPoint.distanceTo(point);


        this.distanceText = getTextGeometry(`${distance.toFixed(2)}m`)

        textPos = lastPoint.clone().add(point.clone()).divideScalar(2);
        textPos.z = 0.03;

        this.distanceText.position.set(...textPos)
        this.editor.add(this.distanceText)
    }

    private handleMouseMoveEditVerticesMode(editor, object, point) {

        document.getElementsByTagName("body")[0].style.cursor = "auto";

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
                document.getElementsByTagName("body")[0].style.cursor = "url('/cross_black.cur'), auto";
            }
        } else { // vertex selected
            this.commandStack.execute(new SetPositionCommand(this.selectedHandle, this.selectedHandle.position, point))
            this.drawVertexEdges()
        }
    }

    private delete() {

        if (this.selectedHandle === undefined) {
            return
        }

        // don't allow user to delete the loop
        if (this.vertexHandles.length === 3) {
            return
        }

        this.editor.remove(this.selectedHandle)
        
        for (let i = 0; i < this.vertexHandles.length; i++) {
            if (this.vertexHandles[i] === this.selectedHandle) {
                this.vertexHandles.splice(i, 1)
            }
        }

        this.drawVertexEdges()
        eventBus.emit(EventEnums.REQUEST_RENDER)

    }

    public handleMouseMove(editor: Editor, object: Object3D, point: Vector3) {

        if (point === undefined) {
            return
        }

        switch (this.mode) {
            case BedEditorMode.PLACE_VERTICES:
                this.handleMouseMovePlaceVerticesMode(editor, object, point)
                break;
            case BedEditorMode.EDIT_VERTICES:
                // call this function for free highlighting
                handleMouseMoveObjectMode(editor, object, point)
                this.handleMouseMoveEditVerticesMode(editor, object, point)
                break;
            default:
                break;
        }


    }

    
    public handleKeyDown(event) {
        switch ( event.key ) {

            case 'z':
                if (event.ctrlKey) {
                    this.undo();
                }
                break;

            case 'Escape':
                this.editor.selector.deselect();
                // TODO: deselect vertices
                break;

            case 'Delete':
                switch (this.mode) {
                    case BedEditorMode.EDIT_VERTICES:
                        this.delete();
                        break;
                    default:
                        break;
                }
                break;

        }
    }
}

export { BedEditor, BedEditorMode };