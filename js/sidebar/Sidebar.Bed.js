import * as THREE from 'three';

import { UIPanel, UIRow, UIInput, UIButton, UIColor, UICheckbox, UIInteger, UITextArea, UIText, UINumber } from '../libs/ui.js';
import { UIBoolean } from '../libs/ui.three.js';

import { SetPositionCommand } from '../commands/SetPositionCommand.js';
import { Strings } from './Strings.js';
import {eventBus, EventEnums} from '../EventBus.js';
import { contain } from 'three/src/extras/TextureUtils.js';

const strings = Strings({'language': 'en'});


function SidebarBed( editor ) {


	const container = new UIPanel();
	container.setBorderTop( '0' );
	container.setPaddingTop( '20px' );
	container.setDisplay( 'none' );

	// Create
	const createNewButton = new UIButton("+ Create New");

	// Save
	const saveButton = new UIButton("Save Polygon")
	saveButton.setDisplay("none")

	// Cancel
	const cancelButton = new UIButton("Cancel");
	cancelButton.setDisplay("none")

	container.add(createNewButton)
	container.add(saveButton)
	container.add(cancelButton)
	container.setDisplay("Block")

	// Area
	const areaRow = new UIRow();
	const area = new UINumber().setUnit( 'm²' ).setWidth( '50px' )
	area.dom.style.pointerEvents = 'none'

	areaRow.add( new UIText( "Bed Area" ).setClass( 'Label' ) );
	areaRow.add(area);
	areaRow.setDisplay("none");


	// Volume
	const volumeRow = new UIRow();
	const volume = new UINumber().setUnit( 'm³' ).setWidth( '50px' )
	volume.dom.style.pointerEvents = 'none'

	volumeRow.add( new UIText( "Bed Volume" ).setClass( 'Label' ) );
	volumeRow.add(volume);
	volumeRow.setDisplay("none");


	// Bed Config
	const objectNameRow = new UIRow();
	const objectName = new UIInput().setWidth( '150px' ).setFontSize( '12px' ).onChange(update);
	objectName.setValue("New Bed")
	objectNameRow.add( new UIText( "Bed Name" ).setClass( 'Label' ) );
	objectNameRow.add( objectName );
	objectNameRow.setDisplay("none")


	const bedHeightRow = new UIRow();
	const bedHeight = new UINumber().setStep( 0.1 ).setNudge( 0.01 ).setUnit( 'm' ).setWidth( '50px' ).onChange( update );
	bedHeight.setValue(editor.bedEditor.bedHeight);
	bedHeightRow.add( new UIText( "Bed Height" ).setClass( 'Label' ) );
	bedHeightRow.add( bedHeight );
	bedHeightRow.setDisplay("none")

	const borderHeightRow = new UIRow();
	const borderHeight = new UINumber().setStep( 0.1 ).setNudge( 0.01 ).setUnit( 'm' ).setWidth( '50px' ).onChange( update );
	borderHeight.setValue(editor.bedEditor.borderHeight);
	borderHeightRow.add( new UIText( "Border Height" ).setClass( 'Label' ) );
	borderHeightRow.add( borderHeight );
	borderHeightRow.setDisplay("none")

	const borderWidthRow = new UIRow();
	const borderWidth = new UINumber().setStep( 0.1 ).setNudge( 0.01 ).setUnit( 'm' ).setWidth( '50px' ).onChange( update );
	borderWidth.setValue(editor.bedEditor.borderWidth);
	borderWidthRow.add( new UIText( "Border Width" ).setClass( 'Label' ) );
	borderWidthRow.add( borderWidth );
	borderWidthRow.setDisplay("none")

	const bedColorRow = new UIRow();
	const bedColor = new UIColor().onInput( update );
	bedColor.setValue(editor.bedEditor.bedColor)
	bedColorRow.add( new UIText( "Bed Color" ).setClass( 'Border Color' ) );
	bedColorRow.add(bedColor)
	bedColorRow.setDisplay("none")

	const borderColorRow = new UIRow();
	const borderColor = new UIColor().onInput( update );
	borderColor.setValue(editor.bedEditor.borderColor)
	borderColorRow.add( new UIText( "Border Color" ).setClass( 'Border Color' ) );
	borderColorRow.add(borderColor)
	borderColorRow.setDisplay("none")

	container.add( objectNameRow );

	container.add( bedHeightRow );
	container.add( borderHeightRow );
	container.add( borderWidthRow );

	container.add(bedColorRow);
	container.add( borderColorRow );

	container.add(areaRow);
	container.add(volumeRow);

	createNewButton.onClick(() => eventBus.emit(EventEnums.BED_EDITING_STARTED))
	saveButton.onClick(() => eventBus.emit(EventEnums.VERTEX_EDITING_FINISHED))
	cancelButton.onClick(() => eventBus.emit(EventEnums.BED_EDITING_CANCELLED))

	eventBus.on(EventEnums.BED_EDITING_STARTED, () => {
		console.log("bedEditingStarted")
		cancelButton.setDisplay("Block");
		saveButton.setDisplay("none");
		createNewButton.setDisplay("none");
		bedHeightRow.setDisplay("none")
		borderHeightRow.setDisplay("none")
		borderWidthRow.setDisplay("none")
		borderColorRow.setDisplay("none")
		bedColorRow.setDisplay("none")
		objectNameRow.setDisplay("none")
	})

	eventBus.on(EventEnums.VERTEX_EDITING_STARTED, () => {
		console.log("vertexEditingStarted")
		cancelButton.setDisplay("Block");
		saveButton.setDisplay("Block");
		createNewButton.setDisplay("none");
		bedHeightRow.setDisplay("none")
		areaRow.setDisplay("Block")
	})

	eventBus.on(EventEnums.VERTEX_EDITING_UPDATED, () => {
		updateFromEditor()
	})

	eventBus.on(EventEnums.VERTEX_EDITING_FINISHED, () => {
		console.log("vertexEditingFinished")
		cancelButton.setDisplay("none");
		saveButton.setDisplay("none");
		createNewButton.setDisplay("none");
		bedHeightRow.setDisplay("Block")
		borderHeightRow.setDisplay("Block")
		borderWidthRow.setDisplay("Block")
		volumeRow.setDisplay("Block");
		borderColorRow.setDisplay("Block")
		bedColorRow.setDisplay("Block")
		objectNameRow.setDisplay("Block")
	})

	eventBus.on(EventEnums.BED_EDITING_FINISHED, () => {
		console.log("bedEditingFinished")
		cancelButton.setDisplay("none");
		saveButton.setDisplay("none");
		createNewButton.setDisplay("Block");
		bedHeightRow.setDisplay("none")
		borderWidthRow.setDisplay("none")
		areaRow.setDisplay("none")
		volumeRow.setDisplay("none");
		borderColorRow.setDisplay("none")
		bedColorRow.setDisplay("none")
		objectNameRow.setDisplay("none")
	})

	eventBus.on(EventEnums.BED_EDITING_CANCELLED, () => {
		console.log("bedEditingCancelled")
		cancelButton.setDisplay("none");
		saveButton.setDisplay("none");
		createNewButton.setDisplay("Block");
		bedHeightRow.setDisplay("none")
	})

	function update() {
		eventBus.emit(EventEnums.BED_EDITING_UPDATED, {
			"name": objectName.value,
			"height": bedHeight.value, 
			"borderHeight": borderHeight.value, 
			"borderWidth": borderWidth.value,
			"bedColor": bedColor.dom.value,
			"borderColor": borderColor.dom.value
		})
		updateFromEditor()
	}

	function updateFromEditor() {

		const a = editor.bedEditor.getArea();
		area.setValue(a)
		if (volume.display !== "none") {
			volume.setValue(a * bedHeight.value);
		}
	}

	return container;

}

export { SidebarBed };
