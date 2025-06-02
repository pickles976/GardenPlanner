import * as THREE from 'three';
import { Editor } from './js/Editor';
import { requestRenderIfNotRequested, render } from './js/Rendering';
import { handleMouseMove, handleMouseClick, handleKeyDown } from './js/EventHandlers';
import { Command } from './js/commands/Command';
import { SetPositionCommand } from './js/commands/SetPositionCommand';
import { SetRotationCommand } from './js/commands/SetRotationCommand';
import { SetScaleCommand } from './js/commands/SetScaleCommand';
import { Sidebar } from './js/sidebar/Sidebar';
import { eventBus } from './js/EventBus';
import { CreateObjectCommand } from './js/commands/CreateObjectCommand';

function createGround(scene: THREE.Scene): THREE.Mesh {

    const groundMat = new THREE.MeshPhongMaterial({
        color: 0x00FF11,    // red (can also use a CSS color string here)
    });
    const groundGeo = new THREE.PlaneGeometry(64, 64, 4, 4)
    const groundMesh = new THREE.Mesh(groundGeo, groundMat)
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
    const boxGeo = new THREE.BoxGeometry(2, 2, 2);
    const boxMesh = new THREE.Mesh(boxGeo, boxMat)
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    boxMesh.userData = {selectable: true}
    // TODO: make this dynamic
    boxMesh.name = "Box";

    editor.execute(new CreateObjectCommand(boxMesh, editor));

    return boxMesh
}

function createTorus(editor: Editor): THREE.Mesh {
    const torusMat = new THREE.MeshPhongMaterial({
        color: 0x2A7AB0,
    })
    const torusGeo = new THREE.TorusGeometry(2, 0.5, 64, 64);
    const torusMesh = new THREE.Mesh(torusGeo, torusMat)
    torusMesh.castShadow = true;
    torusMesh.receiveShadow = true;
    torusMesh.userData = {selectable: true}
    // TODO: make this dynamic
    torusMesh.name = "Torus"

    editor.execute(new CreateObjectCommand(torusMesh, editor));

    return torusMesh
}

const editor = new Editor();
editor.initThree();

window.addEventListener('resize', () => requestRenderIfNotRequested(editor))
window.addEventListener('keydown', (event) => handleKeyDown(event, editor));

editor.canvas.addEventListener('mousemove', () => requestRenderIfNotRequested(editor));
editor.canvas.addEventListener('mouseout', () => requestRenderIfNotRequested(editor));
editor.canvas.addEventListener('mouseleave', () => requestRenderIfNotRequested(editor));

// TODO: CLEAN THIS UP
function performRaycast(event, editor, callback){
    
    // Only do a raycast if the LMB was used
    if (event.button !== 0) {
        return
    }

    const selector = editor.selector;
    let intersections = selector.performRaycast(event);
    if ( intersections.length > 0 ) {

        const intersection = intersections[ 0 ];
        const object = intersection.object;
        const point = intersection.point;
        
        if (object.userData.selectable === true) {
            callback(editor, object, point);
        } else {
            callback(editor, undefined, point);
        }

        return true;

    } else {

        callback(editor, undefined, undefined);

        return false;

    }
}

// TODO: CLEAN THIS UP, TOO CONVOLUTED!!!
editor.canvas.addEventListener('mousemove', (event) => performRaycast(event, editor, handleMouseMove));
editor.canvas.addEventListener('mouseout', (event) => performRaycast(event, editor, handleMouseMove));
editor.canvas.addEventListener('mouseleave', (event) => performRaycast(event, editor, handleMouseMove));
editor.canvas.addEventListener('mousedown', (event) => performRaycast(event, editor, handleMouseClick));


editor.transformControls.addEventListener('mouseDown', function (event) {
    const selector = editor.selector;
    editor.cameraControls.enabled = false;
    selector.isUsingTransformControls = true;
});

editor.transformControls.addEventListener('change', function(event) {
    eventBus.emit('objectChanged', editor.selector.currentSelectedObject);
})

editor.transformControls.addEventListener('mouseUp', function (event) {
    const selector = editor.selector;
    
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

    editor.execute(command);
});

eventBus.on('requestRender', () => render(editor));
eventBus.on('objectChanged', () => render(editor));


createGround(editor.scene)
let box = createCube(editor)
box.position.set(0, 0, 2)

let torus = createTorus(editor)
torus.position.set(3, 3, 2)

render(editor);

const sidebar = Sidebar( editor );
document.body.appendChild( sidebar.dom );
