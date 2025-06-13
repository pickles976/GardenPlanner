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

    const showGridRow = new UIRow();
	const showGridCheck = new UICheckbox();
    showGridCheck.setValue(true)
	showGridRow.add(showGridCheck)
    showGridRow.add( new UIText( "Show Grid" ));

    const snapRow = new UIRow();
	const snapCheck = new UICheckbox();
    snapCheck.setValue(true)
	snapRow.add(snapCheck)
    snapRow.add( new UIText( "Snap to Grid" ));

    const metricRow = new UIRow();
    const metricCheck = new UICheckbox();
    metricCheck.setValue(snapper.metric)
    metricRow.add(metricCheck)
    metricRow.add(new UIText("Metric System"))

    container.add(showGridRow)
    container.add(snapRow)
    container.add(metricRow)

    showGridCheck.onClick(() => eventBus.emit(EventEnums.GRID_VISIBILITY_CHANGED, showGridCheck.getValue()))
	snapCheck.onClick(() => eventBus.emit(EventEnums.SNAP_CHANGED, snapCheck.getValue()))
    metricCheck.onClick(() => eventBus.emit(EventEnums.METRIC_CHANGED, metricCheck.getValue()))

	return container;

}

export { SidebarGlobals };
