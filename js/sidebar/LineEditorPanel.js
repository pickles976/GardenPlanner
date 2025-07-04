import { UIPanel, UIRow, UIInput, UIButton, UIColor, UIText, UINumber } from '../libs/ui.js';

import { Strings } from './Strings.js';
import { eventBus, EventEnums } from '../EventBus.js';
import { snapper } from '../Snapping.js';
import { PropUpdateCommand } from '../commands/PropUpdateCommand.js';
import { PathProps } from '../editors/PathEditor.js';
import { LineEditor } from '../editors/LineEditor.js';

const strings = Strings({ 'language': 'en' });

function LineEditorPanel(lineEditor) {

	const container = new UIPanel();
	container.setBorderTop('0');
	container.setPaddingTop('20px');
	container.setDisplay("Block")

	// Save Lines
	const saveLinesButton = new UIButton("✓ Save Lines")
	saveLinesButton.dom.style.color = "#AAFFAA"
	saveLinesButton.setDisplay("none")

	// Save Polygon
	const savePolygonButton = new UIButton("✓ Save Vertices")
	savePolygonButton.dom.style.color = "#AAFFAA"
	savePolygonButton.setDisplay("none")

	// Cancel
	const cancelButton = new UIButton("Cancel");
	cancelButton.dom.style.color = "#FF8888"
	cancelButton.setDisplay("none")

	// Edit
	const editButton = new UIButton("Edit");
	editButton.setDisplay("none")

	const buttonContainer = new UIPanel();
	buttonContainer.setBorderTop('1');
	buttonContainer.setPaddingTop('20px');
	buttonContainer.add(saveLinesButton)
	buttonContainer.add(savePolygonButton)
	buttonContainer.add(cancelButton)
	buttonContainer.add(editButton)

	// Add sub-panels
	container.add(configContainer)
	container.add(buttonContainer)

	// TODO: inject these
	saveLinesButton.onClick(() => lineEditor.setVertexEditMode())
	savePolygonButton.onClick(() => eventBus.emit(EventEnums.PATH_VERTEX_EDITING_FINISHED))

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
	})

	eventBus.on(EventEnums.PATH_VERTEX_EDITING_FINISHED, () => {
		saveLinesButton.setDisplay("none")
		editButton.setDisplay("none");
		cancelButton.setDisplay("Block");
		savePolygonButton.setDisplay("none");
	})

	return container;

}

export { SidebarPath };
