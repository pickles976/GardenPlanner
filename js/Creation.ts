import * as THREE from 'three';
import { Editor } from './Editor';
import { CreateObjectCommand } from './commands/CreateObjectCommand';
import { LayerEnum, WORLD_SIZE } from './Constants';
import { setCurrentTransformationAsDefault } from './ModelLoader';
import { GROUND_COLOR, WHITE } from './Colors';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createPhongMaterial, getGeometrySize, getObjectsize, mergeMeshes } from './Utils';
import { depthTexturePreviewMaterial } from './DepthTextureHelper';
import { compassTexture } from './Materials';

const loader = new GLTFLoader();

export async function createHumanCube(editor: Editor): THREE.Mesh {
    const gltf = await loader.loadAsync("/models/miyako.glb");

    const len = gltf.scene.children.length;
    let mesh = gltf.scene.children[len - 1].children[0];

    // let meshes = [];
    mesh.traverse(function (child) {
        if (child.type === "Mesh") {
            child.material = new THREE.MeshPhongMaterial({map: child.material.map, color: 0xFFFFFF})
            child.castShadow = true;
            child.receiveShadow = true;
            child.layers.set(LayerEnum.Objects)
        }
    });

    mesh.layers.set(LayerEnum.Objects)
    mesh.userData = {
        selectable: true,
        editableFields: {
            name: true,
            position: true,
            rotation: true,
            scale: true
        }
    }

    const scale = 1
    mesh.scale.set(scale,scale,scale)
    mesh.rotation.x = mesh.rotation.x - Math.PI / 2;

    mesh.name = "Human-sized object";
    editor.execute(new CreateObjectCommand(mesh, editor));

    return mesh
}

export function createCube(editor: Editor): THREE.Mesh {
    const mat = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD
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
    mesh.layers.set(LayerEnum.Objects)
    mesh.name = "Box";

    editor.execute(new CreateObjectCommand(mesh, editor));

    return mesh
}

export function createCylinder(editor: Editor): THREE.Mesh {
    const mat = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD,
    })
    const geo = new THREE.CylinderGeometry(0.3048, 0.3048, 1, 32);
    let mesh = new THREE.Mesh(geo, mat)

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
    mesh.layers.set(LayerEnum.Objects)
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
    mesh.layers.set(LayerEnum.Objects)
    mesh.name = "Sphere";

    editor.execute(new CreateObjectCommand(mesh, editor));

    return mesh
}

export function createPlane(editor: Editor): THREE.Mesh {

    const mat = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD,
        side: THREE.DoubleSide

    })
    const geo = new THREE.PlaneGeometry(1, 1, 4, 4)
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
    mesh.layers.set(LayerEnum.Objects)
    mesh.name = "Plane";
    mesh.position.set(0,0,0.3)

    editor.execute(new CreateObjectCommand(mesh, editor));
}



export function createGround(editor: Editor): THREE.Mesh {

    const mat = new THREE.MeshPhongMaterial({
        color: GROUND_COLOR,    // red (can also use a CSS color string here)
    });

    const geometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 4, 4)
    const mesh = new THREE.Mesh(geometry, mat)
    mesh.layers.set(LayerEnum.World)
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.name = "Ground";
    mesh.rotation.x = mesh.rotation.x - Math.PI / 2;
    editor.scene.add(mesh)
    return mesh
}


export function createCompass(): THREE.Mesh {

    const mat = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD,
    })
    const geo = new THREE.SphereGeometry(0.1, 32, 16);
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
    mesh.layers.set(LayerEnum.Objects)
    mesh.name = "Sphere";

    return mesh;

}