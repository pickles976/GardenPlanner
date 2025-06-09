import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { requestRenderIfNotRequested } from './Rendering';
import { Command } from './commands/Command';
import { Selector } from './Selector';
import { EditorMode, FRUSTUM_SIZE, LayerEnums} from './Constants';
import { BedEditor } from './BedEditor';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CommandStack } from './CommandStack';
import { eventBus, EventEnums } from './EventBus';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { WHITE } from './Colors';


const SHADOWMAP_WIDTH = 32;
const SHADOWMAP_RESOLUTION = 1024;
const ANTI_ALIASING = true;

const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;

class Editor {
    /**
     * Holds all of our important Three.js instance stuff. We should try to move as much out of here as possible to avoid creating a 
     * "God" object
     */

    canvas: HTMLCanvasElement
    renderer: THREE.WebGLRenderer
    labelRenderer: CSS2DRenderer
    scene: THREE.Scene

    currentCamera: THREE.Camera
    perspectiveCamera: THREE.PerspectiveCamera
    orthoCamera: THREE.OrthographicCamera
    perspectiveCameraControls: MapControls
    orthoCameraControls: OrbitControls

    currentCameraControls: Object

    transformControls: TransformControls

    directionalLight: THREE.DirectionalLight

    commandStack: CommandStack;

    objectMap: { [key: string]: THREE.Object3D };

    selector: Selector;
    bedEditor: BedEditor;

    mode: EditorMode;


    constructor () {
        this.commandStack = new CommandStack();
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


        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize( window.innerWidth, window.innerHeight );
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none'; // don't want any events coming from the CSS renderer guy
        document.body.appendChild( this.labelRenderer.domElement );
    
        // renderer.outputEncoding = THREE.sRGBEncoding;
        // renderer.toneMapping = THREE.ACESFilmicToneMapping;
        // renderer.toneMappingExposure = 1.0;
        this.renderer.shadowMap.enabled = true;
    
        // scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0xEBE2DB, 0.00003);
    
    
        // Perspective Camera
        const aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

        this.perspectiveCamera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000000);
        this.perspectiveCamera.name = "Perspective Camera"
        this.perspectiveCamera.position.set(0, 5, 5);
        this.perspectiveCamera.up.set(0, 0, 1);
        this.perspectiveCamera.lookAt(0, 0, 0);
        this.perspectiveCamera.layers.enableAll();

        // Map Controls
        this.perspectiveCameraControls = new MapControls(this.perspectiveCamera, this.canvas)
        this.perspectiveCameraControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        this.perspectiveCameraControls.dampingFactor = 0.05;
        this.perspectiveCameraControls.screenSpacePanning = false;
        this.perspectiveCameraControls.minDistance = 1;
        this.perspectiveCameraControls.maxDistance = 16384;
        this.perspectiveCameraControls.maxPolarAngle = (Math.PI / 2) - (Math.PI / 360)

        // Orthographic Camera https://threejs.org/docs/#api/en/cameras/OrthographicCamera
        this.orthoCamera = new THREE.OrthographicCamera(FRUSTUM_SIZE * aspect / - 2, FRUSTUM_SIZE * aspect / 2, FRUSTUM_SIZE / 2, FRUSTUM_SIZE / - 2, 0.01, 1000 );
        this.orthoCamera.name = "Ortho Camera"
        this.orthoCamera.position.set(0, 0, 5);
        this.orthoCamera.up.set(0, 0, 1);
        this.orthoCamera.lookAt(0, 0, 0);
        this.orthoCamera.rotateZ(-Math.PI / 2)
        this.orthoCamera.layers.enableAll();

        // Orbit Controls https://threejs.org/docs/#examples/en/controls/OrbitControls.keys
        this.orthoCameraControls = new OrbitControls( this.orthoCamera, this.canvas );
        this.orthoCameraControls.enableDamping = false; // an animation loop is required when either damping or auto-rotation are enabled
        this.orthoCameraControls.screenSpacePanning = false;
        this.orthoCameraControls.minDistance = 1;
        this.orthoCameraControls.maxDistance = 16384;
        this.orthoCameraControls.enableRotate = false
        this.orthoCameraControls.listenToKeyEvents( window ); // optional

        this.orthoCameraControls.keys = {
            LEFT: 'KeyA',
            UP: 'KeyW', 
            RIGHT: 'KeyD', 
            BOTTOM: 'KeyS' 
        }

