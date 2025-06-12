import {Vector3} from "three";
import { eventBus, EventEnums } from "./EventBus";


class Snapper {

    snapEnabled: boolean
    snapAmount: number

    constructor () {
        this.snapEnabled = true;
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

}

const snapper = new Snapper();
eventBus.on(EventEnums.SNAP_CHANGED, (value) => snapper.setSnapping(value));

export {snapper};