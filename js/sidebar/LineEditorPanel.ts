import * as THREE from "three"
import { UIPanel, UIButton, UIDiv, UIRow, UIText, UINumber } from '../libs/ui.js';

import { Strings } from './Strings.js';
import { eventBus, EventEnums } from '../EventBus.js';
import { LineEditor } from '../editors/LineEditor.js';
import { northAngleToVec, rad2deg } from "../Utils.js";
import { snapper } from "../Snapping.js";

class Segment {

	p1: number;
	p2: number;
	segment: THREE.Vector3;

	constructor(p1: number, p2: number, segment: THREE.Vector3) {
		this.p1 = p1;
		this.p2 = p2;
		this.segment = segment;
	}
}

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
		// TODO: handle loop vs non-loop vertex angles


		// Clear state
		this.segmentRows.forEach((item) => this.segmentContainer.remove(item))
		this.segments = []
		this.segmentRows = [];
		
		// Turn vertices into segments
		const vertices = this.lineEditor.vertexHandles.map((item) => item.position.clone());
		for (let i = 0; i < vertices.length; i++) {

			let p1 = i;
			let p2 = (i + 1)% vertices.length;

			let v1 = vertices[p1];
			let v2 = vertices[p2];

			const segment = v2.clone().sub(v1);
			this.segments.push(new Segment(p1, p2, segment));
		}

		// Draw segments UI
		for (let i = 0; i < this.segments.length; i++) {

			const segment = this.segments[i].segment;

			const distance = snapper.metersToInches(segment.length());

			// TODO: change this based on if we have a loop or not
			// Get angle to north for the first segment, get all others with respect to the previous segment
			let angle = (i == 0) ? segment.angleTo(northAngleToVec(this.lineEditor.editor.north)) : segment.angleTo(this.segments[i - 1].segment);
			angle = rad2deg(angle);
	
			const lengthLabel = new UIText(`Length`)
			const lengthField = new UINumber().setStep( 1.0 ).setNudge( 0.01 ).setUnit( snapper.metric ? 'm' : '"' ).setWidth( '50px' )
			lengthField.setValue(distance.toFixed(2))
			lengthField.onChange(() => this.updateVertexHandles(lengthField.value, angle, i))

			const angleLabel = new UIText( `Angle`)
			const angleField = new UINumber().setStep( 1.0 ).setNudge( 0.01 ).setUnit( '°' ).setWidth( '50px' )
			angleField.setValue(angle.toFixed(2))
			angleField.onChange(() => this.updateVertexHandles(distance, angleField.value, i))

			const row = new UIRow()
			row.add(lengthLabel)
			row.add(lengthField)
			row.add(angleLabel)
			row.add(angleField)

			this.segmentRows.push(row)
			this.segmentContainer.add(row)
		}

	}

	private updateVertexHandles(distance: number, angle: number, segmentIndex: number) {
		const segment = this.segments[segmentIndex];
		const h1 = this.lineEditor.vertexHandles[segment.p1];
		const h2 = this.lineEditor.vertexHandles[segment.p2];

		// TODO: what do we need?
		// previous segment



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
