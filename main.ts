import * as THREE from 'three';
import { Editor } from './Editor';
import { requestRenderIfNotRequested, render } from './Rendering';


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

function createMoveableCube(scene: THREE.Scene): THREE.Mesh {
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

function createMoveableTorus(scene: THREE.Scene): THREE.Mesh {
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

function getCanvasRelativePosition(event, editor: Editor) {
  const rect = editor.canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * editor.canvas.width  / rect.width,
    y: (event.clientY - rect.top ) * editor.canvas.height / rect.height,
  };
}

function handleMouseMove(event, editor: Editor) {

    const pos = getCanvasRelativePosition(event, editor);
    const pickPosition = new THREE.Vector2();
    pickPosition.x = (pos.x / editor.canvas.width ) *  2 - 1;
    pickPosition.y = (pos.y / editor.canvas.height) * -2 + 1;  // note we flip Y

    editor.raycaster.setFromCamera( pickPosition, editor.camera );

    // const intersects = raycaster.intersectObjects( interactiveObjects );
    const intersects = editor.raycaster.intersectObjects(editor.scene.children);

    if ( intersects.length > 0 ) {

        const intersection = intersects[ 0 ];
        const object = intersection.object;
        console.log(object)

        // prepareAnimationData( object, this.center );
        if (object.material.emissive === undefined) {
            return false;
        }
        object.material.emissive.setHex(0xFFFF00);
        // animating = true;

        return true;

    } else {

        return false;

    }

}

const editor = new Editor();
editor.initThree();

window.addEventListener('resize', () => requestRenderIfNotRequested(editor))
window.addEventListener('mousemove', () => requestRenderIfNotRequested(editor));
window.addEventListener('mouseout', () => requestRenderIfNotRequested(editor));
window.addEventListener('mouseleave', () => requestRenderIfNotRequested(editor));

window.addEventListener('mousemove', (event) => handleMouseMove(event, editor));
window.addEventListener('mouseout', (event) => handleMouseMove(event, editor));
window.addEventListener('mouseleave', (event) => handleMouseMove(event, editor));




createGround(editor.scene)
let box = createMoveableCube(editor.scene)
box.position.set(0, 0, 2)
editor.transformControls.attach(editor.directionalLight);
const gizmo = editor.transformControls.getHelper();
editor.scene.add( gizmo );

let torus = createMoveableTorus(editor.scene)
torus.position.set(3, 3, 2)
