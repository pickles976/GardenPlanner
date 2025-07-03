import { createCube } from "./Creation";
import { Editor } from "./Editor";
import { eventBus, EventEnums } from "./EventBus";
import * as THREE from "three"

const SVG_SIZE = "128px";
const raycaster = new THREE.Raycaster();

export function createCompassWidget(editor: Editor) {

    const div = document.createElement('div');
    div.className = "compass"
    const svgEl = document.createElement('img')
    // const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    svgEl.setAttribute('src', '/icons/compass.svg');
    svgEl.setAttribute('class', 'compass-image');

    div.appendChild(svgEl)
    document.body.appendChild(div)

    const rect = svgEl.getBoundingClientRect();

    const cube = createCube(editor);

    function redraw() {

        if (editor.currentCamera.type !== "PerspectiveCamera") {
            svgEl.style.transform = "";
            return;
        }

        const az = editor.perspectiveCameraControls.getAzimuthalAngle() * 180 / Math.PI;
        const el = editor.perspectiveCameraControls.getPolarAngle() * 180 / Math.PI;

        svgEl.style.transform = `rotateX(${el}deg) rotateZ(${180 + az}deg)`

  
    }

    eventBus.on(EventEnums.FRAME_UPDATED, () => redraw());
}
