import * as THREE from 'three';

import { UIPanel, UIRow, UIInput, UIButton, UIColor, UICheckbox, UIInteger, UITextArea, UIText, UINumber } from '../libs/ui.js';
import { UIBoolean } from '../libs/ui.three.js';

// import { SetUuidCommand } from './commands/SetUuidCommand.js';
// import { SetValueCommand } from './commands/SetValueCommand.js';
import { SetPositionCommand } from '../commands/SetPositionCommand.js';
import { SetRotationCommand } from '../commands/SetRotationCommand.js';
import { SetScaleCommand } from '../commands/SetScaleCommand.js';
// import { SetColorCommand } from './commands/SetColorCommand.js';
// import { SetShadowValueCommand } from './commands/SetShadowValueCommand.js';
import { Strings } from './Strings';
import {eventBus, EventEnums} from '../EventBus.js';
import { snapper } from '../Snapping.js'

const strings = Strings({'language': 'en'});

// import { SidebarObjectAnimation } from './Sidebar.Object.Animation.js';

function SidebarObject( editor ) {

	// const strings = editor.strings;

	const container = new UIPanel();
	container.setBorderTop( '0' );
	container.setPaddingTop( '20px' );

	const label = new UIText("OBJECT")
	container.add(label)


	// Actions

	/*
	let objectActions = new UI.Select().setPosition( 'absolute' ).setRight( '8px' ).setFontSize( '11px' );
	objectActions.setOptions( {

		'Actions': 'Actions',
		'Reset Position': 'Reset Position',
		'Reset Rotation': 'Reset Rotation',
		'Reset Scale': 'Reset Scale'

	} );
	objectActions.onClick( function ( event ) {

		event.stopPropagation(); // Avoid panel collapsing

	} );
	objectActions.onChange( function ( event ) {

		let object = editor.selected;

		switch ( this.getValue() ) {

			case 'Reset Position':
				editor.execute( new SetPositionCommand( editor, object, new Vector3( 0, 0, 0 ) ) );
				break;

			case 'Reset Rotation':
				editor.execute( new SetRotationCommand( editor, object, new Euler( 0, 0, 0 ) ) );
				break;

			case 'Reset Scale':
				editor.execute( new SetScaleCommand( editor, object, new Vector3( 1, 1, 1 ) ) );
				break;

		}

		this.setValue( 'Actions' );

	} );
	container.addStatic( objectActions );
	*/

	// type

	const objectTypeRow = new UIRow();
	const objectType = new UIText();

	objectTypeRow.add( new UIText( strings.getKey( 'sidebar/object/type' ) ).setClass( 'Label' ) );
	objectTypeRow.add( objectType );

	container.add( objectTypeRow );

	// uuid

	const objectUUIDRow = new UIRow();
	const objectUUID = new UIInput().setWidth( '102px' ).setFontSize( '12px' ).setDisabled( true );
	const objectUUIDRenew = new UIButton( strings.getKey( 'sidebar/object/new' ) ).setMarginLeft( '7px' ).onClick( function () {

		objectUUID.setValue( THREE.MathUtils.generateUUID() );

		editor.execute( new SetUuidCommand( editor, editor.selected, objectUUID.getValue() ) );

	} );

	objectUUIDRow.add( new UIText( strings.getKey( 'sidebar/object/uuid' ) ).setClass( 'Label' ) );
	objectUUIDRow.add( objectUUID );
	objectUUIDRow.add( objectUUIDRenew );

	container.add( objectUUIDRow );

	// name

	const objectNameRow = new UIRow();
	const objectName = new UIInput().setWidth( '150px' ).setFontSize( '12px' ).onChange( function () {

		editor.execute( new SetValueCommand( editor, editor.selected, 'name', objectName.getValue() ) );

	} );

	objectNameRow.add( new UIText( strings.getKey( 'sidebar/object/name' ) ).setClass( 'Label' ) );
	objectNameRow.add( objectName );

	container.add( objectNameRow );

	// position

	const objectPositionRow = new UIRow();
	const objectPositionX = new UINumber().setPrecision( 3 ).setWidth( '50px' ).onChange( update ).setUnit('m');
	const objectPositionY = new UINumber().setPrecision( 3 ).setWidth( '50px' ).onChange( update ).setUnit('m');
	const objectPositionZ = new UINumber().setPrecision( 3 ).setWidth( '50px' ).onChange( update ).setUnit('m');

	objectPositionRow.add( new UIText( strings.getKey( 'sidebar/object/position' ) ).setClass( 'Label' ) );
	objectPositionRow.add( objectPositionX, objectPositionY, objectPositionZ );

	container.add( objectPositionRow );

	// rotation

	const objectRotationRow = new UIRow();
	const objectRotationX = new UINumber().setStep( 10 ).setNudge( 0.1 ).setUnit( '°' ).setWidth( '50px' ).onChange( update );
	const objectRotationY = new UINumber().setStep( 10 ).setNudge( 0.1 ).setUnit( '°' ).setWidth( '50px' ).onChange( update );
	const objectRotationZ = new UINumber().setStep( 10 ).setNudge( 0.1 ).setUnit( '°' ).setWidth( '50px' ).onChange( update );

	objectRotationRow.add( new UIText( strings.getKey( 'sidebar/object/rotation' ) ).setClass( 'Label' ) );
	objectRotationRow.add( objectRotationX, objectRotationY, objectRotationZ );

	container.add( objectRotationRow );

	// scale

	const objectScaleRow = new UIRow();
	const objectScaleX = new UINumber( 1 ).setPrecision( 3 ).setWidth( '50px' ).onChange( update );
	const objectScaleY = new UINumber( 1 ).setPrecision( 3 ).setWidth( '50px' ).onChange( update );
	const objectScaleZ = new UINumber( 1 ).setPrecision( 3 ).setWidth( '50px' ).onChange( update );

	objectScaleRow.add( new UIText( strings.getKey( 'sidebar/object/scale' ) ).setClass( 'Label' ) );
	objectScaleRow.add( objectScaleX, objectScaleY, objectScaleZ );

	container.add( objectScaleRow );

	// user data

	const objectUserDataRow = new UIRow();
	const objectUserData = new UITextArea().setWidth( '150px' ).setHeight( '40px' ).setFontSize( '12px' ).onChange( update );
	objectUserData.onKeyUp( function () {

		try {

			JSON.parse( objectUserData.getValue() );

			objectUserData.dom.classList.add( 'success' );
			objectUserData.dom.classList.remove( 'fail' );

		} catch ( error ) {

			objectUserData.dom.classList.remove( 'success' );
			objectUserData.dom.classList.add( 'fail' );

		}

	} );

	objectUserDataRow.add( new UIText( strings.getKey( 'sidebar/object/userdata' ) ).setClass( 'Label' ) );
	objectUserDataRow.add( objectUserData );

	container.add( objectUserDataRow );

	// Export JSON

	const exportJson = new UIButton( strings.getKey( 'sidebar/object/export' ) );
	exportJson.setMarginLeft( '120px' );
	exportJson.onClick( function () {

		const object = editor.selected;

		let output = object.toJSON();

		try {

			output = JSON.stringify( output, null, '\t' );
			output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, '$1' );

		} catch ( e ) {

			output = JSON.stringify( output );

		}


		editor.utils.save( new Blob( [ output ] ), `${ objectName.getValue() || 'object' }.json` );

	} );
	container.add( exportJson );

	function update() {
		/**
		 * Update UI from object
		 */

		const object = editor.selector.currentSelectedObject;

		if (object === null || object === undefined) {
			return
		}

		// Handle Inches
		let newPosition = new THREE.Vector3( objectPositionX.getValue(), objectPositionY.getValue(), objectPositionZ.getValue() );
		let position = object.position.clone();
		if (!snapper.metric) {
			position = new THREE.Vector3(
				snapper.metersToInches(newPosition.x),
				snapper.metersToInches(newPosition.y),
				snapper.metersToInches(newPosition.z))
			newPosition = new THREE.Vector3(
				snapper.inchesToMeters(newPosition.x),
				snapper.inchesToMeters(newPosition.y),
				snapper.inchesToMeters(newPosition.z)
			)
		}
		if ( position.distanceTo( newPosition ) >= 0.01 ) {
			editor.execute( new SetPositionCommand( object, object.position, newPosition ) );
		}

		const newRotation = new THREE.Euler( objectRotationX.getValue() * THREE.MathUtils.DEG2RAD, objectRotationY.getValue() * THREE.MathUtils.DEG2RAD, objectRotationZ.getValue() * THREE.MathUtils.DEG2RAD );
		if ( new THREE.Vector3().setFromEuler( object.rotation ).distanceTo( new THREE.Vector3().setFromEuler( newRotation ) ) >= 0.01 ) {
			editor.execute( new SetRotationCommand( object, object.quaternion.clone(), new THREE.Quaternion().setFromEuler(newRotation)));
		}

		const newScale = new THREE.Vector3( objectScaleX.getValue(), objectScaleY.getValue(), objectScaleZ.getValue() );
		if ( object.scale.distanceTo( newScale ) >= 0.01 ) {
			editor.execute( new SetScaleCommand( object, object.scale, newScale ) );
		}
		// try {

		// 	const userData = JSON.parse( objectUserData.getValue() );
		// 	if ( JSON.stringify( object.userData ) != JSON.stringify( userData ) ) {

		// 		editor.execute( new SetValueCommand( editor, object, 'userData', userData ) );

		// 	}

		// } catch ( exception ) {

		// 	console.warn( exception );

		// }

	}

	function updateRows( object ) {
		/**
		 * Show/Hide rows based on the editable fields of the object
		 */

		const properties = {
			type: objectTypeRow,
			uuid: objectUUIDRow,
			name: objectNameRow,
			position: objectPositionRow,
			rotation: objectRotationRow,
			scale: objectScaleRow,
			userData: objectUserDataRow,
			exportJson: exportJson
		}

		// Hide all fields
		Object.keys(properties).forEach((property) => {
			const uiElement = properties[ property ];
			if ( Array.isArray( uiElement ) === true ) {
				for ( let i = 0; i < uiElement.length; i ++ ) {
					uiElement[ i ].setDisplay( 'none');
				}
			} else {
				uiElement.setDisplay( 'none' );
			}
		});

		const editableFields = object.userData.editableFields;
		if (editableFields === undefined) {
			return;
		}

		Object.keys(editableFields).forEach((property) => {

			const uiElement = properties[ property ];

			if (uiElement === undefined) {
				console.error(`${property} does not correspond to a UIElement!`);
				return;
			}

			if ( Array.isArray( uiElement ) === true ) {

				for ( let i = 0; i < uiElement.length; i ++ ) {

					uiElement[ i ].setDisplay( editableFields[ property ] !== undefined ? '' : 'none' );

				}

			} else {

				uiElement.setDisplay( editableFields[ property ] !== undefined ? '' : 'none' );

			}

		});

	}

	// // events

	eventBus.on(EventEnums.OBJECT_SELECTED, (object) => {
		if ( object !== null && object !== undefined) {

			container.setDisplay( 'block' );

			updateRows( object );
			updateUI( object );

		} else {

			container.setDisplay( 'none' );

		}

	} );

	eventBus.on(EventEnums.OBJECT_CHANGED, ( object ) => {

		if (object === undefined) {
			return
		}

		updateUI( object );

	} );

	eventBus.on(EventEnums.METRIC_CHANGED, () => {

		const object = editor.selector.currentSelectedObject;

		if (object === undefined) {
			return
		}

		updateUI( object );
	})

	// signals.refreshSidebarObject3D.add( function ( object ) {

	// 	if ( object !== editor.selected ) return;

	// 	updateUI( object );

	// } );

	function updateUI( object ) {

		objectType.setValue( object.type );

		objectUUID.setValue( object.uuid );
		objectName.setValue( object.name );

		// Switch between metric and imperial
		const x = snapper.metric ? object.position.x : snapper.metersToInches(object.position.x);
		const y = snapper.metric ? object.position.y : snapper.metersToInches(object.position.y);
		const z = snapper.metric ? object.position.z : snapper.metersToInches(object.position.z);

		if (snapper.metric) {
			objectPositionX.setUnit('m').setPrecision(3)
			objectPositionY.setUnit('m').setPrecision(3)
			objectPositionZ.setUnit('m').setPrecision(3)
		} else {
			objectPositionX.setUnit('"').setPrecision(0)
			objectPositionY.setUnit('"').setPrecision(0)
			objectPositionZ.setUnit('"').setPrecision(0)
		}

		objectPositionX.setValue( x );
		objectPositionY.setValue( y );
		objectPositionZ.setValue( z );

		objectRotationX.setValue( object.rotation.x * THREE.MathUtils.RAD2DEG );
		objectRotationY.setValue( object.rotation.y * THREE.MathUtils.RAD2DEG );
		objectRotationZ.setValue( object.rotation.z * THREE.MathUtils.RAD2DEG );

		objectScaleX.setValue( object.scale.x );
		objectScaleY.setValue( object.scale.y );
		objectScaleZ.setValue( object.scale.z );

		try {

			objectUserData.setValue( JSON.stringify( object.userData, null, '  ' ) );

		} catch ( error ) {

			console.log( error );

		}

		objectUserData.setBorderColor( 'transparent' );
		objectUserData.setBackgroundColor( '' );

		// updateTransformRows( object );

	}

	return container;

}

export { SidebarObject };
