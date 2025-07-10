import mitt from 'mitt'

// TODO: clean up some of this shit
enum EventEnums {

    SUN_CONFIG_CHANGED = "sunConfigChanged",
    EDITOR_CLEARED = "editorCleared",

    FRAME_UPDATED = "frameUpdated",

    TOGGLE_COMPASS = "toggleCompass",

    OBJECT_ADDED = "objectAdded",
    OBJECT_REMOVED = "objectRemoved",

    OBJECT_CHANGED = "objectChanged",
    OBJECT_SELECTED = "objectSelected",

    GRASS_CHANGED = "grassChanged",

    // PLANT CREATION
    PLANT_CREATION_STARTED = "plantCreationStarted",

    LOAD_PLANT = "loadPlant",
    PLANT_SELECTED = "plantSelected",

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
    FENCE_CREATION_STARTED = "fenceCreationStarted", 
    FENCE_EDITING_STARTED = "fenceEditingStarted",
    FENCE_EDITING_FINISHED = "fenceEditingFinished",
    FENCE_EDITING_CANCELLED = "fenceEditingCancelled",

    FENCE_VERTEX_EDITING_STARTED = "fenceVertexEditingStarted",
    FENCE_VERTEX_EDITING_UPDATED = "fenceVertexEditingUpdated",
    FENCE_VERTEX_EDITING_FINISHED = "fenceVertexEditingFinished",

    FENCE_CONFIG_UPDATED = "fenceConfigUpdated",

    // PATH CREATION/EDITING EVENTS
    PATH_SELECTED = "pathSelected",
    PATH_CREATION_STARTED = "pathCreationStarted",
    PATH_EDITING_STARTED = "pathEditingStarted",
    PATH_EDITING_FINISHED = "pathEditingFinished",
    PATH_EDITING_CANCELLED = "pathEditingCancelled",

    PATH_VERTEX_EDITING_STARTED = "pathVertexEditingStarted",
    PATH_VERTEX_EDITING_UPDATED = "pathVertexEditingUpdated",
    PATH_VERTEX_EDITING_FINISHED = "pathVertexEditingFinished",

    PATH_CONFIG_UPDATED = "pathConfigUpdated"

}

const eventBus = mitt();
export {eventBus, EventEnums};

