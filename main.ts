import { handleMouseMove, handleMouseClick, handleKeyDown, handleKeyUp } from './js/EventHandlers';
import { SetPositionCommand } from './js/commands/SetPositionCommand';
import { SetRotationCommand } from './js/commands/SetRotationCommand';
import { render } from './js/Rendering';
import { SetScaleCommand } from './js/commands/SetScaleCommand';
import { createHumanCube, createGround } from './js/Creation';
import { eventBus, EventEnums } from './js/EventBus';
import { Command } from './js/commands/Command';
import { GridManager } from './js/GridManager';
import { Menubar } from './js/menubar/Menubar';
import { Sidebar } from './js/sidebar/Sidebar';
import { loadPlant } from './js/ModelLoader';
import { Editor } from './js/Editor';
import { createGrass } from './js/Grass';
import { WORLD_SIZE } from './js/Constants';

const editor = new Editor();
editor.initThree();

const gridManager = new GridManager(editor);

// Sidebar
const sidebar = new Sidebar( editor );
document.body.appendChild( sidebar.container.dom );

// Menubar
const menubar = new Menubar( editor );
document.body.appendChild( menubar.container.dom );

window.addEventListener('keydown', (event) => handleKeyDown(event, editor, sidebar, menubar));
window.addEventListener('keyup', (event) => handleKeyUp(event, editor, sidebar, menubar));

editor.canvas.addEventListener('mousemove', (event) => handleMouseMove(event, editor));
editor.canvas.addEventListener('mouseout', (event) => handleMouseMove(event, editor));
editor.canvas.addEventListener('mouseleave', (event) => handleMouseMove(event, editor));
editor.canvas.addEventListener('mousedown', (event) => handleMouseClick(event, editor));


editor.transformControls.addEventListener('mouseDown', function (event) {
    const selector = editor.selector;
    editor.currentCameraControls.enabled = false;
    selector.isUsingTransformControls = true;
});

editor.transformControls.addEventListener('change', function(event) {
    eventBus.emit(EventEnums.OBJECT_CHANGED, editor.selector.currentSelectedObject);
})

editor.transformControls.addEventListener('mouseUp', function (event) {
    const selector = editor.selector;
    
    editor.currentCameraControls.enabled = true;
    selector.isUsingTransformControls = false;

    if (selector.currentSelectedObject === undefined) {
        return;
    }

    let command: Command | undefined = undefined;
    switch (editor.transformControls.getMode()) {
        case "translate":
            command = new SetPositionCommand(
                selector.currentSelectedObject, 
                editor.transformControls._positionStart.clone(), 
                selector.currentSelectedObject.position.clone());
            break;
        case "rotate": 
            command = new SetRotationCommand(
                selector.currentSelectedObject, 
                editor.transformControls._quaternionStart.clone(), 
                selector.currentSelectedObject.quaternion.clone());
            break;
        case "scale":
            command = new SetScaleCommand(
                selector.currentSelectedObject,
                editor.transformControls._scaleStart.clone(),
                selector.currentSelectedObject.scale.clone()
            )
            break;
        default:
            break;
    }

    if (command === undefined) {
        return;
    }

    editor.execute(command);
});

eventBus.on(EventEnums.METRIC_CHANGED, (value) => gridManager.setMetric(value))
eventBus.on(EventEnums.GRID_VISIBILITY_CHANGED, (value) => gridManager.showGrid(value))

createGround(editor)

let box = await createHumanCube(editor)
box.position.set(1, 1, 0)

render(editor);

eventBus.on(EventEnums.LOAD_PLANT, (plant) => loadPlant(plant, editor))

