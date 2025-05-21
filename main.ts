import * as THREE from 'three';
import { Editor } from './Editor';
import { requestRenderIfNotRequested, render } from './Rendering';
import { Selector } from './Selector';
import { handleMouseMove } from './MouseEventHandlers';


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





// editor.transformControls.attach(editor.directionalLight);
// const gizmo = editor.transformControls.getHelper();
// editor.scene.add( gizmo );

createGround(editor.scene)
let box = createCube(editor.scene)
box.position.set(0, 0, 2)

let torus = createTorus(editor.scene)
torus.position.set(3, 3, 2)
