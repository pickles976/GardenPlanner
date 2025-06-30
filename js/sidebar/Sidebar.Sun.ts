import * as THREE from 'three';

import { UIPanel, UIRow, UIInput, UIButton, UIColor, UICheckbox, UIInteger, UITextArea, UIText, UINumber } from '../libs/ui.js';

import { Strings } from './Strings.js';
import {eventBus, EventEnums} from '../EventBus.js';
import { snapper } from '../Snapping.js';
import { Editor } from '../Editor.js';

const strings = Strings({'language': 'en'});


class SidebarSun {

    editor: Editor;
    container: UIPanel;

    coordsRow: UIRow;
    latitude: UINumber;
    longitude: UINumber;

    constructor ( editor: Editor ) {
        this.editor = editor;

        this.container = new UIPanel();
        this.container.setBorderTop( '0' );
        this.container.setPaddingTop( '20px' );
        this.container.setDisplay("Block")

        this.coordsRow = new UIRow();
        this.latitude = new UINumber().setPrecision( 3 ).setWidth( '50px' ).onChange( this.update ).setUnit('°');
        this.longitude = new UINumber().setPrecision( 3 ).setWidth( '50px' ).onChange( this.update ).setUnit('°');
    
        this.coordsRow.add( new UIText( "Coordinates" ).setClass( 'Label' ) );
        this.coordsRow.add( this.latitude, this.longitude );

        this.container.add(this.coordsRow)
    }

    private update() {

    }

    // public handleKeyDown(e) {

    //     if (e.shiftKey) {
    //         switch (e.code) {
    //             case 'KeyS':
    //                 this.snapCheck.setValue(!this.snapCheck.getValue());
    //                 eventBus.emit(EventEnums.SNAP_CHANGED, this.snapCheck.getValue());
    //                 break;
    //             case 'KeyM':
    //                 this.metricCheck.setValue(!this.metricCheck.getValue());
    //                 eventBus.emit(EventEnums.METRIC_CHANGED, this.metricCheck.getValue());
    //                 break;
    //         }
    //         return;
    //     }

    //     if (e.code === "KeyG") {
    //         this.grassCheck.setValue(!this.grassCheck.getValue())
    //         eventBus.emit(EventEnums.GRASS_CHANGED, this.grassCheck.getValue());
    //     } 

    // }

}

export { SidebarSun };
