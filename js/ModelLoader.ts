import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Plant } from './widgets/Plants';
import { Editor } from './Editor';
import * as THREE from 'three';
import { LayerEnum } from './Constants';
import { CreateObjectCommand } from './commands/CreateObjectCommand';
import { EventEnums } from './EventBus';

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
    mesh = setCurrentTransformationAsDefault(mesh);    

    mesh.layers.set(LayerEnum.Plants);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
        selectable: true,
        selectionEnum: EventEnums.PLANT_SELECTED,
        editableFields: {
			name: true,
			position: true,
            height: true,
            radius: true,
            visible: true
		}
    };
    mesh.name = plant.name;

    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);

    let newPos = editor.currentCameraControls.target.clone();
    newPos.add(new THREE.Vector3(0,size.y / 2,0))
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
