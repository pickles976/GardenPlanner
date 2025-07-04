import * as THREE from "three"
import { UIPanel, UIButton, UIDiv, UIRow, UIText, UINumber } from '../libs/ui.js';

import { Strings } from './Strings.js';
import { eventBus, EventEnums } from '../EventBus.js';
import { LineEditor } from '../editors/LineEditor.js';
import { northAngleToVec } from "../Utils.js";

const strings = Strings({ 'language': 'en' });

class LineEditorPanel {

	lineEditor: LineEditor;
	container: UIDiv;

	saveLinesButton: UIButton;
	savePolygonButton: UIButton;
	editButton: UIButton;

	segmentContainer: UIPanel;
	buttonContainer: UIPanel;

	segments: THREE.Vector3[];
	segmentRows: UIRow[];

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

		this.buttonContainer = new UIPanel();
		this.buttonContainer.add(this.saveLinesButton)
		this.buttonContainer.add(this.savePolygonButton)

		// Segments
		this.segmentContainer = new UIPanel();

		this.container.add(new UIText( "Line Segments" ).setClass( 'Label' ));
		this.container.add(this.segmentContainer);
		this.container.add(this.buttonContainer);

		this.saveLinesButton.onClick(() => {
			eventBus.emit(onVertexEditingStarted);
			this.lineEditor.setVertexEditMode();
		})
		this.savePolygonButton.onClick(() => eventBus.emit(onVertexEditingFinished))

		this.segmentRows = [];

	}

	public updateFromEditor() {

		// TODO: handle metric
		// TODO: add callbacks


		// Clear state
		this.segmentRows.forEach((item) => this.segmentContainer.remove(item))
		this.segments = []
		this.segmentRows = [];
		
		// Turn vertices into segments
		const vertices = this.lineEditor.vertexHandles.map((item) => item.position.clone());
		for (let i = 0; i < vertices.length - 1; i++) {
			let p1 = vertices[i];
			let p2 = vertices[i + 1];

			const segment = p2.clone().sub(p1);
			this.segments.push(segment);
		}

		// Draw segments UI
		for (let i = 0; i < this.segments.length; i++) {

			const segment = this.segments[i];

			let angle;
			if (i == 0) {
				angle = segment.angleTo(northAngleToVec(this.lineEditor.editor.north))
			} else {
				angle = segment.angleTo(this.segments[i - 1])
			}

			const lengthLabel = new UIText(`Length`)
			const lengthField = new UINumber().setStep( 0.1 ).setNudge( 0.01 ).setUnit( 'm' ).setWidth( '50px' )
			lengthField.setValue(segment.length().toFixed(2))

			const angleLabel = new UIText( `Angle`)
			const angleField = new UINumber().setStep( 0.1 ).setNudge( 0.01 ).setUnit( '°' ).setWidth( '50px' )
			angleField.setValue(angle.toFixed(2))

			const row = new UIRow()
			row.add(lengthLabel)
			row.add(lengthField)
			row.add(angleLabel)
			row.add(angleField)

			this.segmentRows.push(row)
			this.segmentContainer.add(row)
		}




	}

	public setDisplay(value: string) {
		this.container.setDisplay(value)
	}

	public startVertexPlacement() {
		this.saveLinesButton.setDisplay(this.lineEditor.closedLoop ? "none" : "Block")
		this.savePolygonButton.setDisplay("none");
	}

	public startVertexEditing() {
		this.saveLinesButton.setDisplay("none")
		this.savePolygonButton.setDisplay("Block");
	}


}

export { LineEditorPanel };
