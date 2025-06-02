import { Editor } from "./Editor";
import { Vector3 } from "three";
import { Line } from "three";
import { EditorMode, LayerEnums } from "./Constants";
import { BufferGeometry } from "three";
import { LineBasicMaterial } from "three";
import { eventBus } from "./EventBus";
import { Object3D } from "three";
import { MeshPhongMaterial } from "three";
import { BoxGeometry } from "three";
import { Mesh } from "three";
import { Float32BufferAttribute } from "three";
import { DoubleSide } from "three";
import { CreateObjectCommand } from "./commands/CreateObjectCommand";
import { getCentroid } from "./Utils";
import * as THREE from "three"
import { Vector2 } from "three";

const CLOSE_THRESH = 0.5;

class BedEditor {

    editor: Editor;
    bedPoints: Vector3[];
    bedVertices: Object3D[];
    polyline?: Line;


    constructor(editor: Editor) {
        this.editor = editor;
        this.bedPoints = [];
        this.bedVertices = [];
        this.polyline = undefined;
    }

    public createNewBed() {
        this.bedPoints = [];
        this.bedVertices = [];
        document.getElementsByTagName("body")[0].style.cursor = "url('/cross_cursor.cur'), auto";
    }

    private closeLoop() {
        // TODO: clean this up and make it dynamic

        const height = 1;

        // get the centroid of the points
        const centroid = getCentroid(this.bedPoints);

        this.bedPoints.push(this.bedPoints[0]);
        const points = this.bedPoints.map(p => {
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
    }

    private tryCloseLoop(point: Vector3) : boolean {

        for (const vertex of this.bedPoints) {
            if (vertex.distanceTo(point) < CLOSE_THRESH) {
                this.closeLoop()
                return true;
            }
        }
        return false
    }

    private clearVertices() {
        for (const vertex of this.bedVertices) {
            this.editor.remove(vertex)
        }
        this.bedVertices = [];
    }

    private clearPolyline() {
        if (this.polyline !== undefined) {
            this.editor.remove(this.polyline)
        }
        this.polyline = undefined;

    }

    private drawVertices(points: Vector3[]) {
        // TODO: why this no work?

        const boxMat = new MeshPhongMaterial({
            color: 0xDDDDDD,
        })
        const boxGeo = new BoxGeometry(0.5, 0.5, 0.5);

        for (const point in points) {
            const vertex = new Mesh(boxGeo, boxMat)
            vertex.layers.set(LayerEnums.BedVertices);
            vertex.userData = {selectable: true}

            vertex.position.set(...point)
            this.editor.add(vertex);

            this.bedVertices.push(vertex);
        }

    }

    private drawPolyline(points: Vector3[]) {
        const geometry = new BufferGeometry().setFromPoints(points);
        const material = new LineBasicMaterial({ color: 0x00ff00 });
        this.polyline = new Line(geometry, material);
        this.editor.add(this.polyline)
    }

    public createBedVertex(point: Vector3) {

        this.clearVertices();
        this.clearPolyline();

        if (this.tryCloseLoop(point)) {
            eventBus.emit('requestRender')
            return
        }

        this.bedPoints.push(point)
        this.drawVertices(this.bedPoints)
        this.drawPolyline(this.bedPoints)

        eventBus.emit('requestRender')
    }
}

export { BedEditor };