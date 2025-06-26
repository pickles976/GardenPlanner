import { UIPanel, UIRow, UIInput, UIButton, UIColor, UIText, UINumber } from '../libs/ui.js';

import { Strings } from './Strings.js';
import { eventBus, EventEnums } from '../EventBus.js';
import { snapper } from '../Snapping.js';
import { FenceEditingUpdateCommand } from '../commands/FenceEditingUpdateCommand.js';

const strings = Strings({ 'language': 'en' });


function SidebarPath(editor) {

	const container = new UIPanel();
	container.setBorderTop('0');
	container.setPaddingTop('20px');
	container.setDisplay("Block")

	const label = new UIText("PATH")
	container.add(label)

	// Save Lines
	const saveLinesButton = new UIButton("✓ Save Lines")
	saveLinesButton.dom.style.color = "#AAFFAA"
	saveLinesButton.setDisplay("none")

	// Save Polygon
	const savePolygonButton = new UIButton("✓ Save Vertices")
	savePolygonButton.dom.style.color = "#AAFFAA"
	savePolygonButton.setDisplay("none")

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
	pathWidth.setValue(editor.pathEditor.pathWidth);
	pathWidthRow.add(new UIText("Path Width").setClass('Label'));
	pathWidthRow.add(pathWidth);

	const pathHeightRow = new UIRow();
	const pathHeight = new UINumber().setStep(0.1).setNudge(0.01).setUnit('m').setWidth('50px').onChange(update);
	pathHeight.setValue(editor.pathEditor.pathHeight);
	pathHeightRow.add(new UIText("Path Height").setClass('Label'));
	pathHeightRow.add(pathHeight);

	const pathColorRow = new UIRow();
	const pathColor = new UIColor().onInput(update);
	pathColor.setValue(editor.pathEditor.pathColor)
	pathColorRow.add(new UIText("Fence Color").setClass("Label"));
	pathColorRow.add(pathColor)

	const buttonContainer = new UIPanel();
	buttonContainer.setBorderTop('1');
	buttonContainer.setPaddingTop('20px');
	buttonContainer.add(saveLinesButton)
	buttonContainer.add(savePolygonButton)
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
	configContainer.setDisplay("none");

	// Add sub-panels
	container.add(configContainer)
	container.add(buttonContainer)

	saveLinesButton.onClick(() => editor.pathEditor.lineEditor.setVertexEditMode())
	savePolygonButton.onClick(() => eventBus.emit(EventEnums.PATH_VERTEX_EDITING_FINISHED))
	saveObjectButton.onClick(() => eventBus.emit(EventEnums.PATH_EDITING_FINISHED))
	cancelButton.onClick(() => eventBus.emit(EventEnums.PATH_EDITING_CANCELLED))
	editButton.onClick(() => eventBus.emit(EventEnums.PATH_EDITING_STARTED, editor.selector.currentSelectedObject))

	eventBus.on(EventEnums.PATH_CREATION_STARTED, () => {
		saveLinesButton.setDisplay("Block")
		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		savePolygonButton.setDisplay("none");
		saveObjectButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.PATH_VERTEX_EDITING_STARTED, () => {
		saveLinesButton.setDisplay("none")
		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		savePolygonButton.setDisplay("Block");
		saveObjectButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.PATH_VERTEX_EDITING_UPDATED, () => {
		updateFromEditor()
	})

	eventBus.on(EventEnums.PATH_VERTEX_EDITING_FINISHED, () => {
		saveLinesButton.setDisplay("none")
		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		savePolygonButton.setDisplay("none");
		saveObjectButton.setDisplay("Block");
		configContainer.setDisplay("Block")
	})

	eventBus.on(EventEnums.PATH_EDITING_FINISHED, () => {
		saveLinesButton.setDisplay("none")
		editButton.setDisplay("none");
		cancelButton.setDisplay("none");
		savePolygonButton.setDisplay("none");
		saveObjectButton.setDisplay("none");
		configContainer.setDisplay("none")
	})

	eventBus.on(EventEnums.PATH_EDITING_CANCELLED, () => {
		saveLinesButton.setDisplay("none")
		editButton.setDisplay("none");
		cancelButton.setDisplay("none");
		savePolygonButton.setDisplay("none");
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
		let props = {};
		if (snapper.metric) {
			props = {
				"name": objectName.value,
				"pathWidth": pathWidth.value,
				"pathHeight": pathHeight.value,
				"pathColor": pathColor.value,
			};
		} else {
			props = {
				"name": objectName.value,
				"pathWidth": snapper.inchesToMeters(pathWidth.value),
				"pathHeight": snapper.inchesToMeters(pathHeight.value),
				"pathColor": pathColor.dom.value,
			};
		}

		const command = new FenceEditingUpdateCommand(props, editor.pathEditor, updateFromEditor)
		eventBus.emit(EventEnums.PATH_CONFIG_UPDATED, command)
	}

	function updateFromEditor() {

		if (snapper.metric) {
			pathHeight.setValue(editor.pathEditor.pathHeight)
			pathHeight.setUnit('m')
			pathHeight.setStep(0.1)
			pathHeight.setPrecision(2)

			pathWidth.setValue(editor.pathEditor.pathWidth)
			pathWidth.setUnit('m')
			pathWidth.setStep(0.1)
			pathWidth.setPrecision(2)
		} else {
			pathHeight.setValue(snapper.metersToInches(editor.pathEditor.pathHeight))
			pathHeight.setUnit('in')
			pathHeight.setStep(1.0)
			pathHeight.setPrecision(0)

			pathWidth.setValue(snapper.metersToInches(editor.pathEditor.pathWidth))
			pathWidth.setUnit('in')
			pathWidth.setStep(1.0)
			pathWidth.setPrecision(0)
		}

		pathColor.setValue(editor.pathEditor.pathColor)

	}

	return container;

}

export { SidebarPath };
