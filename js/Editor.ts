import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { Command } from './commands/Command';
import { Selector } from './Selector';
import { FRUSTUM_SIZE, GRASS_HEIGHT, LayerEnum, NUM_GRASS_BLADES, SHADOWMAP_RESOLUTION, WORLD_SIZE } from './Constants';
import { BedEditor } from './editors/BedEditor';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CommandStack } from './CommandStack';
import { eventBus, EventEnums } from './EventBus';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ORANGE, RED, WHITE, YELLOW } from './Colors';
import { filterCurrentlySelected, handleTransformControlsChange, highlightMouseOverObject, performRaycast, processIntersections } from './EventHandlers';
import { snapper } from './Snapping';
import { DeleteObjectCommand } from './commands/DeleteObjectCommand';
import { CreateObjectCommand } from './commands/CreateObjectCommand';
import { blendColors, deepClone, rad2deg } from './Utils';
import { SetRotationCommand } from './commands/SetRotationCommand';
import { RulerEditor } from './editors/RulerEditor';
import { FenceEditor } from './editors/FenceEditor';
import { PathEditor } from './editors/PathEditor';
import { SetPositionCommand } from './commands/SetPositionCommand';
import SunCalc from "suncalc";

import { Sky } from 'three/addons/objects/Sky.js';
import { createGrass } from './Grass';
import { Vector3 } from 'three';
import { degToRad } from 'three/src/math/MathUtils.js';
import { GridManager } from './GridManager';
import { createGround } from './Creation';

const ANTI_ALIASING = true;

const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;

const ROTATION_DEGREES = 0.008726639;
const ORBIT_CONTROLS_PAN_SPEED = 20.0;

const BASE_AMBIENT_LIGHT_INTENSITY = 0.5;
const BASE_DIRECTIONAL_LIGHT_INTENSITY = 0.3;

enum EditorMode {
    NONE = "NONE",
    OBJECT = "OBJECT",
    BED = "BED",
    FENCE = "FENCE",
    PATH = "PATH",
    PLANT = "PLANT"
}

class EditorConfig {
    metric: boolean;
    north: number;
    latitude: number;
    longitude: number;
    time: Date;

    constructor (metric, north, latitude, longitude, time) {
        this.metric = metric;
        this.north = north;
        this.latitude = latitude;
        this.longitude = longitude;
        this.time = time
    }

    public toJSON() {
        return {
            "metric": this.metric,
            "north": this.north,
            "latitude": this.latitude,
            "longitude": this.longitude,
            "time": this.time
        }
    }

}


class Editor {
    /**
     * Holds all of our important Three.js instance stuff. We should try to move as much out of here as possible to avoid creating a 
     * "God" object
     */

    // TODO: put this in some kind of object\
    north: number;
    latitude: number;
    longitude: number;
    time: Date;

    canvas: HTMLCanvasElement
    renderer: THREE.WebGLRenderer
    labelRenderer: CSS2DRenderer
    scene: THREE.Scene

    currentCamera: THREE.Camera
    perspectiveCamera: THREE.PerspectiveCamera
    orthoCamera: THREE.OrthographicCamera
    perspectiveCameraControls: MapControls
    orthoCameraControls: OrbitControls

    depthCamera: THREE.OrthographicCamera;

    currentCameraControls: Object

    transformControls: TransformControls

    ambientLight: THREE.AmbientLight;
    directionalLight: THREE.DirectionalLight

    commandStack: CommandStack;

    objectMap: { [key: string]: THREE.Object3D };

    gridManager: GridManager;

    selector: Selector;
    bedEditor: BedEditor;
    fenceEditor: FenceEditor;
    pathEditor: PathEditor;
    rulerEditor: RulerEditor;

    mode: EditorMode;

    // Pretty things
    // TODO: pull this out into a grass manager??
    sky: Sky;
    ground: THREE.Mesh;
    grass?: THREE.InstancedMesh;



