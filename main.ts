import * as THREE from 'three';
import { Editor } from './js/Editor';
import { requestRenderIfNotRequested, render } from './js/Rendering';
import { Selector } from './js/Selector';
import { handleMouseMove, handleMouseClick, handleKeyDown } from './js/EventHandlers';
import { Command } from './js/commands/Command';
import { SetPositionCommand } from './js/commands/SetPositionCommand';
import { SetRotationCommand } from './js/commands/SetRotationCommand';
import { SetScaleCommand } from './js/commands/SetScaleCommand';
import { Sidebar } from './js/sidebar/Sidebar';


function createGround(scene: THREE.Scene): THREE.Mesh {

    const groundMat = new THREE.MeshPhongMaterial({
        color: 0x00FF11,    // red (can also use a CSS color string here)
    });
    const groundGeo = new THREE.PlaneGeometry(64, 64, 4, 4)
    const groundMesh = new THREE.Mesh(groundGeo, groundMat)
    groundMesh.castShadow = false;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh)
    return groundMesh
}

function createCube(scene: THREE.Scene): THREE.Mesh {
    const boxMat = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD,
    })
    const boxGeo = new THREE.BoxGeometry(2, 2, 2);
    const boxMesh = new THREE.Mesh(boxGeo, boxMat)
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    boxMesh.userData = {selectable: true}
    scene.add(boxMesh)
    return boxMesh
}

function createTorus(scene: THREE.Scene): THREE.Mesh {
    const torusMat = new THREE.MeshPhongMaterial({
        color: 0x2A7AB0,
    })
    const torusGeo = new THREE.TorusGeometry(2, 0.5, 64, 64);
    const torusMesh = new THREE.Mesh(torusGeo, torusMat)
    torusMesh.castShadow = true;
    torusMesh.receiveShadow = true;
    torusMesh.userData = {selectable: true}
    scene.add(torusMesh)
    return torusMesh
}



const editor = new Editor();
editor.initThree();

const selector = new Selector(editor);

window.addEventListener('resize', () => requestRenderIfNotRequested(editor))
window.addEventListener('mousemove', () => requestRenderIfNotRequested(editor));
window.addEventListener('mouseout', () => requestRenderIfNotRequested(editor));
window.addEventListener('mouseleave', () => requestRenderIfNotRequested(editor));

window.addEventListener('mousemove', (event) => selector.performRaycast(event, handleMouseMove));
window.addEventListener('mouseout', (event) => selector.performRaycast(event, handleMouseMove));
window.addEventListener('mouseleave', (event) => selector.performRaycast(event, handleMouseMove));

window.addEventListener('mousedown', (event) => selector.performRaycast(event, handleMouseClick));

window.addEventListener('keydown', (event) => handleKeyDown(event, editor, selector));

editor.transformControls.addEventListener('mouseDown', function (event) {
    editor.cameraControls.enabled = false;
    selector.isUsingTransformControls = true;
});

editor.transformControls.addEventListener('mouseUp', function (event) {
    editor.cameraControls.enabled = true;
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

    console.log("Mouse UP")
    command.execute();
    editor.commandStack.push(command);
});

createGround(editor.scene)
let box = createCube(editor.scene)
box.position.set(0, 0, 2)

let torus = createTorus(editor.scene)
torus.position.set(3, 3, 2)

render(editor);

const sidebar = Sidebar( editor );
document.body.appendChild( sidebar.dom );
