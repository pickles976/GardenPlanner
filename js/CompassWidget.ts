import { Editor } from "./Editor";
import { eventBus, EventEnums } from "./EventBus";
import * as THREE from "three"

const SVG_SIZE = "128px";

export function createCompassWidget(editor: Editor) {

    const div = document.createElement('div');
    div.className = "compass"
    const svgEl = document.createElement('img')
    // const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    svgEl.setAttribute('src', '/icons/compass.svg');
    svgEl.setAttribute('class', 'compass-image');

    div.appendChild(svgEl)
    document.body.appendChild(div)

    function redraw() {
        let matrix = editor.currentCamera.matrix.invert();

        // matrix = matrix.makeRotationAxis(new THREE.Vector3(1,0,0), Math.PI / 2);
        const e = matrix.elements

        const rotationOnly = new THREE.Matrix4();
        rotationOnly.set(
            e[0], e[1], e[2], 0,
            e[4], e[5], e[6], 0,
            e[8], e[9], e[10], 0,
               0,    0,     0, 1);

        // const rotation = editor.currentCamera.rotation.y * 180 / Math.PI;

        // svgEl.style.transform = `rotateX(90deg)`;

        // console.log(rotationOnly.elements.join(","))

        svgEl.style.transform = `matrix3d(${rotationOnly.elements.join(",")})`;
    }

    eventBus.on(EventEnums.FRAME_UPDATED, () => redraw());
}

