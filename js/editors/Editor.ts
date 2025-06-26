import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { requestRenderIfNotRequested } from '../Rendering';
import { Command } from '../commands/Command';
import { Selector } from '../Selector';
import { FONT_SIZE, FRUSTUM_SIZE, LayerEnum } from '../Constants';
import { BedEditor } from './BedEditor';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CommandStack } from '../CommandStack';
import { eventBus, EventEnums } from '../EventBus';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { WHITE } from '../Colors';
import { handleTransformControlsChange, processIntersections } from '../EventHandlers';
import { snapper } from '../Snapping';
import { DeleteObjectCommand } from '../commands/DeleteObjectCommand';
import { CreateObjectCommand } from '../commands/CreateObjectCommand';
import { deepClone, destructureVector3Array, fontSizeString, getCSS2DText } from '../Utils';
import { SetRotationCommand } from '../commands/SetRotationCommand';
import { RulerEditor } from './RulerEditor';
import { FenceEditor } from './FenceEditor';
import { PathEditor } from './PathEditor';
import { Vector3 } from 'three';

import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { Group } from 'three';


const SHADOWMAP_WIDTH = 32;
const SHADOWMAP_RESOLUTION = 2048;
const ANTI_ALIASING = true;

const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;

const ROTATION_DEGREES = 0.008726639;
const ORBIT_CONTROLS_PAN_SPEED = 20.0;

enum EditorMode {
    NONE = "NONE",
    OBJECT = "OBJECT",
    BED = "BED",
    FENCE = "FENCE",
    PATH = "PATH",
    RULER = "RULER",
    PLANT = "PLANT"
}

const LINE_WIDTH = 5;

