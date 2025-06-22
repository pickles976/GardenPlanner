import * as THREE from 'three';
import { eventBus, EventEnums } from "./EventBus";

export class Plant {

    name: string;
    icon_path: string;
    model_path: string;
    scale: THREE.Vector3;

    constructor(name, icon_path, model_path, scale) {
        this.name = name;
        this.icon_path = icon_path;
        this.model_path = model_path;
        this.scale = scale;
    }
}

export const plants = {
    brussels_sprouts: new Plant(
        "Brussels Sprouts",
        'models/brussels_sprouts/image.png',
        'models/brussels_sprouts/model_10k.glb',
        new THREE.Vector3(0.3, 0.3, 0.3)),
    cabbage: new Plant(
        "Cabbage",
        'models/cabbage/image.png',
        'models/cabbage/model_10k.glb',
        new THREE.Vector3(0.2, 0.2, 0.2)),
    corn: new Plant(
        "Corn",
        'models/corn/image.png',
        'models/corn/model_10k.glb',
        new THREE.Vector3(0.6, 0.6, 0.8)),
    eggplant: new Plant(
        "Eggplant",
        'models/eggplant/image.png',
        'models/eggplant/model_10k.glb',
        new THREE.Vector3(0.3, 0.3, 0.3)),
    onion: new Plant(
        "Onion",
        'models/onion/image.png',
        'models/onion/model_10k.glb',
        new THREE.Vector3(0.25, 0.25, 0.25)),
    pepper: new Plant(
        "Jalapeño",
        'models/pepper/image.png',
        'models/pepper/model_10k.glb',
        new THREE.Vector3(0.3, 0.3, 0.3)),
    potato: new Plant(
        "Potato",
        'models/potato/image.png',
        'models/potato/model_10k.glb',
        new THREE.Vector3(0.3, 0.3, 0.3)),
    tomato: new Plant(
        "Tomato",
        'models/tomato/image.png',
        'models/tomato/model_10k.glb',
        new THREE.Vector3(0.5, 0.5, 0.5)),

}

function createListItem(plant) {
    /**
     * Single item in the search panel
     */

    const div = document.createElement("div");
    div.className = "item";

    // const img = document.createElement("img");
    // img.src = plant.icon_path;
    
    const img = document.createElement("model-viewer")
    img.src = plant.model_path;
    img.setAttribute('auto-rotate', '');
    img.setAttribute('camera-controls', '');
    img.style.touchAction="pan-y"
    img.className = "plant-image";

    const initialCameraOrbit = img.cameraOrbit;
    const fov = img.getFieldOfView();

    img.addEventListener('mouseleave', () => {
        // Reset to the initial camera orbit
        img.cameraOrbit = initialCameraOrbit;
        img.fieldOfView = `30deg`;
    });


    const button = document.createElement("button")
    button.innerText = plant.name;
    button.style.fontSize = "16px";

    div.appendChild(img)
    div.appendChild(button)

    return div
}

export function createSearchPanel() : HTMLElement {
    /**
     * Create search panel
     */

    const container = document.createElement("div");
    container.className = "search-panel";
    container.id = "search-panel"

    const button = document.createElement("button")
    button.innerText = "Cancel";
    button.style.fontSize = "16px";
    button.style.color = "#FF0000"
    
    button.onclick = () => {
        container.remove()
    }

    container.appendChild(button)

    const scrollable = document.createElement("div")
    scrollable.className = "scroll-container"

    const grid = document.createElement("div");
    grid.className = "grid"

    Object.values(plants).forEach((plant) => {
        const div = createListItem(plant);
        grid.appendChild(div);
        div.lastChild.onclick = () => {
            eventBus.emit(EventEnums.LOAD_PLANT, plant);
            container.remove();
        }

    });

    scrollable.appendChild(grid)
    container.appendChild(scrollable)

    return container
}
