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

    cameraRow: UIRow;
    showGridRow: UIRow;
    snapRow: UIRow;
    metricRow: UIRow;
    transformRow: UIRow;

    cameraCheck: UICheckbox;
    showGridCheck: UICheckbox;
    snapCheck: UICheckbox;
    metricCheck: UICheckbox;
    transformCheck: UICheckbox;


    constructor ( editor: Editor ) {
        this.editor = editor;

        this.container = new UIPanel();
        this.container.setBorderTop( '0' );
        this.container.setPaddingTop( '20px' );
        this.container.setDisplay("Block")

        this.cameraRow = new UIRow();
        this.cameraCheck = new UICheckbox();
        this.cameraCheck.setValue(false);
        this.cameraRow.add(this.cameraCheck);
        this.cameraRow.add(new UIText(" Top-Down Camera"));
        this.cameraRow.add( new UIText( "SHIFT+C" ).setClass( 'key' ));

        this.showGridRow = new UIRow();
        this.showGridCheck = new UICheckbox();
        this.showGridCheck.setValue(true);
        this.showGridRow.add(this.showGridCheck);
        this.showGridRow.add( new UIText( " Show Grid" ));
        this.showGridRow.add( new UIText( "SHIFT+G" ).setClass( 'key' ));

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

        this.transformRow = new UIRow();
        this.transformCheck = new UICheckbox();
        this.transformCheck.setValue(false);
        this.transformRow.add(this.transformCheck);
        this.transformRow.add(new UIText(" Advanced Transform"));
        this.transformRow.add( new UIText( "SHIFT+T" ).setClass( 'key' ));

        this.container.add(this.cameraRow)
        this.container.add(this.showGridRow)
        this.container.add(this.snapRow)
        this.container.add(this.metricRow)
        this.container.add(this.transformRow)

        this.cameraCheck.onClick(() => eventBus.emit(EventEnums.CAMERA_CHANGED, this.cameraCheck.getValue()))
        this.showGridCheck.onClick(() => eventBus.emit(EventEnums.GRID_VISIBILITY_CHANGED, this.showGridCheck.getValue()))
        this.snapCheck.onClick(() => eventBus.emit(EventEnums.SNAP_CHANGED, this.snapCheck.getValue()))
        this.metricCheck.onClick(() => eventBus.emit(EventEnums.METRIC_CHANGED, this.metricCheck.getValue()))
        this.transformCheck.onClick(() => eventBus.emit(EventEnums.TRANSFORM_MODE_CHANGED, this.transformCheck.getValue()))

        eventBus.on(EventEnums.CHANGE_CAMERA_UI, (value) => this.cameraCheck.setValue(value))
    }

    // TODO: move this up a level
    public handleKeyDown(e) {
        if (e.shiftKey) {
            switch (e.code) {
                case 'KeyC':
                    this.cameraCheck.setValue(!this.cameraCheck.getValue());
                    eventBus.emit(EventEnums.CAMERA_CHANGED, this.cameraCheck.getValue());
                    break;
                case 'KeyG':
                    this.showGridCheck.setValue(!this.showGridCheck.getValue());
                    eventBus.emit(EventEnums.GRID_VISIBILITY_CHANGED, this.showGridCheck.getValue());
                    break;
                case 'KeyS':
                    this.snapCheck.setValue(!this.snapCheck.getValue());
                    eventBus.emit(EventEnums.SNAP_CHANGED, this.snapCheck.getValue());
                    break;
                case 'KeyM':
                    this.metricCheck.setValue(!this.metricCheck.getValue());
                    eventBus.emit(EventEnums.METRIC_CHANGED, this.metricCheck.getValue());
                    break;
                case 'KeyT':
                    this.transformCheck.setValue(!this.transformCheck.getValue());
                    eventBus.emit(EventEnums.TRANSFORM_MODE_CHANGED, this.transformCheck.getValue());
                    break;
            }

        }
    }

}

export { SidebarGlobals };
