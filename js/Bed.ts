import { Group, Quaternion, Vector3 } from "three";

class Bed {

    vertices: Vector3[];
    bedHeight: number;
    borderHeight: number;
    borderWidth: number;
    bedColor: string;
    borderColor: string;
    bedName: string;

    // 3D info
    position: Vector3;
    rotation: Quaternion;
    scale: Vector3;
    group: Group;

    constructor() {

    }

}

export { Bed };