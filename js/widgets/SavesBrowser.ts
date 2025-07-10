import * as THREE from 'three';
import { eventBus, EventEnums } from "../EventBus";

const INDEX_STRING = "GardenPlanner/Index";

let index = localStorage.getItem(INDEX_STRING)

if (index === undefined) {
    localStorage.setItem(INDEX_STRING, "{}")
}


export function saveJSONLocalStorage(json: object, filename: string) {
    let index = JSON.parse(localStorage.get(INDEX_STRING))
    index[filename] = filename;
    localStorage.setItem(INDEX_STRING, JSON.stringify(index))

    localStorage.setItem(filename, JSON.stringify(json))
}

export function getJSONLocalStorage(filename: string) : object {
    const data = localStorage.getItem(filename);

    return (data === null) ? {} : JSON.parse(data)
}