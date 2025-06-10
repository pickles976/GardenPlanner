import { Command } from './Command';
import { BedEditor } from '../BedEditor';

class BedEditingUpdateCommand extends Command {

    newProps: Object;
    oldProps: Object;
    bedEditor: BedEditor;
    uiCallback: CallableFunction;

    constructor (newProps: Object, bedEditor: BedEditor, uiCallback: CallableFunction) {
        super();
        this.name = "BedEditingUpdateCommand"
        this.updateable = false
        this.newProps = newProps;
        this.bedEditor = bedEditor;
        this.oldProps = {
            "name": bedEditor.bedName,
			"bedHeight": bedEditor.bedHeight, 
			"borderHeight": bedEditor.borderHeight, 
			"borderWidth": bedEditor.borderWidth,
			"bedColor": bedEditor.bedColor,
			"borderColor": bedEditor.borderColor
		}
        this.uiCallback = uiCallback
    }

    public canUpdate(newCommand: Command) : boolean {
        return this.name === newCommand.name && this.updateable
    }

    public execute() {
        this.bedEditor.updateBed(this.newProps);
        this.uiCallback()
    }

    public undo() {
        this.bedEditor.updateBed(this.oldProps);
        this.uiCallback()
    }

}

export { BedEditingUpdateCommand };