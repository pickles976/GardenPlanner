import * as THREE from "three";

import "external-svg-loader";

import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';

import { destructureVector3Array, getCSS2DText, fontSizeString, rad2deg } from "../Utils";
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { CreateObjectCommand } from "../commands/CreateObjectCommand";
import { FONT_SIZE, LayerEnum } from "../Constants";
import { Editor } from "../Editor";

import { WHITE } from "../Colors";
import { snapper } from "../Snapping";
import { processIntersections } from "../EventHandlers";



const LINE_WIDTH = 5;

function createAngleText(startPoint: THREE.Vector3, endPoint: THREE.Vector3) : CSS2DObject {

    const segment = startPoint.clone().sub(endPoint)
    let angle = rad2deg(segment.angleTo(new THREE.Vector3(0, -1, 0)));
    let textPos = startPoint.clone().add(endPoint.clone()).divideScalar(2);

    const angleText = getCSS2DText(`${angle.toFixed(2)}°`, fontSizeString(FONT_SIZE))
    angleText.position.set(...textPos)

    return angleText;
}


function createLinePreview(startPoint: THREE.Vector3, endPoint: THREE.Vector3) : Line2 {

    const startCorrected = new THREE.Vector3(0,0,0);
    const endCorrected = endPoint.clone().sub(startPoint);

    // Get Distance Text
    let textPos = startCorrected.clone().add(endCorrected.clone()).divideScalar(2);
    const lineLabel = getCSS2DText(snapper.getText(startPoint.distanceTo(endPoint)), fontSizeString(-1 * FONT_SIZE));
    lineLabel.position.set(...textPos)

    const geometry = new LineGeometry();
    geometry.setPositions(destructureVector3Array([startCorrected, endCorrected]))
    const material = new LineMaterial({ color: WHITE, linewidth: LINE_WIDTH, depthWrite: false, depthTest: false });
    const linePreview = new Line2(geometry, material);
    linePreview.renderOrder = 100000; // Always draw on top

    const group = new THREE.Group();
    group.add(linePreview);
    group.add(lineLabel);
    group.position.set(...startPoint)

    return group;
}


class RulerEditor {

    editor: Editor;
    
    rulerStart?: THREE.Vector3;
    linePreview?: Line2;
    angleText?: CSS2DObject;

    constructor(editor: Editor) {
        this.editor = editor;
        this.rulerStart = undefined;
        this.linePreview = undefined;
        this.angleText = undefined;
    }

    public cleanup() {
        this.editor.remove(this.linePreview);
        this.editor.remove(this.angleText);
        this.rulerStart = undefined;
        this.linePreview = undefined;
        this.angleText = undefined;
    }

    public handleMouseMove(intersections: THREE.Object3D[]) {

        if (this.rulerStart === undefined) return;

        // draw ruler
        let [object, point] = processIntersections(intersections)
        point = snapper.snap(point)

        this.editor.remove(this.linePreview)
        this.editor.remove(this.angleText)

        this.linePreview = createLinePreview(this.rulerStart, point);
        this.angleText = createAngleText(this.rulerStart, point);

        this.editor.add(this.linePreview)
        this.editor.add(this.angleText)
    }

    public handleMouseClick(intersections: THREE.Object3D[]) {
        let [object, point] = processIntersections(intersections)
        point = snapper.snap(point)

        if (this.rulerStart === undefined) {
            this.rulerStart = point;
        } else {
            const ruler = createLinePreview(this.rulerStart, point);
            ruler.layers.set(LayerEnum.Objects)
            ruler.userData = {
                hideRotationWidget: true,
                selectable: true,
                editableFields: {
                    name: true,
                    position: true,
                    rotation: true
                }
            }
            ruler.name = "Ruler"
            this.editor.execute(new CreateObjectCommand(ruler, this.editor))
            this.cleanup()
        }

    }   

}

export { RulerEditor };