import mitt from 'mitt'

enum EventEnums {
    REQUEST_RENDER = "requestRender",
    BED_EDITING_STARTED = "bedEditingStarted",
    VERTEX_EDITING_STARTED = "vertexEditingStarted",
    VERTEX_EDITING_FINISHED = "vertexEditingFinished",
    BED_EDITING_FINISHED = "bedEditingFinished",
    BED_EDITING_CANCELLED = "bedEditingCancelled",
    OBJECT_CHANGED = "objectChanged",
    OBJECT_SELECTED = "objectSelected"
}

const eventBus = mitt();
export {eventBus, EventEnums};

