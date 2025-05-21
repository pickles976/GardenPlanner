import * as THREE from 'three';
import { Editor } from './Editor';
import { Selector } from './Selector';

export function handleMouseMove(editor: Editor, selector: Selector, object?: THREE.Object3D) {
    /**
     * Function that highlights objects when the mouse is over them, and returns them to their original color once the mouse has left.
     */

    console.log(object)

    // If mouse is not over an object
    if (object === undefined) {
        if (selector.currentMousedOverObject !== undefined) { 
            if (selector.currentMousedOverObject.material.emissive !== undefined) {
                selector.currentMousedOverObject.material.emissive = selector.oldColor;
            }
        } 
        selector.currentMousedOverObject = undefined;
        selector.oldColor = undefined;
    } else {
        // Return old color
        if (selector.currentMousedOverObject !== undefined && selector.currentMousedOverObject.material.emissive !== undefined) {
            selector.currentMousedOverObject.material.emissive.setHex(selector.oldColor)
        }

        // Save new color
        if (object.material.emissive !== undefined) {
            selector.oldColor = object.material.emissive.getHex();
            object.material.emissive.setHex(0xFFFF00);
        }

        selector.currentMousedOverObject = object;

    }
}