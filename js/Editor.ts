import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { requestRenderIfNotRequested } from './Rendering';
import { Command } from './commands/Command';
import { Selector } from './Selector';
import { EditorMode, LayerEnums} from './Constants';
import { BedEditor } from './BedEditor';

const SHADOWMAP_WIDTH = 32;
const SHADOWMAP_RESOLUTION = 1024;
const ANTI_ALIASING = true;

class Editor {
    /**
     * Holds all of our important Three.js instance stuff. We should try to move as much out of here as possible to avoid creating a 
     * "God" object
     */

    canvas: HTMLCanvasElement
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    cameraControls: MapControls
    transformControls: TransformControls

    directionalLight: THREE.DirectionalLight

    commandStack: Command[];

    objectMap: { [key: string]: THREE.Object3D };

    selector: Selector;
    bedEditor: BedEditor;

    mode: EditorMode;


    constructor () {
        this.commandStack = [];
        this.objectMap = {};
        this.selector = new Selector(this);
        this.bedEditor = new BedEditor(this);
        this.mode = EditorMode.OBJECT;
    }

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
    
        // renderer.outputEncoding = THREE.sRGBEncoding;
        // renderer.toneMapping = THREE.ACESFilmicToneMapping;
        // renderer.toneMappingExposure = 1.0;
        this.renderer.shadowMap.enabled = true;
    
        // scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0xEBE2DB, 0.00003);
    
    
        // camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 5, 2000000);
        this.camera.name = "Camera"
        this.camera.position.set(0, 20, 20);
        this.camera.up.set(0, 0, 1);
        this.camera.lookAt(0, 0, 0);
        this.camera.layers.enableAll();
    
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
        this.scene.name = "Scene"
    
        // Shadow properties
        // https://threejs.org/docs/index.html#api/en/lights/shadows/DirectionalLightShadow

        // Prevent shadow acne artifacts
        // https://mofu-dev.com/en/blog/threejs-shadow-map/
        this.directionalLight.shadow.bias = -0.001;
        this.directionalLight.shadow.mapSize.width = SHADOWMAP_RESOLUTION; // default
        this.directionalLight.shadow.mapSize.height = SHADOWMAP_RESOLUTION; // default
        this.directionalLight.shadow.camera.near = 0.5; // default
        this.directionalLight.shadow.camera.far = 500; // default
    
        this.directionalLight.shadow.camera.left = -SHADOWMAP_WIDTH;
        this.directionalLight.shadow.camera.right = SHADOWMAP_WIDTH;
        this.directionalLight.shadow.camera.top = -SHADOWMAP_WIDTH;
        this.directionalLight.shadow.camera.bottom = SHADOWMAP_WIDTH;

        this.directionalLight.name = "Directional Light";
    
        const ambient = new THREE.AmbientLight(white, 0.5);
        ambient.name = "Ambient Light"
        this.scene.add(ambient);
    
        const axesHelper = new THREE.AxesHelper(10);
        axesHelper.layers.set(LayerEnums.NoRaycast)
        axesHelper.position.set(0, 0, 0.003)
        axesHelper.name = "Axes Helper"
        this.scene.add(axesHelper);
    
        // Grid Helper
        const size = 64
        const gridHelper = new THREE.GridHelper(size, size, 0x444444, 0x999999);
        gridHelper.layers.set(LayerEnums.NoRaycast)
        gridHelper.rotateX(Math.PI / 2)
        gridHelper.position.set(0, 0, 0.001)
        gridHelper.name = "Grid Helper"
        this.scene.add(gridHelper);
    
        this.scene.background = new THREE.Color(white);
    

        this.cameraControls.addEventListener('change', () => requestRenderIfNotRequested(this))

        // TODO: move transform controls from editor to Selector
        this.transformControls = new TransformControls( this.camera, this.canvas );
        this.transformControls.addEventListener( 'change', () => requestRenderIfNotRequested(this) );    
    }

    public add(object?: THREE.Object3D) {
        if (object === undefined) {
            return
        }
        this.objectMap[object.uuid] = object;
        this.scene.add(object)
        // TODO: properly update the rest of the application
    }

    public remove(object?: THREE.Object3D) {
        if (object === undefined) {
            return
        }
        this.scene.remove(object);
        delete this.objectMap[object.uuid];
    }

    public selectByUUID(uuid: string) {
        if (this.objectMap.hasOwnProperty(uuid)) {
            this.selector.select(this.objectMap[uuid]);
        }
    }

    public execute(command: Command) {

        if (this.commandStack.length == 0) {
            command.execute();
            this.commandStack.push(command)
        } else {
            let lastCommand = this.commandStack[this.commandStack.length - 1];
            // Update if same type of command
            if (lastCommand.canUpdate(command)) {
                lastCommand.update(command);
                lastCommand.execute()
            } else { // else just push
                command.execute()
                this.commandStack.push(command)
            }
        }

    }

    public undo() {
        const command = this.commandStack.pop();
        command?.undo();
    }

    public setBedMode() {
        this.selector.deselect();
        this.mode = EditorMode.BED;
    }

    public setObjectMode() {
        this.selector.deselect();
        this.mode = EditorMode.OBJECT;
    }


}
export {Editor};