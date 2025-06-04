import { Editor } from "./Editor";
import { Vector3 } from "three";
import { Line } from "three";
import { LayerEnums } from "./Constants";
import { eventBus } from "./EventBus";
import { Object3D } from "three";
import { MeshPhongMaterial } from "three";
import { BoxGeometry } from "three";
import { Mesh } from "three";
import { CreateObjectCommand } from "./commands/CreateObjectCommand";
import { destructureVector3Array, getCentroid, getTextGeometry } from "./Utils";
import * as THREE from "three"
import { Vector2 } from "three";
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { CommandStack } from "./CommandStack";
import { handleMouseMoveObjectMode } from "./EventHandlers";

enum BedEditorMode {
    NONE = "NONE",
    PLACE_VERTICES = "PLACE_VERTICES",
    EDIT_VERTICES = "EDIT_VERTICES",
    CONFIGURE_MESH = "CONFIGURE_MESH"
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
    selectedHandle?: Object3D;

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
        this.selectedHandle = undefined;
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

    // TODO: rename this method it is confusin
    public createNewBed() {
        this.cleanUpVertexPlacementState()
        this.mode = BedEditorMode.PLACE_VERTICES;

        // TODO: move cursor changes out to function
        document.getElementsByTagName("body")[0].style.cursor = "url('/cross_black.cur'), auto";
    }

    private createMesh() {
        // TODO: clean this up and make it dynamic

        const height = 1;

        // get the centroid of the points
        const centroid = getCentroid(this.vertices);

        this.vertices.push(this.vertices[0]);
        const points = this.vertices.map(p => {
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

        this.editor.setObjectMode()

        // Reset cursor
        document.getElementsByTagName("body")[0].style.cursor = "auto";
        this.cleanUpVertexPlacementState()
    }

    private closeLoop() {
        // Reset cursor
        document.getElementsByTagName("body")[0].style.cursor = "auto";
        this.createVertexHandles();
        this.cleanUpVertexPlacementState()
        this.drawVertexEdges();
        this.mode = BedEditorMode.EDIT_VERTICES;
    }

    private drawVertexEdges() {

        for (const segment of this.lineSegments) {
            this.editor.remove(segment)
        }

        this.lineSegments = []

        // TODO: close the loop
        const len = this.vertexHandles.length;
        for (let i = 0; i < len; i++) {
            const p1 = this.vertexHandles[i % len].position
            const p2 = this.vertexHandles[(i + 1) % len].position
            const lineSegment = this.createLineSegment(p1, p2)
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
    }

    private tryCloseLoop(point: Vector3) : boolean {

        for (const vertex of this.vertices) {
            if (vertex.distanceTo(point) < CLOSE_THRESH) {
                this.closeLoop()
                return true;
            }
        }
        return false
    }

    private createVertexHandles() {

        for (const point of this.vertices) {
            const vertex = new Mesh(
                new BoxGeometry(0.1, 0.1, 0.1), 
                new MeshPhongMaterial({color: 0xDDDDDD}))
            vertex.layers.set(LayerEnums.BedVertices);
            vertex.userData = {selectable: true}

            this.editor.add(vertex);
            vertex.position.set(...point)
            this.vertexHandles.push(vertex)
        }

    }

    private createLineSegment(point: Vector3, lastPoint: Vector3) : Object3D{

        // Get Distance Text
        const distance = lastPoint.distanceTo(point);
        const lineLabel = getTextGeometry(`${distance.toFixed(2)}m`)
        let textPos = lastPoint.clone().add(point.clone()).divideScalar(2);
        textPos.z = 0.3;
        lineLabel.position.set(...textPos)

        // Get line segment
        const geometry = new LineGeometry();
        geometry.setPositions( destructureVector3Array([point, lastPoint]) );
        const material = new LineMaterial({ color: 0x00ff00, linewidth: 5 });
        const line = new Line2(geometry, material);

        const group = new THREE.Group();
        group.add( line );
        group.add( lineLabel );

        return group;

    }

    private handleMouseClickPlaceVerticesMode(point: Vector3) {
        if (this.tryCloseLoop(point)) {
            eventBus.emit('requestRender')
            return
        }

        this.vertices.push(point);

        if (this.vertices.length < 2){
            return
        }

        const lineSegment = this.createLineSegment(point, this.vertices[this.vertices.length - 2].clone());

        const command = new CreateObjectCommand(lineSegment, this.editor);
        this.commandStack.execute(command);

        eventBus.emit('requestRender')
    }

    private handleMouseClickEditVerticesMode(editor: Editor, object: Object3D, point: Vector3) {

        if (this.selectedHandle === undefined) {
            for (const handle of this.vertexHandles) {
                if (object === handle) {
                    this.selectedHandle = object;
                }
            }
        } else {
            this.selectedHandle = undefined;
        }


    }

    public handleMouseClick(editor: Editor, object: Object3D, point: Vector3) {

        switch (this.mode) {
            case BedEditorMode.PLACE_VERTICES:
                this.handleMouseClickPlaceVerticesMode(point)
                break;
            default:
                this.handleMouseClickEditVerticesMode(editor, object, point)
                break;
        }
    }

    public undo() {
        switch (this.mode) {
            case BedEditorMode.PLACE_VERTICES:
                this.vertices.pop();
                break;
            default:
                break;
        }
        this.commandStack.undo();
        this.handleMouseMove(this.editor, undefined, this.lastPoint);
        eventBus.emit('requestRender')
    }

    private handleMouseMovePlaceVerticesMode(point: Vector3) {

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
        const material = new LineMaterial({ color: 0xffff00, linewidth: 5});
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
            if (object.userData.isLineSegment === true) { // mouse over line segment
                document.getElementsByTagName("body")[0].style.cursor = "url('/cross_black.cur'), auto";
            }
        } else { // vertex selected
            this.selectedHandle.position.set(...point)
            this.drawVertexEdges()
        }
    }

    public handleMouseMove(editor: Editor, object: Object3D, point: Vector3) {

        if (point === undefined) {
            return
        }

        switch (this.mode) {
            case BedEditorMode.PLACE_VERTICES:
                this.handleMouseMovePlaceVerticesMode(point)
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
}

export { BedEditor, BedEditorMode };