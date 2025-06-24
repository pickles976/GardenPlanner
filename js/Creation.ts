import * as THREE from 'three';
import { Editor } from './Editor';
import { CreateObjectCommand } from './commands/CreateObjectCommand';
import { LayerEnum } from './Constants';
import { setCurrentTransformationAsDefault } from './ModelLoader';
import { GROUND_COLOR } from './Colors';

export function createHumanCube(editor: Editor): THREE.Mesh {
    const mat = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD,
    })
    const geo = new THREE.BoxGeometry(0.6096, 0.3048, 1.8288);
    const mesh = new THREE.Mesh(geo, mat)
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
        selectable: true,
        editableFields: {
            name: true,
            position: true,
            rotation: true,
            scale: true
        }
    }
    mesh.layers.set(LayerEnum.Plants)
    mesh.name = "Box";

    editor.execute(new CreateObjectCommand(mesh, editor));

    return mesh
}

export function createCube(editor: Editor): THREE.Mesh {
    const mat = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD,
    })
    const geo = new THREE.BoxGeometry(0.3048, 0.3048, 0.3048);
    const mesh = new THREE.Mesh(geo, mat)
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
        selectable: true,
        editableFields: {
            name: true,
            position: true,
            rotation: true,
            scale: true
        }
    }
    mesh.layers.set(LayerEnum.Plants)
    mesh.name = "Box";

    editor.execute(new CreateObjectCommand(mesh, editor));

    return mesh
}

export function createCylinder(editor: Editor): THREE.Mesh {
    const mat = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD,
    })
    const geo = new THREE.CylinderGeometry(1, 1, 1, 32);
    let mesh = new THREE.Mesh(geo, mat)

    mesh.rotation.x = mesh.rotation.x + (Math.PI / 2);
    mesh = setCurrentTransformationAsDefault(mesh);    

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
        selectable: true,
        editableFields: {
                name: true,
                position: true,
                rotation: true,
                radius: true,
                height: true
        }
    }
    mesh.layers.set(LayerEnum.Plants)
    mesh.name = "Cylinder";

    editor.execute(new CreateObjectCommand(mesh, editor));

    return mesh
}

export function createSphere(editor: Editor): THREE.Mesh {
    const mat = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD,
    })
    const geo = new THREE.SphereGeometry(1, 32, 16);
    const mesh = new THREE.Mesh(geo, mat)
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
        selectable: true,
        editableFields: {
                name: true,
                position: true,
                rotation: true,
                radius: true,
                height: true
        }
    }
    mesh.layers.set(LayerEnum.Plants)
    mesh.name = "Sphere";

    editor.execute(new CreateObjectCommand(mesh, editor));

    return mesh
}

export function createGround(scene: THREE.Scene): THREE.Mesh {

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
