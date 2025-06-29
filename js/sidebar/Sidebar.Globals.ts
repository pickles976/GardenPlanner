import * as THREE from 'three';

import { UIPanel, UIRow, UIInput, UIButton, UIColor, UICheckbox, UIInteger, UITextArea, UIText, UINumber } from '../libs/ui.js';

import { Strings } from './Strings.js';
import {eventBus, EventEnums} from '../EventBus.js';
import { snapper } from '../Snapping.js';
import { Editor } from '../Editor.js';

const strings = Strings({'language': 'en'});


class SidebarGlobals {

    editor: Editor;
    container: UIPanel;

    snapRow: UIRow;
    metricRow: UIRow;
    grassRow: UIRow;

    snapCheck: UICheckbox;
    metricCheck: UICheckbox;
    grassCheck: UICheckbox;


    constructor ( editor: Editor ) {
        this.editor = editor;

        this.container = new UIPanel();
        this.container.setBorderTop( '0' );
        this.container.setPaddingTop( '20px' );
        this.container.setDisplay("Block")

        this.snapRow = new UIRow();
        this.snapCheck = new UICheckbox();
        this.snapCheck.setValue(true);
        this.snapRow.add(this.snapCheck);
        this.snapRow.add( new UIText( " Snap to Grid" ));
        this.snapRow.add( new UIText( "SHIFT+S" ).setClass( 'key' ));

        this.metricRow = new UIRow();
        this.metricCheck = new UICheckbox();
        this.metricCheck.setValue(snapper.metric);
        this.metricRow.add(this.metricCheck);
        this.metricRow.add(new UIText(" Metric System"));
        this.metricRow.add( new UIText( "SHIFT+M" ).setClass( 'key' ));

        this.grassRow = new UIRow();
        this.grassCheck = new UICheckbox();
        this.grassCheck.setValue(snapper.metric);
        this.grassRow.add(this.grassCheck);
        this.grassRow.add(new UIText(" Show Grass"));
        this.grassRow.add( new UIText( "G" ).setClass( 'key' ));

        this.container.add(this.snapRow)
        this.container.add(this.metricRow)
        this.container.add(this.grassRow)

        this.snapCheck.onClick(() => eventBus.emit(EventEnums.SNAP_CHANGED, this.snapCheck.getValue()))
        this.metricCheck.onClick(() => eventBus.emit(EventEnums.METRIC_CHANGED, this.metricCheck.getValue()))
        this.grassCheck.onClick(() => eventBus.emit(EventEnums.GRASS_CHANGED, this.grassCheck.getValue()))
    }

    public handleKeyDown(e) {

        if (e.shiftKey) {
            switch (e.code) {
                case 'KeyS':
                    this.snapCheck.setValue(!this.snapCheck.getValue());
                    eventBus.emit(EventEnums.SNAP_CHANGED, this.snapCheck.getValue());
                    break;
                case 'KeyM':
                    this.metricCheck.setValue(!this.metricCheck.getValue());
                    eventBus.emit(EventEnums.METRIC_CHANGED, this.metricCheck.getValue());
                    break;
            }

        }

        if (e.code === "KeyG") {
            this.grassCheck.setValue(!this.grassCheck.getValue())
            eventBus.emit(EventEnums.GRASS_CHANGED, this.grassCheck.getValue());
        } 

    }

}

export { SidebarGlobals };
