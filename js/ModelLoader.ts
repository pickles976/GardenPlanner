import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Plant } from './Plants';
import { Editor } from './editors/Editor';
import * as THREE from 'three';
import { LayerEnum } from './Constants';
import { CreateObjectCommand } from './commands/CreateObjectCommand';
import { eventBus, EventEnums } from './EventBus';

const loader = new GLTFLoader();

export function setCurrentTransformationAsDefault(model: THREE.Object3D) : THREE.Object3D {
    model.updateMatrixWorld(true); // Ensure matrix is updated
    model.traverse((child) => {
    if (child.isMesh) {
        child.geometry.applyMatrix4(child.matrixWorld); // Bake transformation
        child.rotation.set(0, 0, 0); // Reset rotation
        child.position.set(0, 0, 0); // Optional: reset position if baked
        child.scale.set(1, 1, 1);    // Optional: reset scale if baked
        child.updateMatrix();
    }
    });

    // Reset transformation on parent after baking
    model.rotation.set(0, 0, 0);
    model.position.set(0, 0, 0);
    model.scale.set(1, 1, 1);
    model.updateMatrix();

    return model;
}

function createPlantObject(editor, gltf, plant): THREE.Mesh {

    const len = gltf.scene.children.length;
    let mesh = gltf.scene.children[len - 1].children[0];

    mesh.material = new THREE.MeshPhongMaterial({
        map: mesh.material.map,
        lightMapIntensity: 3
    });

    // Bake in rotation and scale
    mesh.scale.set(...plant.scale)
    mesh.rotation.x = mesh.rotation.x + (Math.PI / 2);
    mesh = setCurrentTransformationAsDefault(mesh);    

    mesh.layers.set(LayerEnum.Plants);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
        selectable: true,
        onSelect: () => eventBus.emit(EventEnums.PLANT_SELECTED, true),
        onDeselect: () => eventBus.emit(EventEnums.PLANT_SELECTED, false),
        editableFields: {
			name: true,
			position: true,
		}
    };
    mesh.name = plant.name;

    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);

    let newPos = mesh.position.add(new THREE.Vector3(0,0,size.z / 2))
    mesh.position.set(...newPos)

    editor.execute(new CreateObjectCommand(mesh, editor))

    return mesh
}

export function loadPlant(plant: Plant, editor: Editor) {
    loader.load(
        plant.model_path,
        ( gltf ) => { createPlantObject(editor, gltf, plant) },
        ( xhr ) => { console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' ); },
        ( error ) => { console.log( 'An error happened' );}
    );
}