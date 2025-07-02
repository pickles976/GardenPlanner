import * as THREE from 'three';
import { LayerEnum, WORLD_SIZE} from './Constants';
import { WHITE } from './Colors';
import { eventBus, EventEnums } from './EventBus';
import { snapper } from './Snapping';

const GRID_SIZE = WORLD_SIZE;
const FEET_PER_METER = 3.280839895;

class GridManager {

    meterGrid: THREE.GridHelper
    decimeterGrid: THREE.GridHelper

    footGrid: THREE.GridHelper
    inchGrid: THREE.GridHelper

    size: number;
    metric: boolean;

    axesHelper: THREE.AxesHelper;

    constructor(editor) {

        this.metric = snapper.metric;

        this.meterGrid = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, WHITE, WHITE);
        this.meterGrid.layers.set(LayerEnum.NoRaycast)
        this.meterGrid.position.set(0, 0.002, 0)
        editor.scene.add(this.meterGrid);

        this.decimeterGrid = new THREE.GridHelper(GRID_SIZE, GRID_SIZE * 10, WHITE, 0xDDDDDD);
        this.decimeterGrid.layers.set(LayerEnum.NoRaycast)
        this.decimeterGrid.position.set(0, 0.001, 0)
        this.decimeterGrid.material.linewidth = 0.05;
        editor.scene.add(this.decimeterGrid);

        let footDivisions = FEET_PER_METER * GRID_SIZE;
        this.footGrid = new THREE.GridHelper(GRID_SIZE, footDivisions, WHITE, WHITE);
        this.footGrid.layers.set(LayerEnum.NoRaycast)
        this.footGrid.position.set(0, 0.002, 0)
        editor.scene.add(this.footGrid);

        this.inchGrid = new THREE.GridHelper(GRID_SIZE, footDivisions * 12, WHITE, 0xDDDDDD);
        this.inchGrid.layers.set(LayerEnum.NoRaycast)
        this.inchGrid.position.set(0, 0.001, 0)
        this.inchGrid.material.linewidth = 0.05;
        editor.scene.add(this.inchGrid);

        this.setMetric(this.metric)

        this.axesHelper = new THREE.AxesHelper(10);
        this.axesHelper.layers.set(LayerEnum.NoRaycast)
        this.axesHelper.position.set(0, 0.003, 0)
        this.axesHelper.name = "Axes Helper"
        editor.scene.add(this.axesHelper);
    }

    public setMetric(value: boolean) {
        this.metric = value;
        if (value) {
            this.meterGrid.visible = true;
            this.decimeterGrid.visible = true;
            this.footGrid.visible = false;
            this.inchGrid.visible = false;
        } else {
            this.meterGrid.visible = false;
            this.decimeterGrid.visible = false;
            this.footGrid.visible = true;
            this.inchGrid.visible = true;
        }
        
    }

    public showGrid(value: boolean) {
        this.meterGrid.visible = value;
        this.decimeterGrid.visible = value;
        this.footGrid.visible = value;
        this.inchGrid.visible = value;
        this.axesHelper.visible = value;

        if (value) {
            this.setMetric(this.metric)
        }
        
    }

}

export { GridManager }; 