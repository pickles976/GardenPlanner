import * as THREE from 'three';

import { UIPanel, UIRow, UIInput, UIButton, UIColor, UICheckbox, UIInteger, UITextArea, UIText, UINumber, UISpan } from '../libs/ui.js';
import { UIBoolean } from '../libs/ui.three.js';

import { SetPositionCommand } from '../commands/SetPositionCommand.js';
import { Strings } from './Strings.js';
import {eventBus, EventEnums} from '../EventBus.js';
import { contain } from 'three/src/extras/TextureUtils.js';
import { snapper } from '../Snapping.js';
import { PropUpdateCommand } from '../commands/PropUpdateCommand.js';
import { FenceProps } from '../editors/FenceEditor.js';

const strings = Strings({'language': 'en'});


function SidebarFence( editor ) {


	const container = new UIPanel();
	container.setBorderTop( '0' );
	container.setPaddingTop( '20px' );
	container.setDisplay("Block")

	const label = new UIText("FENCE")
	container.add(label)

	// Save Lines
	const saveLinesButton = new UIButton("✓ Save Lines")
	saveLinesButton.dom.style.color = "#AAFFAA"
	saveLinesButton.setDisplay("none")

	// Save Polygon
	const savePolygonButton = new UIButton("✓ Save Vertices")
	savePolygonButton.dom.style.color = "#AAFFAA"
	savePolygonButton.setDisplay("none")

	// Save Bed
	const saveObjectButton = new UIButton("✓ Save Fence")
	saveObjectButton.setDisplay("none")

	// Cancel
	const cancelButton = new UIButton("Cancel");
	cancelButton.dom.style.color = "#FF8888"
	cancelButton.setDisplay("none")

	// Edit
	const editButton = new UIButton("Edit");
	editButton.setDisplay("none")

	// Config
	const objectNameRow = new UIRow();
	const objectName = new UIInput().setWidth( '150px' ).setFontSize( '12px' ).onChange(update);
	objectName.setValue("New Fence")
	objectNameRow.add( new UIText( "Fence Name" ).setClass( 'Label' ) );
	objectNameRow.add( objectName );

	const fenceHeightRow = new UIRow();
	const fenceHeight = new UINumber().setStep( 0.1 ).setNudge( 0.01 ).setUnit( 'm' ).setWidth( '50px' ).onChange( update );
	fenceHeight.setValue(editor.fenceEditor.fenceHeight);
	fenceHeightRow.add( new UIText( "Fence Height" ).setClass( 'Label' ) );
	fenceHeightRow.add( fenceHeight );

	const fenceColorRow = new UIRow();
	const fenceColor = new UIColor().onInput( update );
	fenceColor.setValue(editor.fenceEditor.fenceColor)
	fenceColorRow.add( new UIText( "Fence Color" ).setClass( "Label" ) );
	fenceColorRow.add(fenceColor)

	const shadowRow = new UIRow();
	const shadowCheck = new UICheckbox().onInput(update);
	shadowCheck.setValue(true);
	shadowRow.add(new UIText("Cast Shadow").setClass("Label"));
	shadowRow.add(shadowCheck);

	const buttonContainer = new UIPanel();
	buttonContainer.setBorderTop( '1' );
	buttonContainer.setPaddingTop( '20px' );
	buttonContainer.add(saveLinesButton)
	buttonContainer.add(savePolygonButton)
	buttonContainer.add(saveObjectButton)
	buttonContainer.add(cancelButton)
	buttonContainer.add(editButton)

	const configContainer = new UIPanel();
	configContainer.setBorderTop( '1' );
	configContainer.setPaddingTop( '20px' );
	configContainer.add( objectNameRow );
	configContainer.add( fenceHeightRow );
	configContainer.add(fenceColorRow);
	configContainer.add(shadowRow);
	configContainer.setDisplay("none");

	// Add sub-panels
	container.add(configContainer)
	container.add(buttonContainer)

	saveLinesButton.onClick(() => editor.fenceEditor.lineEditor.setVertexEditMode())
	savePolygonButton.onClick(() => eventBus.emit(EventEnums.FENCE_VERTEX_EDITING_FINISHED))
	saveObjectButton.onClick(() => eventBus.emit(EventEnums.FENCE_EDITING_FINISHED))
	cancelButton.onClick(() => eventBus.emit(EventEnums.FENCE_EDITING_CANCELLED))
	editButton.onClick(() => eventBus.emit(EventEnums.FENCE_EDITING_STARTED, editor.selector.currentSelectedObject))

	eventBus.on(EventEnums.FENCE_CREATION_STARTED, () => {
		saveLinesButton.setDisplay("Block")
		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		savePolygonButton.setDisplay("none");
		saveObjectButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.FENCE_VERTEX_EDITING_STARTED, () => {
		saveLinesButton.setDisplay("none")
		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		savePolygonButton.setDisplay("Block");
		saveObjectButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.FENCE_VERTEX_EDITING_UPDATED, () => {
		updateFromEditor()
	})

	eventBus.on(EventEnums.FENCE_VERTEX_EDITING_FINISHED, () => {
		saveLinesButton.setDisplay("none")
		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		savePolygonButton.setDisplay("none");
		saveObjectButton.setDisplay("Block");
		configContainer.setDisplay("Block")
	})

	eventBus.on(EventEnums.FENCE_EDITING_FINISHED, () => {
		saveLinesButton.setDisplay("none")
		editButton.setDisplay("none");
		cancelButton.setDisplay("none");
		savePolygonButton.setDisplay("none");
		saveObjectButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.FENCE_EDITING_CANCELLED, () => {
		saveLinesButton.setDisplay("none")
		editButton.setDisplay("none");
		cancelButton.setDisplay("none");
		savePolygonButton.setDisplay("none");
		saveObjectButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.FENCE_SELECTED, (value) => {
		editButton.setDisplay(value ? "Block" : "none") 
	})

	eventBus.on(EventEnums.METRIC_CHANGED, () => {
		updateFromEditor();
	})

	function update() {
		let props;
		if (snapper.metric) {
			props = new FenceProps(
				fenceHeight.value, 
				fenceColor.value, 
				objectName.value,
				shadowCheck.getValue()
			)
		} else {
			props = new FenceProps(
				snapper.inchesToMeters(fenceHeight.value),
				fenceColor.dom.value,
				objectName.value,
				shadowCheck.getValue()
			)
		}

		const command = new PropUpdateCommand("FENCE", props, editor.fenceEditor, updateFromEditor)
		eventBus.emit(EventEnums.FENCE_CONFIG_UPDATED, command)
	}

	function updateFromEditor() {

		const props = editor.fenceEditor.props;

		if (snapper.metric) {
			fenceHeight.setValue(props.fenceHeight)
			fenceHeight.setUnit('m')
			fenceHeight.setStep(0.1)
			fenceHeight.setPrecision(2)
		} else {
			fenceHeight.setValue(snapper.metersToInches(props.fenceHeight))
			fenceHeight.setUnit('in')
			fenceHeight.setStep(1.0)
			fenceHeight.setPrecision(0)
		}
		
		fenceColor.setValue(props.fenceColor)
		shadowCheck.setValue(props.shadow)
		objectName.setValue(props.name)

	}

	return container;

}

export { SidebarFence };
