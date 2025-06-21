import * as THREE from 'three';
import { Editor } from './js/editors/Editor';
import { requestRenderIfNotRequested, render } from './js/Rendering';
import { handleMouseMove, handleMouseClick, handleKeyDown } from './js/EventHandlers';
import { Command } from './js/commands/Command';
import { SetPositionCommand } from './js/commands/SetPositionCommand';
import { SetRotationCommand } from './js/commands/SetRotationCommand';
import { SetScaleCommand } from './js/commands/SetScaleCommand';
import { Sidebar } from './js/sidebar/Sidebar';
import { eventBus, EventEnums } from './js/EventBus';
import { CreateObjectCommand } from './js/commands/CreateObjectCommand';
import { LayerEnum } from './js/Constants';
import { DARK_GRAY, GREEN, GROUND_COLOR, PEPPER_COLOR } from './js/Colors';
import { GridManager } from './js/GridManager';
import { Menubar } from './js/menubar/Menubar';
import { createCube, createHumanCube, createTorus } from './js/Creation';

import { load_mesh, meshes } from './js/ModelLoader';

function createGround(scene: THREE.Scene): THREE.Mesh {

    const groundMat = new THREE.MeshPhongMaterial({
        color: GROUND_COLOR,    // red (can also use a CSS color string here)
    });
    const groundGeo = new THREE.PlaneGeometry(64, 64, 4, 4)
    const groundMesh = new THREE.Mesh(groundGeo, groundMat)
    groundMesh.layers.set(LayerEnum.Objects)
    groundMesh.castShadow = false;
    groundMesh.receiveShadow = true;
    groundMesh.name = "Ground";
    scene.add(groundMesh)
    return groundMesh
}

function createObject(editor, gltf): THREE.Mesh {


    const len = gltf.scene.children.length;
    let mesh = gltf.scene.children[len - 1].children[0];

    mesh.material = new THREE.MeshPhongMaterial({
        map: mesh.material.map,
        lightMapIntensity: 3
    });
    mesh.layers.set(LayerEnum.Plants)
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.rotation.x = Math.PI / 2; // 90 degrees in radians
    mesh.userData = {"selectable": true}
    mesh.scale.set(0.3, 0.3, 0.3)
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);

    let newPos = mesh.position.add(new THREE.Vector3(0,0,size.z / 2))
    mesh.position.set(...newPos)
    editor.scene.add(mesh)
    return mesh
}

const editor = new Editor();
editor.initThree();

const gridManager = new GridManager(editor);

// Sidebar
const sidebar = new Sidebar( editor );
document.body.appendChild( sidebar.container.dom );

// Menubar
const menubar = new Menubar( editor );
document.body.appendChild( menubar.container.dom );

window.addEventListener('resize', () => requestRenderIfNotRequested(editor))
window.addEventListener('keydown', (event) => handleKeyDown(event, editor, sidebar, menubar));

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

eventBus.on(EventEnums.REQUEST_RENDER, () => render(editor));
eventBus.on(EventEnums.OBJECT_CHANGED, () => render(editor));
eventBus.on(EventEnums.METRIC_CHANGED, (value) => gridManager.setMetric(value))
eventBus.on(EventEnums.GRID_VISIBILITY_CHANGED, (value) => gridManager.showGrid(value))


createGround(editor.scene)

// let box = createCube(editor)
let box = createHumanCube(editor)
box.position.set(1, 1, 0.9144)

render(editor);

eventBus.on(EventEnums.LOAD_PLANT, (plant) => load_mesh(plant.model, editor, createObject))

