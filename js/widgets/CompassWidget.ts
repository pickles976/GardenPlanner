import { WHITE } from "../Colors";
import { Editor } from "../Editor";
import { eventBus, EventEnums } from "../EventBus";
import * as THREE from "three"

const raycaster = new THREE.Raycaster();

export function createCompassWidget(editor: Editor) {

    const div = document.createElement('div');
    div.className = "compass"
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    svgEl.setAttribute('data-src', '/icons/compass.svg');
    svgEl.setAttribute('class', 'compass-image');
    svgEl.setAttribute('fill', 'currentColor');
    svgEl.style.color = WHITE;

    div.appendChild(svgEl)
    document.body.appendChild(div)

    const debugP1 = document.createElement('div');
    debugP1.className = "debug-div-1"
    // document.body.appendChild(debugP1)

    const debugP2 = document.createElement('div');
    debugP2.className = "debug-div-2"
    // document.body.appendChild(debugP2)

    const rect = div.getBoundingClientRect();
    const center = new THREE.Vector2((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2);

    function redraw() {
        /** 
         * 1. Find the origin in screen-space of the SVG element
         * 2. Find the X,Y,Z coordinate (P1) of the pixel (use an infinite plane at 0,0,0)
         * 3. Add a vector facing north to P1 to obtain P2
         * 4. Convert P2 to screen-space coordinates
         * 5. Find angle in screen space between P1 and P2
         * 6. Apply rotation to compass widget
         */

        if (editor.currentCamera.type !== "PerspectiveCamera") {
            svgEl.style.transform = `rotateX(0deg) rotateZ(${-editor.north}deg)`;
            return;
        }

        const canvas = editor.canvas;

        const ndc1 = new THREE.Vector2(
            (center.x / canvas.width ) *  2 - 1, 
            (center.y / canvas.height) * -2 + 1)
        

        raycaster.setFromCamera(ndc1, editor.perspectiveCamera)

        const plane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
        const p1 = new THREE.Vector3();

        raycaster.ray.intersectPlane(plane, p1);

        // TODO: dynamically scale this based on camera zoom
        const dist = 1;
        const northVector = new THREE.Vector3(dist * Math.sin(editor.north),0,dist * Math.cos(editor.north));
        const p2 = p1.clone().add(northVector);
        
        const ndc2 = p2.project(editor.perspectiveCamera);

        const screen2 = new THREE.Vector2(
            (ndc2.x + 1) * 0.5 * canvas.clientWidth,
            (ndc2.y + 1) * 0.5 * canvas.clientHeight
        )

        const compassOrigin = new THREE.Vector2(center.x, canvas.height - center.y);
        const compassNorth = new THREE.Vector2(screen2.x, screen2.y);

        debugP1.style.bottom = `${canvas.height - center.y}px`
        debugP1.style.left = `${center.x}px`

        debugP2.style.bottom = `${screen2.y}px`
        debugP2.style.left = `${screen2.x}px`

        const diff = compassOrigin.clone().sub(compassNorth)
        const zRotation = Math.atan2(-diff.y, diff.x) * 180 / Math.PI;

        // const az = editor.perspectiveCameraControls.getAzimuthalAngle() * 180 / Math.PI;
        // const el = editor.perspectiveCameraControls.getPolarAngle() * 180 / Math.PI;

        // svgEl.style.transform = `rotateX(${el}deg) rotateZ(${zRotation}deg)`
        svgEl.style.transform = `rotateZ(${zRotation - 90}deg)`

  
    }

    function toggleVisibility(value) {
        div.style.visibility = value ? "visible" : "hidden";
    }

    eventBus.on(EventEnums.FRAME_UPDATED, () => redraw());
    eventBus.on(EventEnums.TOGGLE_COMPASS, (value) => toggleVisibility(value));
}
