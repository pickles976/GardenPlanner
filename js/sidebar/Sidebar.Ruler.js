import * as THREE from 'three';

import { UIPanel, UIRow, UIInput, UIButton, UIColor, UICheckbox, UIInteger, UITextArea, UIText, UINumber, UISpan } from '../libs/ui.js';
import { UIBoolean } from '../libs/ui.three.js';

import { SetPositionCommand } from '../commands/SetPositionCommand.js';
import { Strings } from './Strings.js';
import {eventBus, EventEnums} from '../EventBus.js';
import { contain } from 'three/src/extras/TextureUtils.js';
import { BedEditingUpdateCommand } from '../commands/BedEditingUpdateCommand.js';
import { snapper } from '../Snapping.js';

const strings = Strings({'language': 'en'});


function SidebarRuler( editor ) {


	const container = new UIPanel();
	container.setBorderTop( '0' );
	container.setPaddingTop( '20px' );
	container.setDisplay("Block")

	const label = new UIText("RULER")
	container.add(label)

	// Save Lines
	const saveLinesButton = new UIButton("Save Lines")
	saveLinesButton.setDisplay("none")

	// Save Vertices
	const saveVerticesbutton = new UIButton("Save Vertices")
	saveVerticesbutton.setDisplay("none")

	// Save Bed
	const saveRulerButton = new UIButton("✓ Save Ruler")
	saveRulerButton.setDisplay("none")

	// Cancel
	const cancelButton = new UIButton("Cancel");
	cancelButton.dom.style.color = "#FF8888"
	cancelButton.setDisplay("none")

	// Edit
	const editButton = new UIButton("Edit");
	editButton.setDisplay("none")

	// Bed Config
	const objectNameRow = new UIRow();
	const objectName = new UIInput().setWidth( '150px' ).setFontSize( '12px' ).onChange(update);
	objectName.setValue("New Ruler")
	objectNameRow.add( new UIText( "Ruler Name" ).setClass( 'Label' ) );
	objectNameRow.add( objectName );

	// const bedColorRow = new UIRow();
	// const bedColor = new UIColor().onInput( update );
	// bedColor.setValue(editor.bedEditor.bedColor)
	// bedColorRow.add( new UIText( "Bed Color" ).setClass( 'Border Color' ) );
	// bedColorRow.add(bedColor)

	const buttonContainer = new UIPanel();
	buttonContainer.setBorderTop( '1' );
	buttonContainer.setPaddingTop( '20px' );
	buttonContainer.add(saveLinesButton)
	buttonContainer.add(saveVerticesbutton)
	buttonContainer.add(saveRulerButton)
	buttonContainer.add(cancelButton)
	buttonContainer.add(editButton)

	const configContainer = new UIPanel();
	configContainer.setBorderTop( '1' );
	configContainer.setPaddingTop( '20px' );
	configContainer.add( objectNameRow );
	// configContainer.add( bedColorRow );
	configContainer.setDisplay("none");

	// Add sub-panels
	container.add(configContainer)
	container.add(buttonContainer)

	saveLinesButton.onClick(() => editor.rulerEditor.lineEditor.setVertexEditMode()) // TODO: control this via enum?
	saveVerticesbutton.onClick(() => eventBus.emit(EventEnums.RULER_VERTEX_EDITING_FINISHED)) // TODO: control this via enum?
	saveRulerButton.onClick(() => eventBus.emit(EventEnums.RULER_EDITING_FINISHED))
	cancelButton.onClick(() => eventBus.emit(EventEnums.RULER_EDITING_CANCELLED))
	editButton.onClick(() => eventBus.emit(EventEnums.RULER_EDITING_STARTED, editor.selector.currentSelectedObject))

	eventBus.on(EventEnums.RULER_CREATION_STARTED, () => {
		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		saveLinesButton.setDisplay("Block")
		saveVerticesbutton.setDisplay("none")
		saveRulerButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.RULER_VERTEX_EDITING_STARTED, () => {
		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		saveLinesButton.setDisplay("none")
		saveVerticesbutton.setDisplay("Block")
		saveRulerButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.RULER_VERTEX_EDITING_UPDATED, () => {
		updateFromEditor()
	})

	eventBus.on(EventEnums.RULER_VERTEX_EDITING_FINISHED, () => {
		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		saveLinesButton.setDisplay("none")
		saveVerticesbutton.setDisplay("none")
		saveRulerButton.setDisplay("Block");
		configContainer.setDisplay("Block")
	})

	eventBus.on(EventEnums.RULER_EDITING_FINISHED, () => {
		editButton.setDisplay("none");
		cancelButton.setDisplay("none");
		saveLinesButton.setDisplay("none")
		saveVerticesbutton.setDisplay("none")
		saveRulerButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.RULER_EDITING_CANCELLED, () => {
		editButton.setDisplay("none");
		cancelButton.setDisplay("none");
		saveLinesButton.setDisplay("none")
		saveVerticesbutton.setDisplay("none")
		saveRulerButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.RULER_SELECTED, (value) => {
		editButton.setDisplay(value ? "Block" : "none") 
	})

	eventBus.on(EventEnums.METRIC_CHANGED, () => {
		updateFromEditor();
	})

	function update() {
		// let props = {};
		// if (snapper.metric) {
		// 	props = {
		// 		"name": objectName.value,
		// 		"bedHeight": bedHeight.value, 
		// 		"borderHeight": borderHeight.value, 
		// 		"borderWidth": borderWidth.value,
		// 		"bedColor": bedColor.dom.value,
		// 		"borderColor": borderColor.dom.value
		// 	};
		// } else {
		// 	props = {
		// 		"name": objectName.value,
		// 		"bedHeight": snapper.inchesToMeters(bedHeight.value), 
		// 		"borderHeight": snapper.inchesToMeters(borderHeight.value), 
		// 		"borderWidth": snapper.inchesToMeters(borderWidth.value),
		// 		"bedColor": bedColor.dom.value,
		// 		"borderColor": borderColor.dom.value
		// 	};
		// }

		// const command = new BedEditingUpdateCommand(props, editor.bedEditor, updateFromEditor)
		// eventBus.emit(EventEnums.BED_CONFIG_UPDATED, command)
	}

	function updateFromEditor() {
		// bedColor.setValue(editor.bedEditor.bedColor)
	}

	return container;

}

export { SidebarRuler };
