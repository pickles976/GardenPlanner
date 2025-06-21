import mitt from 'mitt'

enum EventEnums {
    REQUEST_RENDER = "requestRender",

    OBJECT_CHANGED = "objectChanged",
    OBJECT_SELECTED = "objectSelected",

    TRANSFORM_MODE_CHANGED = "transformModeChanged",

    // GLOBAL EVENTS
    SNAP_CHANGED = "snapChanged",
    METRIC_CHANGED = "metricChanged",
    GRID_VISIBILITY_CHANGED = "gridVisibilityChanged",
    CAMERA_CHANGED = "cameraChanged",
    CHANGE_CAMERA_UI = "changeCameraUI",

    // BED CREATION/EDITING EVENTS
    BED_SELECTED = "bedSelected",
    BED_CREATION_STARTED = "bedCreationStarted", // Create new bed
    BED_EDITING_STARTED = "bedEditingStarted", // Edit existing bed
    BED_EDITING_FINISHED = "bedEditingFinished",
    BED_EDITING_CANCELLED = "bedEditingCancelled",

    VERTEX_EDITING_STARTED = "vertexEditingStarted",
    VERTEX_EDITING_UPDATED = "vertexEditingUpdated",
    VERTEX_EDITING_FINISHED = "vertexEditingFinished",

    BED_CONFIG_UPDATED = "bedConfigUpdated", // 

    // PLANT CREATION
    PLANT_CREATION_STARTED = "plantCreationStarted",

    LOAD_PLANT = "loadPlant"



}

const eventBus = mitt();
export {eventBus, EventEnums};

