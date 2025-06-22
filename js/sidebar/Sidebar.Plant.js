import * as THREE from 'three';

import { UIPanel, UIRow, UIInput, UIButton, UIColor, UICheckbox, UIInteger, UITextArea, UIText, UINumber } from '../libs/ui.js';
import { UIBoolean } from '../libs/ui.three.js';

import { SetPositionCommand } from '../commands/SetPositionCommand.js';
import { Strings } from './Strings.js';
import {eventBus, EventEnums} from '../EventBus.js';
import { BedEditingUpdateCommand } from '../commands/BedEditingUpdateCommand.js';
import { snapper } from '../Snapping.js';
import { contain } from 'three/src/extras/TextureUtils.js';

const strings = Strings({'language': 'en'});


function SidebarPlant( editor ) {


	const container = new UIPanel();
	container.setBorderTop( '0' );
	container.setPaddingTop( '20px' );
	container.setDisplay("Block")

	const label = new UIText("PLANT")
	container.add(label)

	// // Create
	// const createNewButton = new UIButton("+ Create New");

	// // Save Polygon
	// const saveButton = new UIButton("✓ Save Polygon")
	// saveButton.dom.style.color = "#AAFFAA"
	// saveButton.setDisplay("none")

	// const buttonContainer = new UIPanel();
	// buttonContainer.setBorderTop( '1' );
	// buttonContainer.setPaddingTop( '20px' );
	// buttonContainer.add(createNewButton)
	// buttonContainer.add(saveButton)

	const objectNameRow = new UIRow();
	const objectName = new UIInput().setWidth( '150px' ).setFontSize( '12px' ).onChange(update);
	objectName.setValue("New Plant")
	objectNameRow.add( new UIText( "Plant Name" ).setClass( 'Label' ) );
	objectNameRow.add( objectName );
	objectNameRow.setDisplay("none")

	// // Add sub-panels
	// container.add(buttonContainer)
	container.add(objectNameRow)

	eventBus.on(EventEnums.PLANT_SELECTED, (value) => {

		if (value) {
			objectNameRow.setDisplay("Block")
			const plant = editor.selector.currentSelectedObject;
			objectName.setValue(plant.name);
		} else {
			objectNameRow.setDisplay("none")
		}

	})

	function update() {

	}

	function updateFromEditor() {

	}

	return container;

}

export { SidebarPlant };
