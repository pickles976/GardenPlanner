
import { UIPanel, UIRow, UIInput, UIButton, UIColor, UICheckbox, UIInteger, UITextArea, UIText, UINumber, UISpan } from '../libs/ui.js';

import { Strings } from './Strings.js';
import {eventBus, EventEnums} from '../EventBus.js';
import { snapper } from '../Snapping.js';
import { PropUpdateCommand } from '../commands/PropUpdateCommand.js';
import { FenceProps } from '../editors/FenceEditor.js';
import { LineEditorPanel } from './LineEditorPanel.js';

const strings = Strings({'language': 'en'});


function SidebarFence( editor ) {


	const container = new UIPanel();
	container.setBorderTop( '0' );
	container.setPaddingTop( '20px' );
	container.setDisplay("Block")

	const lineEditorPanel = new LineEditorPanel(
		editor.fenceEditor.lineEditor, 
		EventEnums.FENCE_VERTEX_EDITING_STARTED,
		EventEnums.FENCE_VERTEX_EDITING_FINISHED);


	const label = new UIText("FENCE")
	container.add(label)

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
	objectNameRow.add( new UIText( "Fence Name" ).setClass( 'Label' ) );
	objectNameRow.add( objectName );

	const fenceHeightRow = new UIRow();
	const fenceHeight = new UINumber().setStep( 0.1 ).setNudge( 0.01 ).setUnit( 'm' ).setWidth( '50px' ).onChange( update );
	fenceHeightRow.add( new UIText( "Fence Height" ).setClass( 'Label' ) );
	fenceHeightRow.add( fenceHeight );

	const fenceColorRow = new UIRow();
	const fenceColor = new UIColor().onInput( update );
	fenceColorRow.add( new UIText( "Fence Color" ).setClass( "Label" ) );
	fenceColorRow.add(fenceColor)

	const chainLinkRow = new UIRow();
	const chainLinkCheck = new UICheckbox().onInput(update);
	chainLinkRow.add(new UIText("Chain Link").setClass("Label"));
	chainLinkRow.add(chainLinkCheck);

	const buttonContainer = new UIPanel();
	buttonContainer.setBorderTop( '1' );
	buttonContainer.setPaddingTop( '20px' );
	buttonContainer.add(saveObjectButton)
	buttonContainer.add(cancelButton)
	buttonContainer.add(editButton)

	const configContainer = new UIPanel();
	configContainer.setBorderTop( '1' );
	configContainer.setPaddingTop( '20px' );
	configContainer.add( objectNameRow );
	configContainer.add( fenceHeightRow );
	configContainer.add(fenceColorRow);
	configContainer.add(chainLinkRow);
	configContainer.setDisplay("none");

	// Add sub-panels
	container.add(lineEditorPanel.container)
	container.add(configContainer)
	container.add(buttonContainer)

	saveObjectButton.onClick(() => eventBus.emit(EventEnums.FENCE_EDITING_FINISHED))
	cancelButton.onClick(() => eventBus.emit(EventEnums.FENCE_EDITING_CANCELLED))
	editButton.onClick(() => eventBus.emit(EventEnums.FENCE_EDITING_STARTED, editor.selector.currentSelectedObject))

	eventBus.on(EventEnums.FENCE_CREATION_STARTED, () => {
		lineEditorPanel.setDisplay("Block");
		lineEditorPanel.startVertexPlacement();

		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		saveObjectButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.FENCE_VERTEX_EDITING_STARTED, () => {
		lineEditorPanel.setDisplay("Block")
		lineEditorPanel.startVertexEditing()

		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		saveObjectButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.FENCE_VERTEX_EDITING_UPDATED, () => {
		updateFromEditor()
	})

	eventBus.on(EventEnums.FENCE_VERTEX_EDITING_FINISHED, () => {
		lineEditorPanel.setDisplay("none")
		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		saveObjectButton.setDisplay("Block");
		configContainer.setDisplay("Block")
		updateFromEditor()
	})

	eventBus.on(EventEnums.FENCE_EDITING_FINISHED, () => {
		editButton.setDisplay("none");
		cancelButton.setDisplay("none");
		saveObjectButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.FENCE_EDITING_CANCELLED, () => {
		editButton.setDisplay("none");
		cancelButton.setDisplay("none");
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
				objectName.getValue(),
				chainLinkCheck.getValue()
			)
		} else {
			props = new FenceProps(
				snapper.inchesToMeters(fenceHeight.value),
				fenceColor.dom.value,
				objectName.getValue(),
				chainLinkCheck.getValue()
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
		chainLinkCheck.setValue(props.chainLink)
		objectName.setValue(props.name)

	}

	return container;

}

export { SidebarFence };
