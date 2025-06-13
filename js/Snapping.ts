import {Vector3} from "three";
import { eventBus, EventEnums } from "./EventBus";


class Snapper {

    snapEnabled: boolean
    metric: boolean
    snapAmount: number

    constructor () {
        this.snapEnabled = true;
        this.metric = true;
        this.snapAmount = 0.1;

    }

    snap(p: Vector3) : Vector3 {

        if (!this.snapEnabled) {
            return p;
        }

        const temp = p.multiplyScalar(1.0/this.snapAmount)
        const newVec = new Vector3(Math.round(temp.x),Math.round(temp.y),Math.round(temp.z));
        return newVec.multiplyScalar(this.snapAmount);
    }

    setSnapping(value: boolean) {
        this.snapEnabled = value;
    }

    setMetric(value: boolean) {
        this.metric = value;
        this.snapAmount = value ? 0.1 : 0.0254;
    }

    convert(value: number) {
        /**
         * Convert meters to inches
         */
        if (this.metric) {
            return value;
        } else {
            return value * 39.3700787402;
        }
    }

    inchesToMeters(value: number) {
        return value / 39.3700787402;
    }

    getText(distance: number) {
        const char = this.metric ? 'm' : '"';
        return `${snapper.convert(distance).toFixed(2)}${char}`
    }

}

const snapper = new Snapper();
eventBus.on(EventEnums.SNAP_CHANGED, (value) => snapper.setSnapping(value));
eventBus.on(EventEnums.METRIC_CHANGED, (value) => snapper.setMetric(value));

export {snapper};