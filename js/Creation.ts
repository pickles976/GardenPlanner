import * as THREE from 'three';
import { Editor } from './Editor';
import { CreateObjectCommand } from './commands/CreateObjectCommand';
import { LayerEnum } from './Constants';

export function createCube(editor: Editor): THREE.Mesh {
    const mat = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD,
    })
    const geo = new THREE.BoxGeometry(0.3048, 0.3048, 0.3048);
    const mesh = new THREE.Mesh(geo, mat)
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {selectable: true}
    mesh.layers.set(LayerEnum.Plants)
    mesh.name = "Box";

    editor.execute(new CreateObjectCommand(mesh, editor));

    return mesh
}

export function createHumanCube(editor: Editor): THREE.Mesh {
    const mat = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD,
    })
    const geo = new THREE.BoxGeometry(0.6096, 0.3048, 1.8288);
    const mesh = new THREE.Mesh(geo, mat)
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {selectable: true}
    mesh.layers.set(LayerEnum.Plants)
    mesh.name = "Box";

    editor.execute(new CreateObjectCommand(mesh, editor));

    return mesh
}

export function createCylinder(editor: Editor): THREE.Mesh {
    const mat = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD,
    })
    const geo = new THREE.CylinderGeometry(0.3048, 0.3048, 0.3048, 32);
    const mesh = new THREE.Mesh(geo, mat)
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {selectable: true}
    mesh.layers.set(LayerEnum.Plants)
    mesh.name = "Cylinder";

    editor.execute(new CreateObjectCommand(mesh, editor));

    return mesh
}

export function createSphere(editor: Editor): THREE.Mesh {
    const mat = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD,
    })
    const geo = new THREE.SphereGeometry(0.3048, 32, 16);
    const mesh = new THREE.Mesh(geo, mat)
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {selectable: true}
    mesh.layers.set(LayerEnum.Plants)
    mesh.name = "Sphere";

    editor.execute(new CreateObjectCommand(mesh, editor));

    return mesh
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