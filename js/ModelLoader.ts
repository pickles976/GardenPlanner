import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// const loader = new OBJLoader();
const loader = new GLTFLoader();

export function load_mesh(filepath, editor, callback) {
    loader.load(
        filepath,
        ( object ) => { callback(editor, object) },
        ( xhr ) => { console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' ); },
        ( error ) => { console.log( 'An error happened' );}
);
}