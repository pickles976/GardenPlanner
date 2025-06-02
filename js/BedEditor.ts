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

    public createBedVertex(point: Vector3) {
        const boxMat = new MeshPhongMaterial({
            color: 0xDDDDDD,
        })
        const boxGeo = new BoxGeometry(0.5, 0.5, 0.5);
        const vertex = new Mesh(boxGeo, boxMat)
        vertex.layers.set(LayerEnums.BedVertices);
        vertex.userData = {selectable: true}

        //
        vertex.position.set(...point)
        this.editor.add(vertex);

        this.bedVertices.push(vertex);


        this.bedPoints.push(point)

        this.editor.remove(this.polyline)
        this.polyline = undefined;

        const geometry = new BufferGeometry().setFromPoints(this.bedPoints);
        const material = new LineBasicMaterial({ color: 0x00ff00 });
        this.polyline = new Line(geometry, material);

        this.editor.add(this.polyline)

        eventBus.emit('requestRender')
    }
}

export { BedEditor };