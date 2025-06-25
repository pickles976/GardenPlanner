/**
 * 1. Place Vertices
 *  a. insert and undo
 *  b. close loop by clicking on start vertex
 * 2. Edit Vertices
 * 3. Configure Bed
 * 4. Save finalized mesh
 * 
 * TODO: make this all command-based at some point
 * 1. create a mapping of vertex handle objects to vertices
 * 2. add a callback to the vertex handles to update the vertices based on index
 * 3. make everything command-based, use UUIDs to track
 */

import { Object3D, Vector3, Mesh, Vector2, Shape, Material, ExtrudeGeometry, Path, Group } from "three";

import offsetPolygon from "offset-polygon";
import "external-svg-loader";

import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import { getCentroid, polygonArea, mergeMeshes, createPhongMaterial, createPreviewMaterial, destructureVector3Array, getCSS2DText, fontSizeString } from "../Utils";
import { CreateObjectCommand } from "../commands/CreateObjectCommand";
import { eventBus, EventEnums } from "../EventBus";
import { CommandStack } from "../CommandStack";
import { FONT_SIZE, LayerEnum } from "../Constants";
import { Editor } from "./Editor";

import { DARK_GRAY, VERTEX_COLOR, WHITE } from "../Colors";
import { setDefaultCursor } from "../Cursors";
import { LineEditor } from "./LineEditor";
import { snapper } from "../Snapping";

const LINE_CONFIG_CAMERA_OFFSET = new Vector3(0, -2, 2);

function createRuler(vertices: Vector3[]) : Group {
    const group = new Group();

    let len = vertices.length;
    for (let i = 0; i < len - 1; i++) {
        const p1 = vertices[i % len]
        const p2 = vertices[(i + 1) % len]

        let textPos = p1.clone().add(p2.clone()).divideScalar(2);
        const lineLabel = getCSS2DText(snapper.getText(p1.distanceTo(p2)), fontSizeString(FONT_SIZE));
        lineLabel.position.set(...textPos)
        lineLabel.layers.set(LayerEnum.LineVertices)
        group.add(lineLabel)
    }

    // Get line segments
    const geometry = new LineGeometry();
    const verts = vertices.map((v) => v.clone())
    verts.forEach((v) => v.z = 0.01)

    geometry.setPositions(destructureVector3Array(verts));
    const material = new LineMaterial({ color: WHITE, linewidth: 5, depthWrite: false, depthTest: false });
    const line = new Line2(geometry, material);

    group.add(line);
    group.userData = {
        selectable: true
    }

    group.layers.set(LayerEnum.Objects)
    return group;
}


enum RulerEditorMode {
    INACTIVE = "INACTIVE",
    LINE_EDITOR_MODE = "LINE_EDITOR_MODE"
}


class RulerEditor {

    editor: Editor;
    lineEditor: LineEditor;
    commandStack: CommandStack;
    mode: RulerEditorMode;

    vertices: Vector3[];
    rulerObject: Mesh;

    // Original ruler
    oldRuler?: Object3D;

    constructor(editor: Editor) {

        this.editor = editor;
        this.lineEditor = new LineEditor(
            editor, 
            EventEnums.RULER_VERTEX_EDITING_STARTED, 
            EventEnums.RULER_VERTEX_EDITING_UPDATED, 
            EventEnums.RULER_VERTEX_EDITING_FINISHED, 
            EventEnums.RULER_EDITING_CANCELLED,
            false);

        this.commandStack = new CommandStack();
        this.mode = RulerEditorMode.INACTIVE;

        this.oldRuler = undefined;
        this.vertices = [];

        eventBus.on(EventEnums.RULER_VERTEX_EDITING_FINISHED, () => {
            this.vertices = this.lineEditor.vertexHandles.map((item) => item.position.clone());
            this.editor.setPerspectiveCamera()
            this.createRulerPreview()
            this.lineEditor.cleanUp();
        })

        eventBus.on(EventEnums.RULER_EDITING_FINISHED, (event) => {
            const line = new CreateObjectCommand(createRuler(this.vertices), this.editor);
            console.log(line);
            this.editor.execute(line);
            this.cleanUp();
        })

        eventBus.on(EventEnums.RULER_EDITING_CANCELLED, (event) => {
            this.cancel();
        })

    }

    private createRulerPreview() {
        this.editor.remove(this.rulerObject);
        this.rulerObject = createRuler(this.vertices);
        this.editor.add(this.rulerObject);
    }

    public cancel() {
        if (this.oldRuler) {
            this.editor.execute(new CreateObjectCommand(this.oldRuler, this.editor))
        }
        this.cleanUp();
        this.lineEditor.cancel();
    }

    // Cleanup
    public cleanUp() {
        this.oldRuler = undefined;
        this.editor.remove(this.rulerObject);
        this.lineEditor.cleanUp()

        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    // Change modes
    public beginRulerEditing(ruler?: Object3D) {
        this.cleanUp();
        this.mode = RulerEditorMode.LINE_EDITOR_MODE;

        if (ruler === undefined) {
            this.lineEditor.beginLineEditing()
        } else { // Edit existing bed
            this.lineEditor.beginLineEditing(ruler.userData.vertices);
            this.oldRuler = ruler;
            this.editor.remove(ruler);
        }
    }

    public handleKeyDown(event) {
        this.lineEditor.handleKeyDown(event)
    }

    public undo() {
        this.commandStack.undo();
        switch (this.mode) {
            case RulerEditorMode.LINE_EDITOR_MODE:
                this.lineEditor.undo();
                break;
            default:
                break;
        }
        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    public handleMouseMove(editor: Editor, intersections: Object3D[]) {
        this.lineEditor.handleMouseMove(editor, intersections)
    }

    public handleMouseClick(editor: Editor, intersections: Object3D[]) {
        this.lineEditor.handleMouseClick(editor, intersections);
    }

}

export { RulerEditor, RulerEditorMode };