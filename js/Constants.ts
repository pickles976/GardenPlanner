
export const FRUSTUM_SIZE = 3;
export const METRIC = false;

export const FONT_SIZE = 30;

enum EditorMode {
    NONE = "NONE",
    OBJECT = "OBJECT",
    BED = "BED",
    PLANT = "PLANT"
}

enum LayerEnum {
    NoRaycast = 0,
    Objects = 1,
    Plants = 2,
    BedVertices = 3,
}

export { EditorMode, LayerEnum };