    constructor() {
        this.north = 0.0;
        this.commandStack = new CommandStack();
        this.objectMap = {};
        this.selector = new Selector(this);
        this.bedEditor = new BedEditor(this);
        this.fenceEditor = new FenceEditor(this);
        this.pathEditor = new PathEditor(this);
        this.rulerEditor = new RulerEditor(this);
        this.mode = EditorMode.OBJECT;

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

        eventBus.on(EventEnums.GRASS_CHANGED, (value) => this.showGrass(value));
    }

    public initThree() {
        /**
         * Create all of the things like camera, renderer, etc.
         */

        // renderer
        this.renderer = new THREE.WebGLRenderer({
            // logarithmicDepthBuffer: true, DISABLED DUE TO ISSUES WITH GRASS
            antialias: ANTI_ALIASING
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.canvas = document.body.appendChild(this.renderer.domElement);

        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none'; // don't want any events coming from the CSS renderer guy
        document.body.appendChild(this.labelRenderer.domElement);

        // this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        // this.renderer.toneMappingExposure = 0.8;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // this.renderer.physicallyCorrectLights = true

        // Perspective Camera
        const aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

        this.perspectiveCamera = new THREE.PerspectiveCamera(60, aspect, 0.01, 2000000);
        this.perspectiveCamera.name = "Perspective Camera"
        this.perspectiveCamera.position.set(0, 2, -2);
        this.perspectiveCamera.up.set(0, 1, 0);
        this.perspectiveCamera.lookAt(0, 0, 0);
        this.perspectiveCamera.layers.enableAll();

        // Map Controls
        this.perspectiveCameraControls = new MapControls(this.perspectiveCamera, this.canvas)
        this.perspectiveCameraControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        this.perspectiveCameraControls.dampingFactor = 0.05;
        this.perspectiveCameraControls.screenSpacePanning = false;
        this.perspectiveCameraControls.minDistance = 0.1;
        this.perspectiveCameraControls.maxDistance = 16384;
        this.perspectiveCameraControls.maxPolarAngle = (Math.PI / 2) - (Math.PI / 180)

        // Orthographic Camera https://threejs.org/docs/#api/en/cameras/OrthographicCamera
        this.orthoCamera = new THREE.OrthographicCamera(
            -FRUSTUM_SIZE * aspect / 2, // L
            FRUSTUM_SIZE * aspect / 2,  // R
            FRUSTUM_SIZE / 2, // TOP
            -FRUSTUM_SIZE / 2, // Bottom
            0.01, // Near
            1000); // Far
        this.orthoCamera.name = "Ortho Camera"
        this.orthoCamera.position.set(0, 100, 0);
        this.orthoCamera.up.set(0, 0, 1);
        this.orthoCamera.lookAt(0, 0, 0);
        this.orthoCamera.layers.enableAll();
        this.orthoCamera.layers.disable(LayerEnum.Grass)

        // Orbit Controls https://threejs.org/docs/#examples/en/controls/OrbitControls.keys
        this.orthoCameraControls = new OrbitControls(this.orthoCamera, this.canvas);
        this.orthoCameraControls.enableDamping = false; // an animation loop is required when either damping or auto-rotation are enabled
        this.orthoCameraControls.screenSpacePanning = true;
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

        // DEPTH CAMERA USED FOR GRASS DISPLACEMENT
        this.depthCamera = new THREE.OrthographicCamera(
            -WORLD_SIZE / 2, // L
            WORLD_SIZE / 2,  // R
            WORLD_SIZE / 2, // T
            -WORLD_SIZE / 2, // B
            0.0, // Near
            GRASS_HEIGHT + 1); // Far
        this.depthCamera.name = "Depth Camera"
        this.depthCamera.position.set(0, -1, 0); // Sit below ground
        this.depthCamera.rotation.x += Math.PI / 2; // Look up
        this.depthCamera.layers.disableAll();
        this.depthCamera.layers.enable(LayerEnum.Objects);

        this.transformControls = new TransformControls(this.currentCamera, this.canvas);
        this.transformControls.addEventListener('change', () => {
            handleTransformControlsChange(this);
        });
        this.setSnapping(snapper.snapEnabled)
    }

    public initScene() {
        /**
         * Create an empty scene this all the tools we need
         */

        // scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0xEBE2DB, 0.00003);

        this.ground = createGround()
        this.scene.add(this.ground)

        // Grids
        this.gridManager = new GridManager(this);

        // Sky
        this.sky = new Sky();
        this.sky.scale.setScalar(4500000);
        this.sky.layers.set(LayerEnum.NoRaycast)

        this.sky.material.uniforms.sunPosition.value = new THREE.Vector3(-1, 1, 0.0);
        this.sky.material.uniforms.turbidity.value = 10;
        this.sky.material.uniforms.rayleigh.value = 3;
        this.sky.material.uniforms.mieCoefficient.value = 0.005;
        this.sky.material.uniforms.mieDirectionalG.value = 0.7; // Sun diffusion amount
        this.sky.material.uniforms.exposure = 0.5;
        this.sky.name = "Sky"

        this.scene.add( this.sky );

        // TODO: split this out into a lighting object
        // lighting
        const intensity = 1.0;
        this.directionalLight = new THREE.DirectionalLight(RED, intensity);
        this.directionalLight.position.set(-20, 20, 20);
        this.directionalLight.castShadow = true;
        this.scene.add(this.directionalLight);

        // Shadow properties
        // https://threejs.org/docs/index.html#api/en/lights/shadows/DirectionalLightShadow

        // Prevent shadow acne artifacts
        // https://mofu-dev.com/en/blog/threejs-shadow-map/
        this.directionalLight.shadow.bias = -0.0001;
        this.directionalLight.shadow.normalBias = 0.1;

        // size of the map
        this.directionalLight.shadow.camera.left = -WORLD_SIZE;
        this.directionalLight.shadow.camera.right = WORLD_SIZE;
        this.directionalLight.shadow.camera.top = -WORLD_SIZE;
        this.directionalLight.shadow.camera.bottom = WORLD_SIZE;

        // map resolution
        this.directionalLight.shadow.mapSize.width = SHADOWMAP_RESOLUTION;
        this.directionalLight.shadow.mapSize.height = SHADOWMAP_RESOLUTION;
        this.directionalLight.shadow.camera.near = 0.5; // default
        this.directionalLight.shadow.camera.far = 500; // default
        this.directionalLight.shadow.radius = 1.0; // blur shadows
        this.directionalLight.name = "Directional Light";

        this.ambientLight = new THREE.AmbientLight(WHITE, 1.0);
        this.ambientLight.name = "Ambient Light";
        this.scene.add(this.ambientLight);

        this.grass = createGrass(NUM_GRASS_BLADES, WORLD_SIZE, WORLD_SIZE)
        this.grass.visible = false;
        this.grass.name = "Grass"
        this.add(this.grass)
    }

    public exportToJson() : object {

        const config = new EditorConfig(
            snapper.metric,
            this.north, 
            this.lat,
            this.lon,
            this.date
        )

        const sceneCopy = this.scene.clone(true); // deep clone

        // Remove objects
        for (let i = sceneCopy.children.length; i >= 0; i--) {
            const child = sceneCopy.children[i];

            if (child === undefined) { 
                continue;
            }

            if (child.name === "Grass" || 
                child.name === "Directional Light" || 
                child.name === "Ambient Light" || 
                child.name === "Sky" ||
                child.name === "Grid" ||
                child.name === "Axes Helper" ||
                child.name === "Ground") {

                child.parent?.remove(child);
            }
        }

        return {
            "config": config.toJSON(),
            "scene": sceneCopy.toJSON()
        }
    }

    public loadFromJson(json: object) {

        this.clear()
        this.initScene()

        const config = json.config;
        this.setSun(config.north, config.latitude, config.longitude, new Date(config.time))
        snapper.setMetric(config.metric);

        const scene = json.scene;
        while (scene.children.length > 0) {
            this.add(scene.children[0]);
        }

        eventBus.emit(EventEnums.OBJECT_CHANGED)
        eventBus.emit(EventEnums.SUN_CONFIG_CHANGED)

    }

    public clear() {
        /** Remove everything from the scene */

        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }

        this.scene.traverse(object => {
            if (object.isMesh) {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            }
        });

        this.objectMap = {}
        this.commandStack.clear()

        eventBus.emit(EventEnums.EDITOR_CLEARED)
    }

    public setSun(north, latitude, longitude, time) {
        this.north = north;
        this.latitude = latitude;
        this.longitude = longitude;
        this.time = time;

        const pos = SunCalc.getPosition(time, latitude, longitude, 0)
        this.setSunPosition(rad2deg(pos.azimuth), rad2deg(pos.altitude));
    }

    private setSunPosition(azimuth: number, elevation: number) {

        elevation = degToRad(elevation);
        azimuth = degToRad(azimuth - this.north);

        // TODO: account for dynamic north


        // convert from SunCalc convention to THREE.js convention
        // https://github.com/mourner/suncalc
        // https://threejs.org/docs/#api/en/math/Spherical.theta
        let sunPos = new Vector3().setFromSphericalCoords(100.0, (Math.PI / 2) - elevation, Math.PI - azimuth);

        this.ambientLight.intensity = BASE_AMBIENT_LIGHT_INTENSITY + Math.sin(elevation) * (1 - BASE_AMBIENT_LIGHT_INTENSITY);
        this.ambientLight.color = blendColors(ORANGE, WHITE, Math.sqrt(Math.sin(elevation)))

        this.directionalLight.intensity = BASE_DIRECTIONAL_LIGHT_INTENSITY + Math.sin(elevation) * (1 - BASE_DIRECTIONAL_LIGHT_INTENSITY);
        this.directionalLight.position.set(...sunPos);
        this.directionalLight.color = blendColors(ORANGE, WHITE, Math.sqrt(Math.sin(elevation)))

        this.sky.material.uniforms.sunPosition.value = sunPos;

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
        
    }

    public setPerspectiveCamera() {
        this.currentCamera = this.perspectiveCamera
        this.currentCameraControls = this.perspectiveCameraControls
        this.perspectiveCameraControls.enabled = true
        this.orthoCameraControls.enabled = false
        this.transformControls.camera = this.currentCamera;
        
    }

    public add(object?: THREE.Object3D) {
        if (object === undefined) {
            return
        }
        this.objectMap[object.uuid] = object;
        object.rotation.reorder ( 'XZY' ); // Fix rotation order
        this.scene.add(object)
        // TODO: properly update the rest of the application
        eventBus.emit(EventEnums.OBJECT_ADDED)
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
        eventBus.emit(EventEnums.OBJECT_REMOVED)
    }

    public selectByUUID(uuid: string) {
		this.selector.deselect();
        if (this.objectMap.hasOwnProperty(uuid)) {
            this.selector.select(this.objectMap[uuid]);
        }
    }

    public focusByUUID(uuid: string) {
        if (this.objectMap.hasOwnProperty(uuid)) {
            const object = this.objectMap[uuid];
            this.perspectiveCamera.position.set(...(object.position.clone().add(new THREE.Vector3(0, -1, 1))));
            this.perspectiveCameraControls.target.copy(object.position);
            this.perspectiveCameraControls.update();
            
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
        this.bedEditor.beginEditing(bed);
        this.selector.deselect();
        // this.hideCameraLayers([LayerEnum.Plants, LayerEnum.Objects])
    }

    public setFenceMode(fence?: THREE.Object3D) {
        this.mode = EditorMode.FENCE;
        this.setOrthoCamera()
        eventBus.emit(EventEnums.CHANGE_CAMERA_UI, true)
        this.fenceEditor.beginEditing(fence);
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
        this.orthoCamera.layers.disable(LayerEnum.Grass)

        layers.forEach((layer) => {
            this.perspectiveCamera.layers.disable(layer);
            this.orthoCamera.layers.disable(layer);
        })
    }

    // Input handling

    private handleKeyDownObjectMode(event) {

        switch (event.key) {

            // Duplicate object
            case 'D': 
                if (this.selector.currentSelectedObject) {
                        this.execute(new CreateObjectCommand(deepClone(this.selector.currentSelectedObject), this))
                }
                break;
            // Transform
            case 'm': // toggle between transform modes
                if (event.shiftKey) {
                    break;
                }
                this.selector.setTransformMode(!this.selector.advancedTransformMode);
                break;
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

    public handleKeyUp(event) {
        this.rulerEditor.cleanup()
    }

    private handleMouseClickObjectMode(intersections: THREE.Object3D[]) {

        // Don't do anything if we are actively using the transform controls
        if (this.selector.isUsingTransformControls === true) {
            return
        }

        if (this.selector.currentSelectedObject === undefined) {
            const [object, point] = processIntersections(intersections);
            (object?.userData?.selectable === true) ? this.selector.select(object) : this.selector.deselect();
        } else {
            this.selector.deselect()
        }

    }

    public handleMouseClick(event) {

        // Only do a raycast if the LMB was used
        if (event.button !== 0) return;

        if (event.shiftKey) {
            this.rulerEditor.handleMouseClick(performRaycast(event, this, [LayerEnum.World]))
            return;
        }

        switch(this.mode) {
            case EditorMode.OBJECT:
                this.handleMouseClickObjectMode(performRaycast(event, this, []));
                break;
            case EditorMode.BED:
                this.bedEditor.handleMouseClick(performRaycast(event, this, [LayerEnum.World, LayerEnum.LineVertices]))
                break;
            case EditorMode.FENCE:
                this.fenceEditor.handleMouseClick(performRaycast(event, this, [LayerEnum.World, LayerEnum.LineVertices]))
                break;
            case EditorMode.PATH:
                this.pathEditor.handleMouseClick(performRaycast(event, this, [LayerEnum.World, LayerEnum.LineVertices]))
                break;
            default:
                break
        }

    }

    public handleMouseMoveObjectMode(intersections: THREE.Object3D[]){

        intersections = filterCurrentlySelected(intersections, this)
        const [object, point] = processIntersections(intersections)

        const selector = this.selector;
        if (selector.currentSelectedObject) {

            if (selector.advancedTransformMode) {
                // Transform handles already handle the transforming
            } else {
                // Move the object to the raycast point
                const box = new THREE.Box3().setFromObject(selector.currentSelectedObject);
                const size = new THREE.Vector3();
                box.getSize(size);

                let newPos = point.add(new THREE.Vector3(0,size.y / 2,0))
                newPos = snapper.snap(newPos);
                this.execute(new SetPositionCommand(selector.currentSelectedObject, selector.currentSelectedObject.position, newPos))
            }

        }
        
        highlightMouseOverObject(this, intersections)

    }

    public showGrass(value: boolean) {
        this.grass.visible = value;
    }

    public handleMouseMove(event) {

        if (event.shiftKey) {
            this.rulerEditor.handleMouseMove(performRaycast(event, this, [LayerEnum.World]))
            return;
        }

        switch(this.mode) {
            case EditorMode.OBJECT:
                this.handleMouseMoveObjectMode(performRaycast(event, this, []));
                break;
            case EditorMode.BED:
                this.bedEditor.handleMouseMove(performRaycast(event, this, [LayerEnum.World, LayerEnum.LineVertices]))
                break;
            case EditorMode.FENCE:
                this.fenceEditor.handleMouseMove(performRaycast(event, this, [LayerEnum.World, LayerEnum.LineVertices]))
                break;
            case EditorMode.PATH:
                this.pathEditor.handleMouseMove(performRaycast(event, this, [LayerEnum.World, LayerEnum.LineVertices]))
                break;
            default:
                break
        }
    }

}
export { Editor, EditorMode };