import mitt from 'mitt'

enum EventEnums {
    REQUEST_RENDER = "requestRender",

    BED_EDITING_STARTED = "bedEditingStarted",
    BED_EDITING_UPDATED = "bedEditingUpdated", // TODO: change this state name
    BED_EDITING_FINISHED = "bedEditingFinished",
    BED_EDITING_CANCELLED = "bedEditingCancelled",

    VERTEX_EDITING_STARTED = "vertexEditingStarted",
    VERTEX_EDITING_UPDATED = "vertexEditingUpdated",
    VERTEX_EDITING_FINISHED = "vertexEditingFinished",

    OBJECT_CHANGED = "objectChanged",
    OBJECT_SELECTED = "objectSelected",

    SNAP_CHANGED = "snapChanged",
    METRIC_CHANGED = "metricChanged"
}

const eventBus = mitt();
export {eventBus, EventEnums};

