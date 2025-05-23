import * as THREE from 'three';
import { Editor } from './Editor';
import { Selector } from './Selector';
import { render } from './Rendering';
import { eventBus } from './EventBus';

export function handleMouseMove(editor: Editor, object?: THREE.Mesh) {
    /**
     * Function that highlights objects when the mouse is over them, and returns them to their original color once the mouse has left.
     */

    const selector = editor.selector;

    if (selector.currentMousedOverObject === object) {
        return
    }

    // If object is unselectable
    if (object === undefined) {
        // Un-highlight old mouseOverObject
        if (selector.currentMousedOverObject !== undefined) { 
            selector.currentMousedOverObject.material.emissive.setHex(0x000000)
        } 
        selector.currentMousedOverObject = undefined;
    } else {
        // Un-highlight old mouseOverObject
        if (selector.currentMousedOverObject !== undefined) {
            selector.currentMousedOverObject.material.emissive.setHex(0x000000)
        }

        // Highlight new mouseOverObject
        selector.currentMousedOverObject = object;
        object.material.emissive.setHex(0xFFFF00);

    }
}

export function handleMouseClick(editor: Editor, object?: THREE.Mesh) {
    /**
     * Function that attaches transform controls to an object when clicked.
     */

    // Don't do anything if we are actively using the transform controls
    if (editor.selector.isUsingTransformControls === true) {
        return
    }

    editor.selector.select(object)

}


export function handleKeyDown(event, editor: Editor) {
    switch ( event.key ) {

        case 't':
            editor.transformControls.setMode( 'translate' );
            break;

        case 'r':
            editor.transformControls.setMode( 'rotate' );
            break;

        case 's':
            editor.transformControls.setMode( 'scale' );
            break;

        case '+':
        case '=':
            editor.transformControls.setSize( editor.transformControls.size + 0.1 );
            break;

        case '-':
        case '_':
            editor.transformControls.setSize( Math.max( editor.transformControls.size - 0.1, 0.1 ) );
            break;

        case 'x':
            editor.transformControls.showX = ! editor.transformControls.showX;
            break;

        case 'y':
            editor.transformControls.showY = ! editor.transformControls.showY;
            break;

        case 'z':

            if (event.ctrlKey) {
                const command = editor.commandStack.pop();
                command?.undo();
                render(editor);
            } else {
                editor.transformControls.showZ = ! editor.transformControls.showZ;
            }

            break;

        case ' ':
            editor.transformControls.enabled = ! editor.transformControls.enabled;
            break;

        // case 'Escape':
        //     editor.transformControls.reset();
        //     break;

    }
}
