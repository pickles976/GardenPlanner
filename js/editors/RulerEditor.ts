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

import { Object3D, Vector3, Mesh, Vector2, Shape, Material, ExtrudeGeometry, Path } from "three";

import offsetPolygon from "offset-polygon";
import "external-svg-loader";

import { getCentroid, polygonArea, mergeMeshes, createPhongMaterial, createPreviewMaterial } from "../Utils";
import { CreateObjectCommand } from "../commands/CreateObjectCommand";
import { eventBus, EventEnums } from "../EventBus";
import { CommandStack } from "../CommandStack";
import { LayerEnum } from "../Constants";
import { Editor } from "./Editor";

import { DARK_GRAY, VERTEX_COLOR } from "../Colors";
import { setDefaultCursor } from "../Cursors";
import { LineEditor } from "./LineEditor";

const NUM_ARC_SEGMENTS = 1;
const BED_CONFIG_CAMERA_OFFSET = new Vector3(0, -2, 2);


enum RulerEditorMode {
    INACTIVE = "INACTIVE",
    LINE_EDITOR_MODE = "LINE_EDITOR_MODE"
}


class RulerEditor {

    editor: Editor;
    lineEditor: LineEditor;
    commandStack: CommandStack;
    mode: RulerEditorMode;

    vertices: Vector3[]; // Used during vertex placement mode and bed config mode

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
            this.cleanUp();
        })

        eventBus.on(EventEnums.RULER_EDITING_FINISHED, (event) => {
            this.createRuler()
            this.cleanUp();
        })

        eventBus.on(EventEnums.RULER_EDITING_CANCELLED, (event) => {
            this.cancel();
        })

    }

    private createRuler() {
        // TODO: actually create ruler mesh
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