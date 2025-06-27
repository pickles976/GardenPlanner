import { Command } from './Command';
import { Props } from '../Constants';

class PropUpdateCommand extends Command {

    newProps: Props;
    oldProps: Props;
    subEditor: object;
    uiCallback: CallableFunction;

    constructor (name: string, newProps: Props, subEditor: object, uiCallback: CallableFunction) {
        super();
        this.name = name;
        this.updateable = true;
        this.newProps = newProps.clone();
        this.subEditor = subEditor;
        this.oldProps = subEditor.props.clone();
        this.uiCallback = uiCallback
    }

    private arePropsUpdateable() : boolean {
        /**
         * We can merge together prop changes if the changes occured for the same field, and if that field was differentiable.
         */

        if (this.oldProps.nonDifferentiableFieldChanged(this.newProps)) {
            return false;
        }

        if (this.oldProps.moreThanOneFieldChanged(this.newProps)) {
            return false;
        }

        return true;
    }

    public canUpdate(newCommand: Command) : boolean {
        return this.name === newCommand.name && this.updateable && this.arePropsUpdateable()
    }

    public update(newCommand: PropUpdateCommand) {
        this.newProps = newCommand.newProps;
    }

    public execute() {
        this.subEditor.updateFromProps(this.newProps);
        this.uiCallback()
    }

    public undo() {
        this.subEditor.updateFromProps(this.oldProps);
        this.uiCallback()
    }

}

export { PropUpdateCommand };