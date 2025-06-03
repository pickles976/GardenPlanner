import { Command } from "./commands/Command";


class CommandStack {

    stack: Command[]

    constructor() {
        this.stack = []
    }

    public execute(command: Command) {
        if (this.stack.length == 0) {
            command.execute();
            this.stack.push(command)
        } else {
            let lastCommand = this.stack[this.stack.length - 1];
            // Update if same type of command
            if (lastCommand.canUpdate(command)) {
                lastCommand.update(command);
                lastCommand.execute()
            } else { // else just push
                command.execute()
                this.stack.push(command)
            }
        }
    }
    
    public undo() {
        const command = this.stack.pop();
        command?.undo();
    }
}

export { CommandStack };