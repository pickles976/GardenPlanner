import { UIPanel, UIButton, UIDiv } from '../libs/ui.js';

import { Strings } from './Strings.js';
import { eventBus, EventEnums } from '../EventBus.js';
import { LineEditor } from '../editors/LineEditor.js';

const strings = Strings({ 'language': 'en' });

class LineEditorPanel {

	lineEditor: LineEditor;
	container: UIDiv;

	saveLinesButton: UIButton;
	savePolygonButton: UIButton;
	editButton: UIButton;

	constructor(lineEditor, onVertexEditingStarted, onVertexEditingFinished) {

		this.lineEditor = lineEditor;

		this.container = new UIDiv();
		this.container.setDisplay("Block")

		// Save Lines
		this.saveLinesButton = new UIButton("✓ Save Lines")
		this.saveLinesButton.dom.style.color = "#AAFFAA"

		// Save Polygon
		this.savePolygonButton = new UIButton("✓ Save Vertices")
		this.savePolygonButton.dom.style.color = "#AAFFAA"

		const buttonContainer = new UIPanel();
		buttonContainer.add(this.saveLinesButton)
		buttonContainer.add(this.savePolygonButton)

		this.container.add(buttonContainer)

		this.saveLinesButton.onClick(() => {
			eventBus.emit(onVertexEditingStarted);
			this.lineEditor.setVertexEditMode();
		})
		this.savePolygonButton.onClick(() => eventBus.emit(onVertexEditingFinished))

	}

	public setDisplay(value: string) {
		this.container.setDisplay(value)
	}

	public startVertexPlacement() {
		this.saveLinesButton.setDisplay("Block")
		this.savePolygonButton.setDisplay("none");
	}

	public startVertexEditing() {
		this.saveLinesButton.setDisplay("none")
		this.savePolygonButton.setDisplay("Block");
	}


}

export { LineEditorPanel };
