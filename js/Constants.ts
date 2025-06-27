
export const FRUSTUM_SIZE = 3;
export const METRIC = false;

export const FONT_SIZE = 30;

enum LayerEnum {
    NoRaycast = 0, // not raycastable
    World = 1, // raycastable but not selectable (ground)
    Objects = 2, // raycast + selectable 
    Plants = 3, // like object but with different properties 
    LineVertices = 4, // raycastable only in line editor mode
}

export { LayerEnum };