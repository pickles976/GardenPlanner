import * as THREE from "three"
import { eventBus, EventEnums } from "./EventBus";
import { METRIC } from "./Constants";

const INCHES_PER_METER = 39.3700787402;
const CENTIMETERS_PER_INCH = 2.54;
const METERS_PER_INCH = CENTIMETERS_PER_INCH / 100.0;

class Snapper {

    snapEnabled: boolean
    metric: boolean
    snapAmount: number

    constructor () {
        this.snapEnabled = true;
        this.metric = METRIC;
        this.snapAmount = 0.1;

        this.setMetric(this.metric)
    }

    snap(p: THREE.Vector3) : THREE.Vector3 {

        if (!this.snapEnabled) {
            return p;
        }

        const temp = p.multiplyScalar(1.0/this.snapAmount)
        const newVec = new THREE.Vector3(Math.round(temp.x),Math.round(temp.y),Math.round(temp.z));
        return newVec.multiplyScalar(this.snapAmount);
    }

    setSnapping(value: boolean) {
        this.snapEnabled = value;
    }

    setMetric(value: boolean) {
        this.metric = value;
        this.snapAmount = value ? 0.1 : 0.0254;
    }

    // TODO: make it explicit that this is dependent on the state of the snapper
    metersToInches(value: number) {
        /**
         * Convert meters to inches
         */
        if (this.metric) {
            return value;
        } else {
            return value * INCHES_PER_METER;
        }
    }

    inchesToMeters(value: number) {
        return value / INCHES_PER_METER;
    }

    metersToInchesVector3(vector: THREE.Vector3) {
        return new THREE.Vector3(
            this.metersToInches(vector.x),
            this.metersToInches(vector.y),
            this.metersToInches(vector.z))
    }

    inchesToMetersVector3(vector: THREE.Vector3) {
        return new THREE.Vector3(
            this.inchesToMeters(vector.x),
            this.inchesToMeters(vector.y),
            this.inchesToMeters(vector.z))
    }

    getText(distance: number) : string{
        if (this.metric) {
            return `${distance.toFixed(2)}m`
        } else {
            return `${snapper.metersToInches(distance).toFixed(2)}"`
        }
    }

}

const snapper = new Snapper();
eventBus.on(EventEnums.SNAP_CHANGED, (value) => snapper.setSnapping(value));
eventBus.on(EventEnums.METRIC_CHANGED, (value) => snapper.setMetric(value));

export {snapper};