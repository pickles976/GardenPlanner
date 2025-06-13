import * as THREE from 'three';
import { Editor } from './js/Editor';
import { requestRenderIfNotRequested, render } from './js/Rendering';
import { handleMouseMove, handleMouseClick, handleKeyDown } from './js/EventHandlers';
import { Command } from './js/commands/Command';
import { SetPositionCommand } from './js/commands/SetPositionCommand';
import { SetRotationCommand } from './js/commands/SetRotationCommand';
import { SetScaleCommand } from './js/commands/SetScaleCommand';
import { Sidebar } from './js/sidebar/Sidebar';
import { eventBus, EventEnums } from './js/EventBus';
import { CreateObjectCommand } from './js/commands/CreateObjectCommand';
import { LayerEnums } from './js/Constants';
import { GROUND_COLOR } from './js/Colors';
import { GridManager } from './js/GridManager';

function createGround(scene: THREE.Scene): THREE.Mesh {

    const groundMat = new THREE.MeshPhongMaterial({
        color: GROUND_COLOR,    // red (can also use a CSS color string here)
    });
    const groundGeo = new THREE.PlaneGeometry(64, 64, 4, 4)
    const groundMesh = new THREE.Mesh(groundGeo, groundMat)
    groundMesh.layers.set(LayerEnums.Objects)
    groundMesh.castShadow = false;
    groundMesh.receiveShadow = true;
    groundMesh.name = "Ground";
    scene.add(groundMesh)
    return groundMesh
}

function createCube(editor: Editor): THREE.Mesh {
    const boxMat = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD,
    })
    const boxGeo = new THREE.BoxGeometry(0.3048, 0.3048, 0.3048);
    const boxMesh = new THREE.Mesh(boxGeo, boxMat)
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    boxMesh.userData = {selectable: true}
    boxMesh.layers.set(LayerEnums.Plants)
    // TODO: make this dynamic
    boxMesh.name = "Box";

    editor.execute(new CreateObjectCommand(boxMesh, editor));

    return boxMesh
}

function createTorus(editor: Editor): THREE.Mesh {
    const torusMat = new THREE.MeshPhongMaterial({
        color: 0x2A7AB0,
    })
    const torusGeo = new THREE.TorusGeometry(0.3048, 0.25 * 0.3048, 64, 64);
    const torusMesh = new THREE.Mesh(torusGeo, torusMat)
    torusMesh.castShadow = true;
    torusMesh.receiveShadow = true;
    torusMesh.userData = {selectable: true}
    torusMesh.layers.set(LayerEnums.Plants)
    // TODO: make this dynamic
    torusMesh.name = "Torus"

    editor.execute(new CreateObjectCommand(torusMesh, editor));

    return torusMesh
}

const editor = new Editor();
editor.initThree();

const gridManager = new GridManager(editor);

window.addEventListener('resize', () => requestRenderIfNotRequested(editor))
window.addEventListener('keydown', (event) => handleKeyDown(event, editor));

editor.canvas.addEventListener('mousemove', () => requestRenderIfNotRequested(editor));
editor.canvas.addEventListener('mouseout', () => requestRenderIfNotRequested(editor));
editor.canvas.addEventListener('mouseleave', () => requestRenderIfNotRequested(editor));

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
    eventBus.emit('objectChanged', editor.selector.currentSelectedObject);
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

eventBus.on(EventEnums.REQUEST_RENDER, () => render(editor));
eventBus.on(EventEnums.OBJECT_CHANGED, () => render(editor));
eventBus.on(EventEnums.METRIC_CHANGED, (value) => gridManager.setMetric(value))
eventBus.on(EventEnums.GRID_VISIBILITY_CHANGED, (value) => gridManager.showGrid(value))


createGround(editor.scene)
let box = createCube(editor)
box.position.set(0, 0, 0.3048)

let torus = createTorus(editor)
torus.position.set(1, 1, 0.3048)

render(editor);

const sidebar = Sidebar( editor );
document.body.appendChild( sidebar.dom );
