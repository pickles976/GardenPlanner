

class Command {

    name: string
    updateable: boolean

    public execute() {

    } 
    
    public undo() {

    }

    public canUpdate(newCommand: Command) : boolean {
        return false;
    }

    public update(newCommand: Command) {

    }

}

export { Command };