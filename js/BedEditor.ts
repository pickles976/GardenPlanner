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

    vertices: Vector3[];

    // bedPoints: Vector3[];
    // bedVertices: Object3D[];
    // lineLabels: Object3D[];

    // polyline?: Line;
    linePreview?: Line;
    angleText?: TextGeometry;
    distanceText?: TextGeometry;

    mode: BedEditorMode;

    constructor(editor: Editor) {

        this.editor = editor;
        this.commandStack = new CommandStack();

        this.mode = BedEditorMode.NONE;

        this.vertices = []

        this.linePreview = undefined;
        this.angleText = undefined;
        this.distanceText = undefined;
    }

    private cleanUp() {
        this.editor.remove(this.linePreview)
        this.editor.remove(this.angleText)
        this.editor.remove(this.distanceText)

        this.vertices = []

        while (this.commandStack.stack.length > 0) {
            this.commandStack.undo()
        }

        this.mode = BedEditorMode.NONE;

    }

    public createNewBed() {
        this.cleanUp()
        this.mode = BedEditorMode.PLACE_VERTICES;

        // TODO: move cursor changes out to function
        document.getElementsByTagName("body")[0].style.cursor = "url('/cross_black.cur'), auto";
    }

    private closeLoop() {
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
        this.cleanUp()
        this.mode = BedEditorMode.EDIT_VERTICES;
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

    // private drawVertices(points: Vector3[]) {
    //     // TODO: why this no work?

    //     const boxMat = new MeshPhongMaterial({
    //         color: 0xDDDDDD,
    //     })
    //     const boxGeo = new BoxGeometry(0.5, 0.5, 0.5);

    //     for (const point in points) {
    //         const vertex = new Mesh(boxGeo, boxMat)
    //         vertex.layers.set(LayerEnums.BedVertices);
    //         vertex.userData = {selectable: true}

    //         vertex.position.set(...point)
    //         this.editor.add(vertex);

    //         this.bedVertices.push(vertex);
    //     }

    // }

    private createLineSegment(points: Vector3) : Object3D{
        if (points.length < 2) {
            return
        }

        const index = points.length - 1;
        const point = points[index].clone();
        const lastPoint = points[index - 1].clone();

        // Get Distance Text
        const distance = lastPoint.distanceTo(point);
        const lineLabel = getTextGeometry(`${distance.toFixed(2)}m`)
        let textPos = lastPoint.clone().add(point.clone()).divideScalar(2);
        textPos.z = 0.3;
        lineLabel.position.set(...textPos)

        // Get line segment
        const geometry = new LineGeometry();
        geometry.setPositions( destructureVector3Array(points) );
        const material = new LineMaterial({ color: 0x00ff00, linewidth: 5 });
        const line = new Line2(geometry, material);

        const group = new THREE.Group();
        group.add( lineLabel );
        group.add( line );

        return group;

    }

    public handleMouseClick(point: Vector3) {

        // TODO: change functionality based on mode

        if (this.tryCloseLoop(point)) {
            eventBus.emit('requestRender')
            return
        }

        this.vertices.push(point);

        const lineSegment = this.createLineSegment(this.vertices);

        if (lineSegment === undefined) {
            return
        }

        const command = new CreateObjectCommand(lineSegment, this.editor);
        this.commandStack.execute(command);

        eventBus.emit('requestRender')
    }

    public undo() {
        switch (this.mode) {
            case BedEditorMode.PLACE_VERTICES:
                this.vertices.pop();
                this.commandStack.undo();
                break;
            default:
                break;
        }
    }

    private handleMouseMovePlaceVerticesMode(point: Vector3) {
                // TODO: draw line
        if (this.vertices.length == 0) {
            return
        }

        this.editor.remove(this.linePreview)

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

        this.editor.remove(this.angleText)
        this.angleText = getTextGeometry(`${angle.toFixed(2)}°`)

        let textPos = lastPoint.clone().add(point.clone()).divideScalar(2);
        textPos.z = 0.03;
        textPos.y -= 0.3;

        this.angleText.position.set(...textPos)
        this.editor.add(this.angleText)

        // Distance Label
        const distance = lastPoint.distanceTo(point);

        this.editor.remove(this.distanceText)

        this.distanceText = getTextGeometry(`${distance.toFixed(2)}m`)

        textPos = lastPoint.clone().add(point.clone()).divideScalar(2);
        textPos.z = 0.03;

        this.distanceText.position.set(...textPos)
        this.editor.add(this.distanceText)
    }

    public handleMouseMove(point: Vector3) {

        if (point === undefined) {
            return
        }

        console.log(this.mode)

        switch (this.mode) {
            case BedEditorMode.PLACE_VERTICES:
                this.handleMouseMovePlaceVerticesMode(point)
                break;
            case BedEditorMode.EDIT_VERTICES:
                break;
            default:
                break;
        }


    }
}

export { BedEditor };