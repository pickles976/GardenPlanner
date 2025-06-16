import * as THREE from 'three';

import { UIPanel, UIRow, UIInput, UIButton, UIColor, UICheckbox, UIInteger, UITextArea, UIText, UINumber } from '../libs/ui.js';

import { Strings } from './Strings.js';
import {eventBus, EventEnums} from '../EventBus.js';
import { snapper } from '../Snapping.js';

const strings = Strings({'language': 'en'});


function SidebarGlobals( editor ) {


	const container = new UIPanel();
	container.setBorderTop( '0' );
	container.setPaddingTop( '20px' );
	container.setDisplay("Block")

    const cameraRow = new UIRow();
	const cameraCheck = new UICheckbox();
    cameraCheck.setValue(false)
	cameraRow.add(cameraCheck)
    cameraRow.add( new UIText( " Top-Down Camera" ));

    const showGridRow = new UIRow();
	const showGridCheck = new UICheckbox();
    showGridCheck.setValue(true)
	showGridRow.add(showGridCheck)
    showGridRow.add( new UIText( " Show Grid" ));

    const snapRow = new UIRow();
	const snapCheck = new UICheckbox();
    snapCheck.setValue(true)
	snapRow.add(snapCheck)
    snapRow.add( new UIText( " Snap to Grid" ));

    const metricRow = new UIRow();
    const metricCheck = new UICheckbox();
    metricCheck.setValue(snapper.metric)
    metricRow.add(metricCheck)
    metricRow.add(new UIText(" Metric System"))

    const transformRow = new UIRow();
    const transformCheck = new UICheckbox();
    transformCheck.setValue(false)
    transformRow.add(transformCheck)
    transformRow.add(new UIText(" Advanced Transform"))

    container.add(cameraRow)
    container.add(showGridRow)
    container.add(snapRow)
    container.add(metricRow)
    container.add(transformRow)

    cameraCheck.onClick(() => eventBus.emit(EventEnums.CAMERA_CHANGED, cameraCheck.getValue()))
    showGridCheck.onClick(() => eventBus.emit(EventEnums.GRID_VISIBILITY_CHANGED, showGridCheck.getValue()))
	snapCheck.onClick(() => eventBus.emit(EventEnums.SNAP_CHANGED, snapCheck.getValue()))
    metricCheck.onClick(() => eventBus.emit(EventEnums.METRIC_CHANGED, metricCheck.getValue()))
    transformCheck.onClick(() => eventBus.emit(EventEnums.TRANSFORM_MODE_CHANGED, transformCheck.getValue()))

    eventBus.on(EventEnums.CHANGE_CAMERA_UI, (value) => cameraCheck.setValue(value))

	return container;

}

export { SidebarGlobals };
