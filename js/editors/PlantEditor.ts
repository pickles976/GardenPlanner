import { CommandStack } from "../CommandStack";
import { Editor } from "./Editor";

enum PlantEditorMode {
    INACTIVE = "INACTIVE",

}

class PlantEditor {
    editor: Editor;
    commandStack: CommandStack;
    mode: PlantEditorMode;

    constructor(editor: Editor) {
        this.editor = editor;
        this.commandStack = new CommandStack();
        this.mode = PlantEditorMode.INACTIVE;
    }    
}

export { PlantEditor };