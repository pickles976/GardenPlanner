import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { requestRenderIfNotRequested } from './Rendering';

const SHADOWMAP_WIDTH = 32;
const SHADOWMAP_RESOLUTION = 1024;
const ANTI_ALIASING = true;

class Editor {

    canvas: HTMLCanvasElement
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    cameraControls: THREE.MapControls
    transformControls: THREE.TransformControls
    raycaster: THREE.Raycaster

    directionalLight: THREE.DirectionalLight

    public initThree() {
    
        // renderer
        this.renderer = new THREE.WebGLRenderer({
            logarithmicDepthBuffer: true,
            antialias: ANTI_ALIASING
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        console.log(this.renderer)

        // TODO: only one canvas?
        this.canvas = document.body.appendChild(this.renderer.domElement);
    
        this.raycaster = new THREE.Raycaster();
    
        // renderer.outputEncoding = THREE.sRGBEncoding;
        // renderer.toneMapping = THREE.ACESFilmicToneMapping;
        // renderer.toneMappingExposure = 1.0;
        this.renderer.shadowMap.enabled = true;
    
        // scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0xEBE2DB, 0.00003);
    
    
        // camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 5, 2000000);
        this.camera.position.set(0, 20, 20);
        this.camera.up.set(0, 0, 1);
        this.camera.lookAt(0, 0, 0);
    
        // map orbit
        this.cameraControls = new MapControls(this.camera, this.canvas)
        this.cameraControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        this.cameraControls.dampingFactor = 0.05;
        this.cameraControls.screenSpacePanning = false;
        this.cameraControls.minDistance = 10;
        this.cameraControls.maxDistance = 16384;
        this.cameraControls.maxPolarAngle = (Math.PI / 2) - (Math.PI / 360)

    
        // TODO: split this out into a lighting object
        // lighting
        const white = 0xFFFFFF;
        const intensity = 1.0;
        this.directionalLight = new THREE.DirectionalLight(white, intensity);
        this.directionalLight.position.set(-20, 20, 20);
        this.directionalLight.castShadow = true;
        this.scene.add(this.directionalLight);
    
        // Shadow properties
        // https://threejs.org/docs/index.html#api/en/lights/shadows/DirectionalLightShadow
        this.directionalLight.shadow.mapSize.width = SHADOWMAP_RESOLUTION; // default
        this.directionalLight.shadow.mapSize.height = SHADOWMAP_RESOLUTION; // default
        this.directionalLight.shadow.camera.near = 0.5; // default
        this.directionalLight.shadow.camera.far = 500; // default
    
        this.directionalLight.shadow.camera.left = -SHADOWMAP_WIDTH;
        this.directionalLight.shadow.camera.right = SHADOWMAP_WIDTH;
    
        const ambient = new THREE.AmbientLight(white, 0.5);
        this.scene.add(ambient);
    
        const axesHelper = new THREE.AxesHelper(10);
        axesHelper.position.set(0, 0, 0.003)
        this.scene.add(axesHelper);
    
        // Grid Helper
        const size = 64
        const gridHelper = new THREE.GridHelper(size, size, 0x444444, 0x999999);
        gridHelper.rotateX(Math.PI / 2)
        gridHelper.position.set(0, 0, 0.001)
        this.scene.add(gridHelper);
    
        this.scene.background = new THREE.Color(white);
    
        this.transformControls = new TransformControls( this.camera, this.renderer.domElement );

        this.cameraControls.addEventListener('change', () => requestRenderIfNotRequested(this))
        this.transformControls.addEventListener( 'change', () => requestRenderIfNotRequested(this) );
        this.transformControls.addEventListener( 'dragging-changed', function ( event ) {
    
            this.cameraControls.enabled = ! event.value;
    
        } );
    
    }

}
export {Editor};