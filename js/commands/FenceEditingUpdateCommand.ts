import { Command } from './Command';
import { FenceEditor } from '../editors/FenceEditor';

class FenceEditingUpdateCommand extends Command {

    newProps: Object;
    oldProps: Object;
    fenceEditor: FenceEditor;
    uiCallback: CallableFunction;

    constructor (newProps: Object, fenceEditor: FenceEditor, uiCallback: CallableFunction) {
        super();
        this.name = "FenceEditingUpdateCommand"
        this.updateable = true
        this.newProps = newProps;
        this.fenceEditor = fenceEditor;
        this.oldProps = {
            "name": fenceEditor.fenceName,
			"fenceHeight": fenceEditor.fenceHeight, 
			"fenceColor": fenceEditor.fenceColor,
            "shadow": fenceEditor.shadow
		}
        this.uiCallback = uiCallback
    }

    private arePropsUpdateable() : boolean {
        /**
         * We only want to merge two commands if the change between the old and new props are "differentiable"
         * 1. Strings are not differentiable
         * 2. If 2 fields have changed, we are editing a new field and don't want to merge the commands
         * (example: we don't want to combine a command for bedHeight and borderWidth, since calling `undo()` on the command would undo two separate 
         * value changes)
         */
        
        // Non-numeric values are not updateable
        if (!(this.oldProps.name === this.newProps.name &&
            this.oldProps.fenceColor === this.newProps.fenceColor &&
            this.oldProps.shadow === this.newProps.shadow)) {
                return false
        }

        // Make sure that only one field has changed between updates
        let diffCount = 0;

        // Get a union of keys from both objects
        const allKeys = new Set([...Object.keys(this.oldProps), ...Object.keys(this.newProps)]);

        for (const key of allKeys) {
            const oldVal = this.oldProps[key];
            const newVal = this.newProps[key];

            // Check for inequality, treating NaN and undefined properly
            const valuesAreDifferent = 
            (oldVal !== newVal && !(Number.isNaN(oldVal) && Number.isNaN(newVal))) || 
            (oldVal === undefined && newVal !== undefined) || 
            (newVal === undefined && oldVal !== undefined);

            if (valuesAreDifferent) {
            diffCount++;
            if (diffCount > 1) return false; // Short-circuit if more than one field differs
            }
        }

        return diffCount === 1;
    }

    public canUpdate(newCommand: Command) : boolean {
        return this.name === newCommand.name && this.updateable && this.arePropsUpdateable()
    }

    public update(newCommand: FenceEditingUpdateCommand) {
        this.newProps = newCommand.newProps;
    }

    public execute() {
        this.fenceEditor.updateFromProps(this.newProps);
        this.uiCallback()
    }

    public undo() {
        this.fenceEditor.updateFromProps(this.oldProps);
        this.uiCallback()
    }

}

export { FenceEditingUpdateCommand };