function createLinePreview(startPoint: Vector3, endPoint: Vector3) : Line2 {

    // Get Distance Text
    let textPos = startPoint.clone().add(endPoint.clone()).divideScalar(2);
    const lineLabel = getCSS2DText(snapper.getText(startPoint.distanceTo(endPoint)), fontSizeString(FONT_SIZE));
    lineLabel.position.set(...textPos)

    const geometry = new LineGeometry();
    geometry.setPositions(destructureVector3Array([startPoint, endPoint]))
    const material = new LineMaterial({ color: WHITE, linewidth: LINE_WIDTH, depthWrite: false, depthTest: false });
    const linePreview = new Line2(geometry, material);
    linePreview.renderOrder = 100000; // Always draw on top

    const group = new Group();
    group.add(linePreview);
    group.add(lineLabel);

    return group;
}

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
    fenceEditor: FenceEditor;
    pathEditor: PathEditor;

    mode: EditorMode;

    rulerStart?: Vector3;
    linePreview?: Line2;

    constructor() {
        this.commandStack = new CommandStack();
        this.objectMap = {};
        this.selector = new Selector(this);
        this.bedEditor = new BedEditor(this);
        this.fenceEditor = new FenceEditor(this);
        this.pathEditor = new PathEditor(this);
        this.mode = EditorMode.OBJECT;

        this.rulerStart = undefined;
    }

    public initThree() {

        // renderer
        this.renderer = new THREE.WebGLRenderer({
            logarithmicDepthBuffer: true,
            antialias: ANTI_ALIASING
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // TODO: only one canvas?
        this.canvas = document.body.appendChild(this.renderer.domElement);

        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none'; // don't want any events coming from the CSS renderer guy
        document.body.appendChild(this.labelRenderer.domElement);

        // renderer.outputEncoding = THREE.sRGBEncoding;
        // renderer.toneMapping = THREE.ACESFilmicToneMapping;
        // renderer.toneMappingExposure = 1.0;
        this.renderer.shadowMap.enabled = true;

        // scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0xEBE2DB, 0.00003);


        // Perspective Camera
        const aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

        this.perspectiveCamera = new THREE.PerspectiveCamera(60, aspect, 0.01, 2000000);
        this.perspectiveCamera.name = "Perspective Camera"
        this.perspectiveCamera.position.set(0, -1, 1);
        this.perspectiveCamera.up.set(0, 0, 1);
        this.perspectiveCamera.lookAt(0, 0, 0);
        this.perspectiveCamera.layers.enableAll();

        // Map Controls
        this.perspectiveCameraControls = new MapControls(this.perspectiveCamera, this.canvas)
        this.perspectiveCameraControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        this.perspectiveCameraControls.dampingFactor = 0.05;
        this.perspectiveCameraControls.screenSpacePanning = false;
        this.perspectiveCameraControls.minDistance = 0.1;
        this.perspectiveCameraControls.maxDistance = 16384;
        this.perspectiveCameraControls.maxPolarAngle = (Math.PI / 2) - (Math.PI / 360)

        // Orthographic Camera https://threejs.org/docs/#api/en/cameras/OrthographicCamera
        this.orthoCamera = new THREE.OrthographicCamera(FRUSTUM_SIZE * aspect / - 2, FRUSTUM_SIZE * aspect / 2, FRUSTUM_SIZE / 2, FRUSTUM_SIZE / - 2, 0.01, 1000);
        this.orthoCamera.name = "Ortho Camera"
        this.orthoCamera.position.set(0, 0, 1);
        this.orthoCamera.up.set(0, 0, 1);
        this.orthoCamera.lookAt(0, 0, 0);
        this.orthoCamera.rotateZ(-Math.PI / 2)
        this.orthoCamera.layers.enableAll();

        // // TODO: CAMERA LAYERS CONFIG
        // this.orthoCamera.layers.disable(LayerEnum.Plants)

        // Orbit Controls https://threejs.org/docs/#examples/en/controls/OrbitControls.keys
        this.orthoCameraControls = new OrbitControls(this.orthoCamera, this.canvas);
        this.orthoCameraControls.enableDamping = false; // an animation loop is required when either damping or auto-rotation are enabled
        this.orthoCameraControls.screenSpacePanning = false;
        this.orthoCameraControls.minDistance = 0.1;
        this.orthoCameraControls.maxDistance = 16384;
        this.orthoCameraControls.enableRotate = false
        this.orthoCameraControls.listenToKeyEvents(window); // optional
        this.orthoCameraControls.keyPanSpeed = ORBIT_CONTROLS_PAN_SPEED;

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
        const intensity = 1.5;
        this.directionalLight = new THREE.DirectionalLight(WHITE, intensity);
        this.directionalLight.position.set(-20, 20, 20);
        this.directionalLight.castShadow = true;
        this.scene.add(this.directionalLight);
        this.scene.name = "Scene"

        // Shadow properties
        // https://threejs.org/docs/index.html#api/en/lights/shadows/DirectionalLightShadow

        // Prevent shadow acne artifacts
        // https://mofu-dev.com/en/blog/threejs-shadow-map/
        this.directionalLight.shadow.bias = -0.0001;
        this.directionalLight.shadow.normalBias = 0.1;

        // size of the map
        this.directionalLight.shadow.camera.left = -SHADOWMAP_WIDTH;
        this.directionalLight.shadow.camera.right = SHADOWMAP_WIDTH;
        this.directionalLight.shadow.camera.top = -SHADOWMAP_WIDTH;
        this.directionalLight.shadow.camera.bottom = SHADOWMAP_WIDTH;

        // map resolution
        this.directionalLight.shadow.mapSize.width = SHADOWMAP_RESOLUTION;
        this.directionalLight.shadow.mapSize.height = SHADOWMAP_RESOLUTION;
        this.directionalLight.shadow.camera.near = 0.5; // default
        this.directionalLight.shadow.camera.far = 500; // default
        this.directionalLight.shadow.radius = 1.5; // blur shadows



        this.directionalLight.name = "Directional Light";

        const ambient = new THREE.AmbientLight(WHITE, 0.25);
        ambient.name = "Ambient Light"
        this.scene.add(ambient);

        const axesHelper = new THREE.AxesHelper(10);
        axesHelper.layers.set(LayerEnum.NoRaycast)
        axesHelper.position.set(0, 0, 0.003)
        axesHelper.name = "Axes Helper"
        this.scene.add(axesHelper);

        this.scene.background = new THREE.Color(WHITE);

        this.perspectiveCameraControls.addEventListener('change', () => requestRenderIfNotRequested(this))
        this.orthoCameraControls.addEventListener('change', () => requestRenderIfNotRequested(this))

        this.transformControls = new TransformControls(this.currentCamera, this.canvas);
        this.transformControls.addEventListener('change', () => {
            handleTransformControlsChange(this);
            requestRenderIfNotRequested(this);
        });
        this.setSnapping(snapper.snapEnabled)

        eventBus.on(EventEnums.BED_CREATION_STARTED, () => this.setBedMode())
        eventBus.on(EventEnums.BED_EDITING_CANCELLED, () => this.setObjectMode())
        eventBus.on(EventEnums.BED_EDITING_FINISHED, () => this.setObjectMode())
        eventBus.on(EventEnums.BED_EDITING_STARTED, (bed) => this.setBedMode(bed))

        eventBus.on(EventEnums.FENCE_CREATION_STARTED, () => this.setFenceMode())
        eventBus.on(EventEnums.FENCE_EDITING_CANCELLED, () => this.setObjectMode())
        eventBus.on(EventEnums.FENCE_EDITING_FINISHED, () => this.setObjectMode())
        eventBus.on(EventEnums.FENCE_EDITING_STARTED, (fence) => this.setFenceMode(fence))

        eventBus.on(EventEnums.PATH_CREATION_STARTED, () => this.setPathMode())
        eventBus.on(EventEnums.PATH_EDITING_CANCELLED, () => this.setObjectMode())
        eventBus.on(EventEnums.PATH_EDITING_FINISHED, () => this.setObjectMode())
        eventBus.on(EventEnums.PATH_EDITING_STARTED, (path) => this.setPathMode(path))

        eventBus.on(EventEnums.SNAP_CHANGED, (value) => this.setSnapping(value))
        eventBus.on(EventEnums.CAMERA_CHANGED, (value) => value ? this.setOrthoCamera() : this.setPerspectiveCamera())
    }

    private setSnapping(value: boolean) {
        if (value) {
            this.transformControls.setRotationSnap(ROTATION_DEGREES * 2);
            this.transformControls.setTranslationSnap(snapper.metric ? 0.1 : snapper.inchesToMeters(1));

        } else {
            this.transformControls.setRotationSnap(null);
            this.transformControls.setTranslationSnap(null);
        }
    }

    public setOrthoCamera() {
        this.currentCamera = this.orthoCamera;
        this.currentCameraControls = this.orthoCameraControls
        this.perspectiveCameraControls.enabled = false
        this.orthoCameraControls.enabled = true
        this.transformControls.camera = this.currentCamera;
        eventBus.emit(EventEnums.REQUEST_RENDER)
    }

    public setPerspectiveCamera() {
        this.currentCamera = this.perspectiveCamera
        this.currentCameraControls = this.perspectiveCameraControls
        this.perspectiveCameraControls.enabled = true
        this.orthoCameraControls.enabled = false
        this.transformControls.camera = this.currentCamera;
        eventBus.emit(EventEnums.REQUEST_RENDER)
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

        if (object instanceof THREE.Group) {
            object.traverse((child) => {
                if (child instanceof CSS2DObject) {
                    if (child.element && child.element.parentNode) {
                        child.element.parentNode.removeChild(child.element);
                    }
                }
            });
        }

        this.scene.remove(object);
        delete this.objectMap[object.uuid];
    }

    public selectByUUID(uuid: string) {
        if (this.objectMap.hasOwnProperty(uuid)) {
            this.selector.select(this.objectMap[uuid]);
        }
    }

    public focusByUUID(uuid: string) {
        if (this.objectMap.hasOwnProperty(uuid)) {
            const object = this.objectMap[uuid];
            this.perspectiveCamera.position.set(...(object.position.clone().add(new THREE.Vector3(0, -2, 1))));
            this.perspectiveCameraControls.target.copy(object.position);
            this.perspectiveCameraControls.update();
            eventBus.emit(EventEnums.REQUEST_RENDER)
        }
    }

    public execute(command: Command) {
        this.commandStack.execute(command);
    }

    public undo() {
        this.commandStack.undo();
    }

    public setBedMode(bed?: THREE.Object3D) {
        this.mode = EditorMode.BED;
        this.setOrthoCamera()
        eventBus.emit(EventEnums.CHANGE_CAMERA_UI, true) // change UI
        this.bedEditor.beginBedEditing(bed);
        this.selector.deselect();
        this.hideCameraLayers([LayerEnum.Plants, LayerEnum.Objects])
    }

    public setFenceMode(fence?: THREE.Object3D) {
        this.mode = EditorMode.FENCE;
        this.setOrthoCamera()
        eventBus.emit(EventEnums.CHANGE_CAMERA_UI, true)
        this.fenceEditor.beginFenceEditing(fence);
        this.selector.deselect();
    }

    public setPathMode(path?: THREE.Object3D) {
        this.mode = EditorMode.PATH;
        this.setOrthoCamera()
        eventBus.emit(EventEnums.CHANGE_CAMERA_UI, true)
        this.pathEditor.beginEditing(path);
        this.selector.deselect();
    }

    public setObjectMode() {
        this.selector.deselect();
        this.mode = EditorMode.OBJECT;
        this.setPerspectiveCamera()
        this.hideCameraLayers([])
    }

    public hideCameraLayers(layers: LayerEnum[]) {
        this.perspectiveCamera.layers.enableAll()
        this.orthoCamera.layers.enableAll()

        layers.forEach((layer) => {
            this.perspectiveCamera.layers.disable(layer);
            this.orthoCamera.layers.disable(layer);
        })
    }

    private handleKeyDownObjectMode(event) {

        switch (event.key) {

            // Duplicate object
            case 'd':
                if (event.ctrlKey) {
                    if (this.selector.currentSelectedObject) {
                        this.execute(new CreateObjectCommand(deepClone(this.selector.currentSelectedObject), this))
                    }
                }
                break;
            // Transform
            case 't':
                this.transformControls.setMode('translate');
                break;

            case 'r':
                this.transformControls.setMode('rotate');
                break;

            case 's':
                this.transformControls.setMode('scale');
                break;

            case '+':
            case '=':
                this.transformControls.setSize(this.transformControls.size + 0.1);
                break;
            case '-':
            case '_':
                this.transformControls.setSize(Math.max(this.transformControls.size - 0.1, 0.1));
                break;
            case 'x':
                this.transformControls.showX = !this.transformControls.showX;
                break;

            case 'y':
                this.transformControls.showY = !this.transformControls.showY;
                break;

            case 'z':

                if (event.ctrlKey) {
                    this.undo();
                } else {
                    this.transformControls.showZ = !this.transformControls.showZ;
                }

                break;

            case ' ':
                this.transformControls.enabled = !this.transformControls.enabled;
                break;

            case 'Escape':
                this.selector.deselect();
                break;

            case 'Delete':
                if (this.selector.currentSelectedObject) {
                    this.execute(new DeleteObjectCommand(this.selector.currentSelectedObject, this))
                }
                break;
            // Rotation in simple mode
            // TODO: clean this up
            case 'q':
                if (this.selector.advancedTransformMode) break;
                if (this.selector.currentSelectedObject) {
                    const object = this.selector.currentSelectedObject;                
                    const axis = new THREE.Vector3(0, 0, 1); 
                    const angle = Math.PI / 2;

                    const quaternion = new THREE.Quaternion();
                    quaternion.setFromAxisAngle(axis, angle);
                    const newQuaternion = object.quaternion.clone().multiply(quaternion);
                    this.execute(new SetRotationCommand(object, object.quaternion, newQuaternion));
                }
                break;
            case 'e':
                if (this.selector.advancedTransformMode) break;
                if (this.selector.currentSelectedObject) {
                    const object = this.selector.currentSelectedObject;                
                    const axis = new THREE.Vector3(0, 0, 1); 
                    const angle = -Math.PI / 2;

                    const quaternion = new THREE.Quaternion();
                    quaternion.setFromAxisAngle(axis, angle);
                    const newQuaternion = object.quaternion.clone().multiply(quaternion);
                    this.execute(new SetRotationCommand(object, object.quaternion, newQuaternion));
                }
                break;

        }
    }

    public handleKeyDown(event) {
        switch (this.mode) {
            case EditorMode.OBJECT:
                this.handleKeyDownObjectMode(event)
                break;
            case EditorMode.BED:
                this.bedEditor.handleKeyDown(event)
                break;
            case EditorMode.FENCE:
                this.fenceEditor.handleKeyDown(event)
            case EditorMode.PATH:
                this.pathEditor.handleKeyDown(event)
            default:
                break;
        }
    }

    private rulerCleanup() {
        this.remove(this.linePreview);
        this.rulerStart = undefined;
    }

    public handleMouseMove(editor: Editor, intersections: THREE.Object3D[]) {

        if (this.rulerStart === undefined) return;

        // draw ruler
        let [object, point] = processIntersections(intersections)
        point = snapper.snap(point)

        this.remove(this.linePreview)
        this.linePreview = createLinePreview(this.rulerStart, point);
        this.add(this.linePreview)
    }

    public handleRulerClick(editor: Editor, intersections: THREE.Object3D[]) {
        let [object, point] = processIntersections(intersections)
        point = snapper.snap(point)

        if (this.rulerStart === undefined) {
            this.rulerStart = point;
        } else {
            const ruler = createLinePreview(this.rulerStart, point);
            ruler.layers.set(LayerEnum.Objects)
            ruler.userData = {
                selectable: true
            }
            ruler.name = "Ruler"
            this.execute(new CreateObjectCommand(ruler, this))
            this.rulerCleanup()
        }

    }   

    public handleKeyUp(event) {
        this.rulerCleanup()
    }

}
export { Editor, EditorMode };