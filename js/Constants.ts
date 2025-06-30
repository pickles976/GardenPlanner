
export const FRUSTUM_SIZE = 3;
export const METRIC = false;

export const FONT_SIZE = 30;

export const WORLD_SIZE = 32;

enum LayerEnum {
    NoRaycast = 0, // not raycastable
    World = 1, // raycastable but not selectable (ground)
    Objects = 2, // raycast + selectable 
    Plants = 3, // like object but with different properties 
    LineVertices = 4, // raycastable only in line editor mode
    Grass = 5,
}

export class Props {
    nonDifferentiableFields: string[];

    constructor(fields) {
        this.nonDifferentiableFields = fields;
    }

    public nonDifferentiableFieldChanged(otherProps: Props) : boolean {
        /**
         * Changes to props can be combined in Command objects, but only if the field that was changed in the prop
         * is differentiable. Like a float number. This method checks to see if a non-differentiable field was changed, in which case 
         * treat the prop as discrete and not-updatable.
         */

        for (const key of this.nonDifferentiableFields) {
            if (this[key]!== otherProps[key]) return true;
        }

        return false;

    }

    public moreThanOneFieldChanged(otherProps: Props) : boolean {
        /* To merge commands, we need to make sure that only one prop was changed between commands. This is a helper for that. */

        // Make sure that only one field has changed between updates
        let diffCount = 0;

        // Get a union of keys from both objects
        const allKeys = new Set([...Object.keys(this), ...Object.keys(otherProps)]);
        allKeys.delete("nonDifferentiableFields")

        for (const key of allKeys) {
            const oldVal = this[key];
            const newVal = otherProps[key];

            // Check for inequality, treating NaN and undefined properly
            const valuesAreDifferent = 
            (oldVal !== newVal && !(Number.isNaN(oldVal) && Number.isNaN(newVal))) || 
            (oldVal === undefined && newVal !== undefined) || 
            (newVal === undefined && oldVal !== undefined);

            if (valuesAreDifferent) {
                diffCount++;
            }
        }

        return diffCount > 1;
    } 
}

export { LayerEnum };