import { Object3D, Vector3, Group } from "three";

import "external-svg-loader";

import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';

import { destructureVector3Array, getCSS2DText, fontSizeString } from "../Utils";
import { CreateObjectCommand } from "../commands/CreateObjectCommand";
import { FONT_SIZE, LayerEnum } from "../Constants";
import { Editor } from "../Editor";

import { WHITE } from "../Colors";
import { snapper } from "../Snapping";
import { performRaycast, processIntersections } from "../EventHandlers";



const LINE_WIDTH = 5;

function createLinePreview(startPoint: Vector3, endPoint: Vector3) : Line2 {

    // Get Distance Text
    let textPos = startPoint.clone().add(endPoint.clone()).divideScalar(2);
    const lineLabel = getCSS2DText(snapper.getText(startPoint.distanceTo(endPoint)), fontSizeString(FONT_SIZE));
    lineLabel.position.set(...textPos)

    const geometry = new LineGeometry();
    geometry.setPositions(destructureVector3Array([startPoint, endPoint]))
    const material = new LineMaterial({ color: WHITE, linewidth: LINE_WIDTH, depthWrite: false, depthTest: false });
    const linePreview = new Line2(geometry, material);
    linePreview.renderOrder = 100000; // Always draw on top

    const group = new Group();
    group.add(linePreview);
    group.add(lineLabel);

    return group;
}


class RulerEditor {

    editor: Editor;
    
    rulerStart?: Vector3;
    linePreview?: Line2;

    constructor(editor: Editor) {
        this.editor = editor;
        this.rulerStart = undefined;
        this.linePreview = undefined;
    }

    public cleanup() {
        this.editor.remove(this.linePreview);
        this.rulerStart = undefined;
        this.linePreview = undefined;
    }

    public handleMouseMove(intersections: Object3D[]) {

        if (this.rulerStart === undefined) return;

        // draw ruler
        let [object, point] = processIntersections(intersections)
        point = snapper.snap(point)

        this.editor.remove(this.linePreview)
        this.linePreview = createLinePreview(this.rulerStart, point);
        this.editor.add(this.linePreview)
    }

    public handleMouseClick(intersections: Object3D[]) {
        let [object, point] = processIntersections(intersections)
        point = snapper.snap(point)

        if (this.rulerStart === undefined) {
            this.rulerStart = point;
        } else {
            const ruler = createLinePreview(this.rulerStart, point);
            ruler.layers.set(LayerEnum.Objects)
            ruler.userData = {
                selectable: true
            }
            ruler.name = "Ruler"
            this.editor.execute(new CreateObjectCommand(ruler, this.editor))
            this.cleanup()
        }

    }   

}

export { RulerEditor };