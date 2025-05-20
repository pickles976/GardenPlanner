import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';

const SHADOWMAP_WIDTH = 32;
const SHADOWMAP_RESOLUTION = 512;
const ANTI_ALIASING = true;

let canvas, renderer, camera, orbit

function createGround(scene) {
    
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

function createMoveableCube(scene) {
    const boxMat = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD,
    })
    const boxGeo = new THREE.BoxGeometry(2,2,2);
    const boxMesh = new THREE.Mesh(boxGeo, boxMat)
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    scene.add(boxMesh)
    return boxMesh
}

function createMoveableTorus(scene) {
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


function initThree() {

    // renderer
    renderer = new THREE.WebGLRenderer({
        logarithmicDepthBuffer: true,
        antialias: ANTI_ALIASING
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    let canvas = document.body.appendChild( renderer.domElement );

    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    renderer.shadowMap.enabled = true;

    // scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xEBE2DB, 0.00003);


    // camera
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 5, 2000000 );
    camera.position.set(0, 20, 20);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);

    // map orbit
    orbit = new MapControls(camera, canvas)
    orbit.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    orbit.dampingFactor = 0.05;
    orbit.screenSpacePanning = false;
    orbit.minDistance = 10;
    orbit.maxDistance = 16384;
    orbit.maxPolarAngle = (Math.PI / 2) - (Math.PI / 360)

    // lighting
    const white = 0xFFFFFF;
    const intensity = 1.0;
    const directionalLight = new THREE.DirectionalLight(white, intensity);
    directionalLight.position.set(-20, 20, 20);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Shadow properties
    // https://threejs.org/docs/index.html#api/en/lights/shadows/DirectionalLightShadow
    directionalLight.shadow.mapSize.width = SHADOWMAP_RESOLUTION; // default
    directionalLight.shadow.mapSize.height = SHADOWMAP_RESOLUTION; // default
    directionalLight.shadow.camera.near = 0.5; // default
    directionalLight.shadow.camera.far = 500; // default
    // directionalLight.shadow.camera.bottom = -1;

    directionalLight.shadow.camera.left = -SHADOWMAP_WIDTH;
    directionalLight.shadow.camera.right = SHADOWMAP_WIDTH;

    const ambient = new THREE.AmbientLight(white, 0.5);
    scene.add(ambient);

    const axesHelper = new THREE.AxesHelper( 10 );
    axesHelper.position.set(0, 0, 0.003)
    scene.add( axesHelper );

    // Grid Helper
    const size = 64
    const gridHelper = new THREE.GridHelper( size, size, 0x444444, 0x999999);
    gridHelper.rotateX(Math.PI / 2)
    gridHelper.position.set(0, 0, 0.001)
    scene.add( gridHelper );

    scene.background = new THREE.Color(white);

    return scene

}

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
}

async function render() {

    orbit.update()

    // fix buffer size
    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }

    // fix aspect ratio
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
   

    renderer.render(scene, camera);
    requestAnimationFrame(render)

}

let scene = initThree()

createGround(scene)
let box = createMoveableCube(scene)
box.position.set(0, 0, 2)

let torus = createMoveableTorus(scene)
torus.position.set(3, 3, 2)

requestAnimationFrame(render)