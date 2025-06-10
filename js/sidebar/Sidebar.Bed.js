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
	container.setDisplay("Block")

	// Create
	const createNewButton = new UIButton("+ Create New");

	// Save Polygon
	const saveButton = new UIButton("✓ Save Polygon")
	saveButton.setDisplay("none")

	// Save Bed
	const saveBedButton = new UIButton("✓ Save Bed")
	saveBedButton.setDisplay("none")

	// Cancel
	const cancelButton = new UIButton("Cancel");
	cancelButton.setDisplay("none")

	// Area
	const areaRow = new UIRow();
	const area = new UINumber().setUnit( 'm²' ).setWidth( '50px' )
	area.dom.style.pointerEvents = 'none'

	areaRow.add( new UIText( "Bed Area" ).setClass( 'Label' ) );
	areaRow.add(area);

	// Volume
	const volumeRow = new UIRow();
	const volume = new UINumber().setUnit( 'm³' ).setWidth( '50px' )
	volume.dom.style.pointerEvents = 'none'

	volumeRow.add( new UIText( "Bed Volume" ).setClass( 'Label' ) );
	volumeRow.add(volume);

	// Bed Config
	const objectNameRow = new UIRow();
	const objectName = new UIInput().setWidth( '150px' ).setFontSize( '12px' ).onChange(update);
	objectName.setValue("New Bed")
	objectNameRow.add( new UIText( "Bed Name" ).setClass( 'Label' ) );
	objectNameRow.add( objectName );


	const bedHeightRow = new UIRow();
	const bedHeight = new UINumber().setStep( 0.1 ).setNudge( 0.01 ).setUnit( 'm' ).setWidth( '50px' ).onChange( update );
	bedHeight.setValue(editor.bedEditor.bedHeight);
	bedHeightRow.add( new UIText( "Bed Height" ).setClass( 'Label' ) );
	bedHeightRow.add( bedHeight );

	const borderHeightRow = new UIRow();
	const borderHeight = new UINumber().setStep( 0.1 ).setNudge( 0.01 ).setUnit( 'm' ).setWidth( '50px' ).onChange( update );
	borderHeight.setValue(editor.bedEditor.borderHeight);
	borderHeightRow.add( new UIText( "Border Height" ).setClass( 'Label' ) );
	borderHeightRow.add( borderHeight );

	const borderWidthRow = new UIRow();
	const borderWidth = new UINumber().setStep( 0.1 ).setNudge( 0.01 ).setUnit( 'm' ).setWidth( '50px' ).onChange( update );
	borderWidth.setValue(editor.bedEditor.borderWidth);
	borderWidthRow.add( new UIText( "Border Width" ).setClass( 'Label' ) );
	borderWidthRow.add( borderWidth );

	const bedColorRow = new UIRow();
	const bedColor = new UIColor().onInput( update );
	bedColor.setValue(editor.bedEditor.bedColor)
	bedColorRow.add( new UIText( "Bed Color" ).setClass( 'Border Color' ) );
	bedColorRow.add(bedColor)

	const borderColorRow = new UIRow();
	const borderColor = new UIColor().onInput( update );
	borderColor.setValue(editor.bedEditor.borderColor)
	borderColorRow.add( new UIText( "Border Color" ).setClass( 'Border Color' ) );
	borderColorRow.add(borderColor)

	const buttonContainer = new UIPanel();
	buttonContainer.setBorderTop( '1' );
	buttonContainer.setPaddingTop( '20px' );
	buttonContainer.add(createNewButton)
	buttonContainer.add(saveButton)
	buttonContainer.add(saveBedButton)
	buttonContainer.add(cancelButton)

	const configContainer = new UIPanel();
	configContainer.setBorderTop( '1' );
	configContainer.setPaddingTop( '20px' );
	configContainer.add( objectNameRow );
	configContainer.add( bedHeightRow );
	configContainer.add( borderHeightRow );
	configContainer.add( borderWidthRow );
	configContainer.add(bedColorRow);
	configContainer.add( borderColorRow );
	configContainer.setDisplay("none");
	
	const dimensionContainer = new UIPanel();
	dimensionContainer.setBorderTop( '1' );
	dimensionContainer.setPaddingTop( '20px' );
	dimensionContainer.add(areaRow);
	dimensionContainer.add(volumeRow);
	dimensionContainer.setDisplay("none");

	// Add sub-panels
	container.add(buttonContainer)
	container.add(configContainer)
	container.add(dimensionContainer)

	createNewButton.onClick(() => eventBus.emit(EventEnums.BED_EDITING_STARTED))
	saveButton.onClick(() => eventBus.emit(EventEnums.VERTEX_EDITING_FINISHED))
	saveBedButton.onClick(() => eventBus.emit(EventEnums.BED_EDITING_FINISHED))
	cancelButton.onClick(() => eventBus.emit(EventEnums.BED_EDITING_CANCELLED))

	eventBus.on(EventEnums.BED_EDITING_STARTED, () => {
		cancelButton.setDisplay("Block");
		saveButton.setDisplay("none");
		saveBedButton.setDisplay("none");
		createNewButton.setDisplay("none");
		dimensionContainer.setDisplay("none")
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.VERTEX_EDITING_STARTED, () => {
		cancelButton.setDisplay("Block");
		saveButton.setDisplay("Block");
		saveBedButton.setDisplay("none");
		createNewButton.setDisplay("none");
		dimensionContainer.setDisplay("Block")
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.VERTEX_EDITING_UPDATED, () => {
		updateFromEditor()
	})

	eventBus.on(EventEnums.VERTEX_EDITING_FINISHED, () => {
		cancelButton.setDisplay("Block");
		saveButton.setDisplay("none");
		saveBedButton.setDisplay("Block");
		createNewButton.setDisplay("none");
		dimensionContainer.setDisplay("Block")
		configContainer.setDisplay("Block")
	})

	eventBus.on(EventEnums.BED_EDITING_FINISHED, () => {
		cancelButton.setDisplay("none");
		saveButton.setDisplay("none");
		saveBedButton.setDisplay("none");
		createNewButton.setDisplay("Block");
		dimensionContainer.setDisplay("none")
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.BED_EDITING_CANCELLED, () => {
		cancelButton.setDisplay("none");
		saveButton.setDisplay("none");
		saveBedButton.setDisplay("none");
		createNewButton.setDisplay("Block");
		dimensionContainer.setDisplay("none")
		configContainer.setDisplay("none")
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
