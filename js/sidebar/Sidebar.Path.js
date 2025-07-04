import { UIPanel, UIRow, UIInput, UIButton, UIColor, UIText, UINumber } from '../libs/ui.js';

import { Strings } from './Strings.js';
import { eventBus, EventEnums } from '../EventBus.js';
import { snapper } from '../Snapping.js';
import { PropUpdateCommand } from '../commands/PropUpdateCommand.js';
import { PathProps } from '../editors/PathEditor.js';
import { LineEditorPanel } from './LineEditorPanel.js';

const strings = Strings({ 'language': 'en' });

function SidebarPath(editor) {

	const container = new UIPanel();
	container.setBorderTop('0');
	container.setPaddingTop('20px');
	container.setDisplay("Block")

	const label = new UIText("PATH")
	container.add(label)

	const lineEditorPanel = new LineEditorPanel(
		editor.pathEditor.lineEditor, 
		EventEnums.PATH_VERTEX_EDITING_STARTED,
		EventEnums.PATH_VERTEX_EDITING_FINISHED);

	// Save Object
	const saveObjectButton = new UIButton("✓ Save Path")
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
	const objectName = new UIInput().setWidth('150px').setFontSize('12px').onChange(update);
	objectName.setValue("New Path")
	objectNameRow.add(new UIText("Path Name").setClass('Label'));
	objectNameRow.add(objectName);

	const pathWidthRow = new UIRow();
	const pathWidth = new UINumber().setStep(0.1).setNudge(0.01).setUnit('m').setWidth('50px').onChange(update);
	pathWidthRow.add(new UIText("Path Width").setClass('Label'));
	pathWidthRow.add(pathWidth);

	const pathHeightRow = new UIRow();
	const pathHeight = new UINumber().setStep(0.1).setNudge(0.01).setUnit('m').setWidth('50px').onChange(update);
	pathHeightRow.add(new UIText("Path Height").setClass('Label'));
	pathHeightRow.add(pathHeight);

	const pathColorRow = new UIRow();
	const pathColor = new UIColor().onInput(update);
	pathColorRow.add(new UIText("Path Color").setClass("Label"));
	pathColorRow.add(pathColor)

	const numArcSegmentsRow = new UIRow();
	const numArcSegments = new UINumber().setStep(1).setWidth('50px').onChange(update).setPrecision(0);
	numArcSegments.setValue(1);
	numArcSegmentsRow.add(new UIText("Bend Segments").setClass('Label'));
	numArcSegmentsRow.add(numArcSegments);

	const buttonContainer = new UIPanel();
	buttonContainer.setBorderTop('1');
	buttonContainer.setPaddingTop('20px');
	buttonContainer.add(saveObjectButton)
	buttonContainer.add(cancelButton)
	buttonContainer.add(editButton)

	const configContainer = new UIPanel();
	configContainer.setBorderTop('1');
	configContainer.setPaddingTop('20px');
	configContainer.add(objectNameRow);
	configContainer.add(pathWidthRow);
	configContainer.add(pathHeightRow);
	configContainer.add(pathColorRow);
	configContainer.add(numArcSegmentsRow)
	configContainer.setDisplay("none");

	// Add sub-panels
	container.add(lineEditorPanel.container)
	container.add(configContainer)
	container.add(buttonContainer)

	saveObjectButton.onClick(() => eventBus.emit(EventEnums.PATH_EDITING_FINISHED))
	cancelButton.onClick(() => eventBus.emit(EventEnums.PATH_EDITING_CANCELLED))
	editButton.onClick(() => eventBus.emit(EventEnums.PATH_EDITING_STARTED, editor.selector.currentSelectedObject))

	eventBus.on(EventEnums.PATH_CREATION_STARTED, () => {
		lineEditorPanel.setDisplay("Block");
		lineEditorPanel.startVertexPlacement();

		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		saveObjectButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.PATH_VERTEX_EDITING_STARTED, () => {
		lineEditorPanel.setDisplay("Block")
		lineEditorPanel.startVertexEditing()

		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		saveObjectButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.PATH_VERTEX_EDITING_UPDATED, () => {
		lineEditorPanel.updateFromEditor()
		updateFromEditor()
	})

	eventBus.on(EventEnums.PATH_VERTEX_EDITING_FINISHED, () => {
		lineEditorPanel.setDisplay("none")
		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		saveObjectButton.setDisplay("Block");
		configContainer.setDisplay("Block")
		updateFromEditor()
	})

	eventBus.on(EventEnums.PATH_EDITING_FINISHED, () => {
		editButton.setDisplay("none");
		cancelButton.setDisplay("none");
		saveObjectButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.PATH_EDITING_CANCELLED, () => {
		editButton.setDisplay("none");
		cancelButton.setDisplay("none");
		saveObjectButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.PATH_SELECTED, (value) => {
		editButton.setDisplay(value ? "Block" : "none")
	})

	eventBus.on(EventEnums.METRIC_CHANGED, () => {
		updateFromEditor();
	})

	function update() {
		let props ;
		if (snapper.metric) {
			props = new PathProps(
				numArcSegments.value,
				pathWidth.value,
				pathHeight.value,
				pathColor.value,
				objectName.getValue()
			);
		} else {
			props = new PathProps(
				numArcSegments.value,
				snapper.inchesToMeters(pathWidth.value),
				snapper.inchesToMeters(pathHeight.value),
				pathColor.dom.value,
				objectName.getValue()
			);
		}

		const command = new PropUpdateCommand("PATH", props, editor.pathEditor, updateFromEditor)
		eventBus.emit(EventEnums.PATH_CONFIG_UPDATED, command)
	}

	function updateFromEditor() {

		const props = editor.pathEditor.props;

		if (snapper.metric) {
			pathHeight.setValue(props.pathHeight)
			pathHeight.setUnit('m')
			pathHeight.setStep(0.1)
			pathHeight.setPrecision(2)

			pathWidth.setValue(props.pathWidth)
			pathWidth.setUnit('m')
			pathWidth.setStep(0.1)
			pathWidth.setPrecision(2)
		} else {
			pathHeight.setValue(snapper.metersToInches(props.pathHeight))
			pathHeight.setUnit('in')
			pathHeight.setStep(1.0)
			pathHeight.setPrecision(0)

			pathWidth.setValue(snapper.metersToInches(props.pathWidth))
			pathWidth.setUnit('in')
			pathWidth.setStep(1.0)
			pathWidth.setPrecision(0)
		}

		numArcSegments.setValue(props.numArcSegments)
		pathColor.setValue(props.pathColor)
		objectName.setValue(props.name)

	}

	return container;

}

export { SidebarPath };
