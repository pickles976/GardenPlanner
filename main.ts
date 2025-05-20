import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';

export class ThreeInstance {
    /**
     * Container for all the components of Three.js that allow us to render and control the scene.
     */
    canvas: HTMLCanvasElement;
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: MapControls;
    directionalLight: THREE.DirectionalLight;

    constructor(
        canvas: HTMLCanvasElement,
        renderer: THREE.WebGLRenderer,
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        controls: MapControls,
        directionalLight: THREE.DirectionalLight) {
        this.canvas = canvas;
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.controls = controls;
        this.directionalLight = directionalLight;
    }
}

const SHADOWMAP_WIDTH = 32;
const SHADOWMAP_RESOLUTION = 512;
const ANTI_ALIASING = true;

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


function initThree(): ThreeInstance {

    // renderer
    let renderer = new THREE.WebGLRenderer({
        logarithmicDepthBuffer: true,
        antialias: ANTI_ALIASING
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    let canvas = document.body.appendChild(renderer.domElement);

    // renderer.outputEncoding = THREE.sRGBEncoding;
    // renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;

    // scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xEBE2DB, 0.00003);


    // camera
    let camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 5, 2000000);
    camera.position.set(0, 20, 20);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);

    // map orbit
    let orbit = new MapControls(camera, canvas)
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

    const axesHelper = new THREE.AxesHelper(10);
    axesHelper.position.set(0, 0, 0.003)
    scene.add(axesHelper);

    // Grid Helper
    const size = 64
    const gridHelper = new THREE.GridHelper(size, size, 0x444444, 0x999999);
    gridHelper.rotateX(Math.PI / 2)
    gridHelper.position.set(0, 0, 0.001)
    scene.add(gridHelper);

    scene.background = new THREE.Color(white);

    return new ThreeInstance(canvas, renderer, scene, camera, orbit, directionalLight);

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

let time = 0;

async function render(threeInstance: ThreeInstance) {

    time *= 0.001;  // convert to seconds;

    const renderer = threeInstance.renderer;
    const scene = threeInstance.scene;
    const camera = threeInstance.camera;
    const controls = threeInstance.controls;

    // pickHelper.pick(pickPosition, scene, camera, time);


    // TODO: move this elsewhere
    // const directionalLight = threeInstance.directionalLight;

    // const time = Date.now() * 0.0005;
    // directionalLight.position.x = Math.sin(time * 0.7) * 20;
    // directionalLight.position.z = Math.abs(Math.cos(time * 0.7) * 20);

    controls.update()

    pickHelper.pick(pickPosition, scene, camera, time);

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
    requestAnimationFrame(() => render(threeInstance))

}

class PickHelper {

    raycaster: THREE.Raycaster
    pickedObject?: THREE.Mesh
    pickedObjectSavedColor: number

    constructor() {
        this.raycaster = new THREE.Raycaster();
        this.pickedObject = null;
        this.pickedObjectSavedColor = 0;
    }
    pick(normalizedPosition, scene, camera, time) {
        // restore the color if there is a picked object
        if (this.pickedObject) {
            this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
            this.pickedObject = undefined;
        }

        // cast a ray through the frustum
        this.raycaster.setFromCamera(normalizedPosition, camera);
        // get the list of objects the ray intersected
        const intersectedObjects = this.raycaster.intersectObjects(scene.children);
        if (intersectedObjects.length) {
            // pick the first object. It's the closest one
            this.pickedObject = intersectedObjects[0].object;

            if (this.pickedObject.material.emissive === undefined) {
                this.pickedObject = undefined;
                return
            }

            // save its color
            this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
            // set its emissive color to flashing red/yellow
            this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
        }
    }
}

const pickPosition = { x: 0, y: 0 };
clearPickPosition();

function getCanvasRelativePosition(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * canvas.width / rect.width,
        y: (event.clientY - rect.top) * canvas.height / rect.height,
    };
}

function setPickPosition(event, canvas) {
    const pos = getCanvasRelativePosition(event, canvas);
    pickPosition.x = (pos.x / canvas.width) * 2 - 1;
    pickPosition.y = (pos.y / canvas.height) * -2 + 1;  // note we flip Y
}

function clearPickPosition() {
    // unlike the mouse which always has a position
    // if the user stops touching the screen we want
    // to stop picking. For now we just pick a value
    // unlikely to pick something
    pickPosition.x = -100000;
    pickPosition.y = -100000;
}

const threeInstance = initThree()
const pickHelper = new PickHelper();

window.addEventListener('mousemove', (event) => setPickPosition(event, threeInstance.canvas));
window.addEventListener('mouseout', clearPickPosition);
window.addEventListener('mouseleave', clearPickPosition);

createGround(threeInstance.scene)
let box = createMoveableCube(threeInstance.scene)
box.position.set(0, 0, 2)

let torus = createMoveableTorus(threeInstance.scene)
torus.position.set(3, 3, 2)

requestAnimationFrame(() => render(threeInstance))