        this.currentCamera = this.perspectiveCamera
        this.currentCameraControls = this.perspectiveCameraControls
    


    
        // TODO: split this out into a lighting object
        // lighting
        const intensity = 1.0;
        this.directionalLight = new THREE.DirectionalLight(WHITE, intensity);
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
    
        const ambient = new THREE.AmbientLight(WHITE, 0.5);
        ambient.name = "Ambient Light"
        this.scene.add(ambient);
    
        const axesHelper = new THREE.AxesHelper(10);
        axesHelper.layers.set(LayerEnums.NoRaycast)
        axesHelper.position.set(0, 0, 0.003)
        axesHelper.name = "Axes Helper"
        this.scene.add(axesHelper);
    
        // Grid Helper
        let size = 64
        const meterGrid = new THREE.GridHelper(size, size, WHITE, WHITE);
        meterGrid.layers.set(LayerEnums.NoRaycast)
        meterGrid.rotateX(Math.PI / 2)
        meterGrid.position.set(0, 0, 0.002)
        meterGrid.name = "Grid Helper"
        this.scene.add(meterGrid);

        // TODO: pull these out
        size = 64
        const decimeterGrid = new THREE.GridHelper(size, size * 10, 0x555555, 0xAAAAAA);
        decimeterGrid.layers.set(LayerEnums.NoRaycast)
        decimeterGrid.rotateX(Math.PI / 2)
        decimeterGrid.position.set(0, 0, 0.001)
        decimeterGrid.name = "Grid Helper"
        this.scene.add(decimeterGrid);
    
        this.scene.background = new THREE.Color(WHITE);
    

        this.perspectiveCameraControls.addEventListener('change', () => requestRenderIfNotRequested(this))
        this.orthoCameraControls.addEventListener('change', () => requestRenderIfNotRequested(this))

        // TODO: move transform controls from editor to Selector
        this.transformControls = new TransformControls( this.perspectiveCamera, this.canvas );
        this.transformControls.addEventListener( 'change', () => requestRenderIfNotRequested(this) );  

        eventBus.on(EventEnums.BED_EDITING_STARTED, () => this.setBedMode())
        eventBus.on(EventEnums.BED_EDITING_FINISHED, () => this.bedEditor.createMesh())
        eventBus.on(EventEnums.BED_EDITING_CANCELLED, () => this.setObjectMode())
    }

    public setOrthoCamera() {
        this.currentCamera = this.orthoCamera;
        this.currentCameraControls = this.orthoCameraControls
        this.perspectiveCameraControls.enabled = false
        this.orthoCameraControls.enabled = true
    }

    public setPerspectiveCamera() {
        this.currentCamera = this.perspectiveCamera
        this.currentCameraControls = this.perspectiveCameraControls
        this.perspectiveCameraControls.enabled = true
        this.orthoCameraControls.enabled = false
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

        this.commandStack.execute(command);

    }

    public undo() {
        this.commandStack.undo();
    }

    public setBedMode() {
        this.selector.deselect();
        this.mode = EditorMode.BED;
        this.setOrthoCamera()
        this.bedEditor.createNewBed(); // TODO: change htis method name
    }

    public setObjectMode() {
        this.selector.deselect();
        this.mode = EditorMode.OBJECT;
        this.setPerspectiveCamera()
        this.bedEditor.cleanUp();
    }

    public handleKeyDown(event) {
        switch ( event.key ) {

            case 't':
                this.transformControls.setMode( 'translate' );
                break;

            case 'r':
                this.transformControls.setMode( 'rotate' );
                break;

            case 's':
                this.transformControls.setMode( 'scale' );
                break;

            case '+':
            case '=':
                this.transformControls.setSize( this.transformControls.size + 0.1 );
                break;

            case '-':
            case '_':
                this.transformControls.setSize( Math.max( this.transformControls.size - 0.1, 0.1 ) );
                break;

            case 'x':
                this.transformControls.showX = ! this.transformControls.showX;
                break;

            case 'y':
                this.transformControls.showY = ! this.transformControls.showY;
                break;

            case 'z':

                if (event.ctrlKey) {
                    this.undo();
                } else {
                    this.transformControls.showZ = ! this.transformControls.showZ;
                }

                break;

            case ' ':
                this.transformControls.enabled = ! this.transformControls.enabled;
                break;

            case 'Escape':
                this.selector.deselect();
                break;

        }
    }


}
export {Editor};