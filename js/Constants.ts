
export const FRUSTUM_SIZE = 10;
export const METRIC = false;

enum EditorMode {
    OBJECT = "OBJECT",
    BED = "BED"
}

enum LayerEnums {
    NoRaycast = 0,
    Objects = 1,
    Plants = 2,
    BedVertices = 3,
}

export { EditorMode, LayerEnums };