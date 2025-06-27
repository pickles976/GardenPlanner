import * as THREE from 'three';

import { UIPanel, UIRow, UIInput, UIButton, UIColor, UICheckbox, UIInteger, UITextArea, UIText, UINumber, UISpan } from '../libs/ui.js';
import { UIBoolean } from '../libs/ui.three.js';

import { SetPositionCommand } from '../commands/SetPositionCommand.js';
import { Strings } from './Strings.js';
import {eventBus, EventEnums} from '../EventBus.js';
import { contain } from 'three/src/extras/TextureUtils.js';
import { BedEditingUpdateCommand } from '../commands/BedEditingUpdateCommand.js';
import { snapper } from '../Snapping.js';
import { BedProps } from '../editors/BedEditor.js';

const strings = Strings({'language': 'en'});


function SidebarBed( editor ) {


	const container = new UIPanel();
	container.setBorderTop( '0' );
	container.setPaddingTop( '20px' );
	container.setDisplay("Block")

	const label = new UIText("BED")
	container.add(label)

	// Save Polygon
	const savePolygonButton = new UIButton("✓ Save Polygon")
	savePolygonButton.dom.style.color = "#AAFFAA"
	savePolygonButton.setDisplay("none")

	// Save Bed
	const saveBedButton = new UIButton("✓ Save Bed")
	saveBedButton.setDisplay("none")

	// Cancel
	const cancelButton = new UIButton("Cancel");
	cancelButton.dom.style.color = "#FF8888"
	cancelButton.setDisplay("none")

	// Edit
	const editButton = new UIButton("Edit");
	editButton.setDisplay("none")

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
	buttonContainer.add(savePolygonButton)
	buttonContainer.add(saveBedButton)
	buttonContainer.add(cancelButton)
	buttonContainer.add(editButton)

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
	container.add(configContainer)
	container.add(dimensionContainer)
	container.add(buttonContainer)

	savePolygonButton.onClick(() => eventBus.emit(EventEnums.BED_VERTEX_EDITING_FINISHED))
	saveBedButton.onClick(() => eventBus.emit(EventEnums.BED_EDITING_FINISHED))
	cancelButton.onClick(() => eventBus.emit(EventEnums.BED_EDITING_CANCELLED))
	editButton.onClick(() => eventBus.emit(EventEnums.BED_EDITING_STARTED, editor.selector.currentSelectedObject))

	eventBus.on(EventEnums.BED_CREATION_STARTED, () => {
		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		savePolygonButton.setDisplay("none");
		saveBedButton.setDisplay("none");
		dimensionContainer.setDisplay("none")
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.BED_VERTEX_EDITING_STARTED, () => {
		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		savePolygonButton.setDisplay("Block");
		saveBedButton.setDisplay("none");
		dimensionContainer.setDisplay("Block")
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.BED_VERTEX_EDITING_UPDATED, () => {
		updateFromEditor()
	})

	eventBus.on(EventEnums.BED_VERTEX_EDITING_FINISHED, () => {
		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		savePolygonButton.setDisplay("none");
		saveBedButton.setDisplay("Block");
		dimensionContainer.setDisplay("Block")
		configContainer.setDisplay("Block")
	})

	eventBus.on(EventEnums.BED_EDITING_FINISHED, () => {
		editButton.setDisplay("none");
		cancelButton.setDisplay("none");
		savePolygonButton.setDisplay("none");
		saveBedButton.setDisplay("none");
		dimensionContainer.setDisplay("none")
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.BED_EDITING_CANCELLED, () => {
		editButton.setDisplay("none");
		cancelButton.setDisplay("none");
		savePolygonButton.setDisplay("none");
		saveBedButton.setDisplay("none");
		dimensionContainer.setDisplay("none")
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.BED_SELECTED, (value) => {
		editButton.setDisplay(value ? "Block" : "none") 
	})

	eventBus.on(EventEnums.METRIC_CHANGED, () => {
		updateFromEditor();
	})

	function update() {
		let props = {};
		if (snapper.metric) {
			props = new BedProps(
				bedHeight.value, 
				borderHeight.value, 
				borderWidth.value,
				bedColor.dom.value,
				borderColor.dom.value,
				objectName.value
			)
		} else {
			props = new BedProps(
				snapper.inchesToMeters(bedHeight.value), 
				snapper.inchesToMeters(borderHeight.value), 
				snapper.inchesToMeters(borderWidth.value),
				bedColor.dom.value,
				borderColor.dom.value,
				objectName.value
			)
		}

		const command = new BedEditingUpdateCommand(props, editor.bedEditor, updateFromEditor)
		eventBus.emit(EventEnums.BED_CONFIG_UPDATED, command)
	}

	function updateFromEditor() {

		let a = editor.bedEditor.getBedArea();

		const props = editor.bedEditor.props;

		if (snapper.metric) {
			area.setValue(a)
			volume.setValue(a * props.bedHeight)
			area.setUnit( 'm²' )
			volume.setUnit( 'm³' )

			bedHeight.setValue(props.bedHeight)
			borderHeight.setValue(props.borderHeight)
			borderWidth.setValue(props.borderWidth)

			bedHeight.setUnit('m')
			borderHeight.setUnit('m')
			borderWidth.setUnit('m')

		} else {
			a *= 10.7639;
			area.setValue(a)
			area.setUnit( 'ft²' )
			volume.setUnit( 'ft³' )

			volume.setValue(a * (snapper.metersToInches(props.bedHeight) / 12.0))

			bedHeight.setValue(snapper.metersToInches(props.bedHeight))
			borderHeight.setValue(snapper.metersToInches(props.borderHeight))
			borderWidth.setValue(snapper.metersToInches(props.borderWidth))

			bedHeight.setUnit('in')
			borderHeight.setUnit('in')
			borderWidth.setUnit('in')
		}

		bedColor.setValue(props.bedColor)
		borderColor.setValue(props.borderColor)


	}

	return container;

}

export { SidebarBed };
