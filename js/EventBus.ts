import mitt from 'mitt'

enum EventEnums {
    REQUEST_RENDER = "requestRender",
    OBJECT_ADDED = "objectAdded",
    OBJECT_REMOVED = "objectRemoved",

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

    BED_VERTEX_EDITING_STARTED = "bedVertexEditingStarted",
    BED_VERTEX_EDITING_UPDATED = "bedVertexEditingUpdated",
    BED_VERTEX_EDITING_FINISHED = "bedVertexEditingFinished",

    BED_CONFIG_UPDATED = "bedConfigUpdated", // 

    // FENCE CREATION/EDITING EVENTS
    FENCE_SELECTED = "fenceSelected",
    FENCE_CREATION_STARTED = "fenceCreationStarted", // Create new bed
    FENCE_EDITING_STARTED = "fenceEditingStarted", // Edit existing bed
    FENCE_EDITING_FINISHED = "fenceEditingFinished",
    FENCE_EDITING_CANCELLED = "fenceEditingCancelled",

    FENCE_VERTEX_EDITING_STARTED = "fenceVertexEditingStarted",
    FENCE_VERTEX_EDITING_UPDATED = "fenceVertexEditingUpdated",
    FENCE_VERTEX_EDITING_FINISHED = "fenceVertexEditingFinished",

    FENCE_CONFIG_UPDATED = "fenceConfigUpdated", // 

    // PLANT CREATION
    PLANT_CREATION_STARTED = "plantCreationStarted",

    LOAD_PLANT = "loadPlant",
    PLANT_SELECTED = "plantSelected"



}

const eventBus = mitt();
export {eventBus, EventEnums};

