import { eventBus, EventEnums } from "./EventBus";


export const plants = {
    brussels_sprouts: {
        name: "Brussels Sprouts",
        icon: 'models/brussels_sprouts/image.png',
        model: 'models/brussels_sprouts/model_10k.glb',
        plantData: {
            height: 1.0,
            radius: 0.5
        }
    },
    cabbage: {
        name: "Cabbage",
        icon: 'models/cabbage/image.png',
        model: 'models/cabbage/model_10k.glb',
        plantData: {
            height: 1.0,
            radius: 0.5
        }
    },
    corn: {
        name: "Corn",
        icon: 'models/corn/image.png',
        model: 'models/corn/model_10k.glb',
        plantData: {
            height: 1.0,
            radius: 0.5
        }
    },
    eggplant: {
        name: "Eggplant",
        icon: 'models/eggplant/image.png',
        model: 'models/eggplant/model_10k.glb',
        plantData: {
            height: 1.0,
            radius: 0.5
        }
    },
    onion: {
        name: "Onion",
        icon: 'models/onion/image.png',
        model: 'models/onion/model_10k.glb',
        plantData: {
            height: 1.0,
            radius: 0.5
        }
    },
    pepper: {
        name: "Jalapeño",
        icon: 'models/pepper/image.png',
        model: 'models/pepper/model_10k.glb',
        plantData: {
            height: 0.5,
            radius: 0.3
        }
    },
    potato: {
        name: "Potato",
        icon: 'models/potato/image.png',
        model: 'models/potato/model_10k.glb',
        plantData: {
            height: 0.5,
            radius: 0.3
        }
    },
    tomato: {
        name: "Tomato",
        icon: 'models/tomato/image.png',
        model: 'models/tomato/model_10k.glb',
        plantData: {
            height: 1.0,
            radius: 0.5
        }
    },

}

function createListItem(plant) {

    const div = document.createElement("div");
    div.className = "item";

    const img = document.createElement("img");
    img.src = plant.icon;
    img.className = "plant-image";

    div.appendChild(img)
    div.appendChild(document.createTextNode(plant.name))

    return div
}

export function createSearchPanel() : HTMLElement {
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
        div.onclick = () => {
            eventBus.emit(EventEnums.LOAD_PLANT, plant);
            container.remove();
        }

    });

    scrollable.appendChild(grid)
    container.appendChild(scrollable)

    return container
}
