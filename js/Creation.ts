import * as THREE from 'three';
import { Editor } from './Editor';
import { CreateObjectCommand } from './commands/CreateObjectCommand';
import { LayerEnum } from './Constants';

export function createCube(editor: Editor): THREE.Mesh {
    const boxMat = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD,
    })
    const boxGeo = new THREE.BoxGeometry(0.3048, 0.3048, 0.3048);
    const boxMesh = new THREE.Mesh(boxGeo, boxMat)
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    boxMesh.userData = {selectable: true}
    boxMesh.layers.set(LayerEnum.Plants)
    // TODO: make this dynamic
    boxMesh.name = "Box";

    editor.execute(new CreateObjectCommand(boxMesh, editor));

    return boxMesh
}

export function createTorus(editor: Editor): THREE.Mesh {
    const torusMat = new THREE.MeshPhongMaterial({
        color: 0x2A7AB0,
    })
    const torusGeo = new THREE.TorusGeometry(0.3048, 0.25 * 0.3048, 64, 64);
    const torusMesh = new THREE.Mesh(torusGeo, torusMat)
    torusMesh.castShadow = true;
    torusMesh.receiveShadow = true;
    torusMesh.userData = {selectable: true}
    torusMesh.layers.set(LayerEnum.Plants)
    // TODO: make this dynamic
    torusMesh.name = "Torus"

    editor.execute(new CreateObjectCommand(torusMesh, editor));

    return torusMesh
}