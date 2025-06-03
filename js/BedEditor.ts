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
import { destructureVector3Array, getCentroid, getTextGeometry } from "./Utils";
import * as THREE from "three"
import { Vector2 } from "three";
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { vertex } from "three/src/renderers/shaders/ShaderLib/background.glsl.js";

const CLOSE_THRESH = 0.5;

class BedEditor {

    editor: Editor;
    bedPoints: Vector3[];
    bedVertices: Object3D[];
    lineLabels: Object3D[];

    polyline?: Line;
    drawline?: Line;
    angleText?: TextGeometry;
    distanceText?: TextGeometry;


    constructor(editor: Editor) {
        this.editor = editor;
        this.bedPoints = [];
        this.bedVertices = [];
        this.lineLabels = [];

        this.polyline = undefined;
        this.drawline = undefined;
        this.angleText = undefined;
        this.distanceText = undefined;
    }

    private cleanUp() {
        this.editor.remove(this.polyline)
        this.editor.remove(this.drawline)
        this.editor.remove(this.angleText)
        this.editor.remove(this.distanceText)


        for (const vertex of this.bedVertices) {
            this.editor.remove(vertex)
        }

        for (const label of this.lineLabels) {
            this.editor.remove(label)
        }

        this.bedPoints = []
        this.bedVertices = []
        this.lineLabels = []

    }

    public createNewBed() {
        this.cleanUp()

        // TODO: move cursor changes out to function
        document.getElementsByTagName("body")[0].style.cursor = "url('/cross_black.cur'), auto";
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

        // Reset cursor
        document.getElementsByTagName("body")[0].style.cursor = "auto";
        this.cleanUp()
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

    private clearLineLabels() {
        for (const label of this.lineLabels) {
            this.editor.remove(label)
        }
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
        // const geometry = new BufferGeometry().setFromPoints(points);
        const geometry = new LineGeometry();
        geometry.setPositions( destructureVector3Array(points) );
        const material = new LineMaterial({ color: 0x00ff00, linewidth: 5 });
        this.polyline = new Line2(geometry, material);
        this.editor.add(this.polyline)
    }

    private drawLineLabels(points: Vector3[]) {

        if (points.length === 0) {
            return
        }

        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            const lastPoint = this.bedPoints[i - 1]
            const distance = lastPoint.distanceTo(point);
            const lineLabel = getTextGeometry(`${distance.toFixed(2)}m`)

            let textPos = lastPoint.clone().add(point.clone()).divideScalar(2);
            textPos.z = 0.3;
            lineLabel.position.set(...textPos)

            this.lineLabels.push(lineLabel)
            this.editor.add(lineLabel)
        }
    }

    public createBedVertex(point: Vector3) {

        // TODO: draw the entire thing just from points
        this.clearVertices();
        this.clearPolyline();
        this.clearLineLabels();

        if (this.tryCloseLoop(point)) {
            eventBus.emit('requestRender')
            return
        }

        this.bedPoints.push(point)
        this.drawVertices(this.bedPoints)
        this.drawPolyline(this.bedPoints)
        this.drawLineLabels(this.bedPoints)

        this.editor.remove(this.angleText)
        this.editor.remove(this.distanceText)

        eventBus.emit('requestRender')
    }

    public updateMousePosition(point: Vector3) {

        // TODO: draw line
        if (this.bedPoints.length == 0) {
            return
        }

        this.editor.remove(this.drawline)

        const lastPoint = this.bedPoints[this.bedPoints.length - 1]
        const geometry = new LineGeometry();
        geometry.setPositions(destructureVector3Array([lastPoint, point]))
        const material = new LineMaterial({ color: 0xffff00, linewidth: 5});
        this.drawline = new Line2(geometry, material);
        this.editor.add(this.drawline)

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
}

export { BedEditor };