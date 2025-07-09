import * as THREE from "three"
import { UIPanel, UIButton, UIDiv, UIRow, UIText, UINumber } from '../libs/ui.js';

import { eventBus, EventEnums } from '../EventBus.js';
import { LineEditor } from '../editors/LineEditor.js';
import { northAngleToVec, rad2deg } from "../Utils.js";
import { snapper } from "../Snapping.js";
import { degToRad } from 'three/src/math/MathUtils.js';
import { SetPositionCommand } from "../commands/SetPositionCommand.js";
import { DeleteObjectCommand } from "../commands/DeleteObjectCommand.js";

class Segment {

	p1: number;
	p2: number;
	segment: THREE.Vector3;
	prevSegment: THREE.Vector3;

	constructor(p1: number, p2: number, segment: THREE.Vector3, prevSegment: THREE.Vector3) {
		this.p1 = p1;
		this.p2 = p2;
		this.segment = segment;
		this.prevSegment = prevSegment;
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

	constructor(lineEditor, onVertexEditingStarted, onVertexEditingFinished, onCancel) {

		this.lineEditor = lineEditor;

		this.container = new UIDiv();
		this.container.setDisplay("Block")

		// Save Lines
		this.saveLinesButton = new UIButton("✓ Save Lines")
		this.saveLinesButton.dom.style.color = "#AAFFAA"
		this.saveLinesButton.setDisplay("none")

		// Save Polygon
		this.savePolygonButton = new UIButton("✓ Save Vertices")
		this.savePolygonButton.dom.style.color = "#AAFFAA"
		this.savePolygonButton.setDisplay("none")

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
		eventBus.on(onCancel, () => this.cancel())

		this.segmentRows = [];

	}

	public updateFromEditor() {

		// TODO: CLEAN THIS UP!!!

		// Clear state
		this.segmentRows.forEach((item) => this.segmentContainer.remove(item))
		this.segments = []
		this.segmentRows = [];
		
		// Turn vertices into segments
		const vertices = this.lineEditor.vertexHandles.map((item) => item.position.clone());
		const loopLength = this.lineEditor.closedLoop ? vertices.length : vertices.length - 1;
		for (let i = 0; i < loopLength; i++) {

			let p1 = i;
			let p2 = (i + 1)% vertices.length;

			let v1 = vertices[p1];
			let v2 = vertices[p2];

			// Get angle to north for the first segment, get all others with respect to the previous segment
			// Get the previous segment
			let prevSegment;
			if (i == 0) {
				if (this.lineEditor.closedLoop) {
					prevSegment = vertices[vertices.length - 1].clone().sub(vertices[i]); // get last segment
				} else {
					prevSegment = northAngleToVec(this.lineEditor.editor.north); // get north vector
				}
			} else {
				prevSegment = vertices[i - 1].clone().sub(vertices[i])
			}

			const segment = v2.clone().sub(v1)
			this.segments.push(new Segment(p1, p2, segment, prevSegment));
		}

		// Draw segments UI
		for (let i = 0; i < this.segments.length; i++) {

			const segment = this.segments[i].segment;
			const prevSegment = this.segments[i].prevSegment;

			const distance = snapper.metersToInches(segment.length());

			let angle = rad2deg(segment.angleTo(prevSegment));
	
			const lengthLabel = new UIText(`Length`)
			const lengthField = new UINumber().setStep( 1.0 ).setNudge( 0.01 ).setUnit( snapper.metric ? 'm' : '"' ).setWidth( '50px' )
			lengthField.setValue(distance.toFixed(2))
			lengthField.onChange(() => this.updateVertexHandle(lengthField.value, angle, i, prevSegment))

			const angleLabel = new UIText( `Angle`)
			const angleField = new UINumber().setStep( 1.0 ).setNudge( 0.01 ).setUnit( '°' ).setWidth( '50px' )
			angleField.setValue(angle.toFixed(2))
			angleField.onChange(() => this.updateVertexHandle(distance, angleField.value, i, prevSegment))

			const deleteButton = new UIButton().setClass( 'trash-btn' );
			deleteButton.onClick(() => this.deleteVertexHandle(i))

			const row = new UIRow()
			row.add(lengthLabel)
			row.add(lengthField)
			row.add(angleLabel)
			row.add(angleField)
			row.add(deleteButton)

			this.segmentRows.push(row)
			this.segmentContainer.add(row)
		}

	}

	private deleteVertexHandle(index: number) {
		const v = this.lineEditor.vertexHandles[index];
		this.lineEditor.commandStack.execute( new DeleteObjectCommand(v, this.lineEditor.editor))
		this.lineEditor.refereshVertexHandles()
		this.lineEditor.drawPreview()
		this.updateFromEditor()
	}

	private updateVertexHandle(distance: number, angle: number, segmentIndex: number, prevSegment: THREE.Vector3) {
		/**
		 * Update handle when UI changes
		 */

		const length = snapper.metric ? distance : snapper.inchesToMeters(distance);

		const segment = this.segments[segmentIndex];
		const h1 = this.lineEditor.vertexHandles[segment.p1];
		const h2 = this.lineEditor.vertexHandles[segment.p2];

		// previous segment
		const rotated = prevSegment.clone().applyEuler(new THREE.Euler(0, degToRad(angle), 0));
		const scaled = rotated.normalize().multiplyScalar(length);

		const newPos = h1.position.clone().add(scaled);

		this.lineEditor.commandStack.execute(new SetPositionCommand(h2, h2.position, newPos))
		this.lineEditor.drawPreview()
		this.updateFromEditor()
	}

	public setDisplay(value: string) {
		this.container.setDisplay(value)
	}

	public startVertexPlacement() {
		this.saveLinesButton.setDisplay(this.lineEditor.closedLoop ? "none" : "Block")
		this.savePolygonButton.setDisplay("none");
		this.segmentContainer.setDisplay("none");
	}

	public startVertexEditing() {
		this.saveLinesButton.setDisplay("none")
		this.savePolygonButton.setDisplay("Block");
		this.segmentContainer.setDisplay("Block");
		this.updateFromEditor()
	}

	public cancel() {
		this.saveLinesButton.setDisplay("none")
		this.savePolygonButton.setDisplay("none")
		this.segmentContainer.setDisplay("none")
	}

}

export { LineEditorPanel };
