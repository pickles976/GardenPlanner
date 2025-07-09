import { Box3, Vector3 } from 'three';

import { UIPanel, UIRow, UIHorizontalRule, UIText } from '../libs/ui.js';

import { CreateObjectCommand } from '../commands/CreateObjectCommand.js';
import { DeleteObjectCommand } from '../commands/DeleteObjectCommand.js';
import { SetPositionCommand } from '../commands/SetPositionCommand.js';
// import { clone } from '../../examples/jsm/utils/SkeletonUtils.js';
import { deepClone } from '../Utils.js';
import { Strings } from '../sidebar/Strings.js';

const strings = Strings({'language': 'en'});

function MenubarEdit( editor ) {

	// const strings = editor.strings;

	const container = new UIPanel();
	container.setClass( 'menu' );

	const title = new UIPanel();
	title.setClass( 'title' );
	title.setTextContent( strings.getKey( 'menubar/edit' ) );
	container.add( title );

	const options = new UIPanel();
	options.setClass( 'options' );
	container.add( options );

	// Undo

	const undo = new UIRow();
	undo.setClass( 'option' );
	undo.setTextContent( strings.getKey( 'menubar/edit/undo' ) );
	undo.add( new UIText( 'CTRL+Z' ).setClass( 'key' ) );
	undo.onClick( function () {

		editor.undo();

	} );
	options.add( undo );

	// Redo

	// const redo = new UIRow();
	// redo.setClass( 'option' );
	// redo.setTextContent( strings.getKey( 'menubar/edit/redo' ) );
	// redo.add( new UIText( 'CTRL+SHIFT+Z' ).setClass( 'key' ) );
	// redo.onClick( function () {

	// 	editor.redo();

	// } );
	// options.add( redo );

	// function onHistoryChanged() {

	// 	const history = editor.history;

	// 	undo.setClass( 'option' );
	// 	redo.setClass( 'option' );

	// 	if ( history.undos.length == 0 ) {

	// 		undo.setClass( 'inactive' );

	// 	}

	// 	if ( history.redos.length == 0 ) {

	// 		redo.setClass( 'inactive' );

	// 	}

	// }

	// editor.signals.historyChanged.add( onHistoryChanged );
	// onHistoryChanged();

	// ---

	options.add( new UIHorizontalRule() );

	// Clone

	let option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( strings.getKey( 'menubar/edit/clone' ) );
	option.add( new UIText( 'SHIFT+D' ).setClass( 'key' ) );
	option.onClick( function () {

		let object = editor.selector.currentSelectedObject;

		if ( object === null || object.parent === null ) return; // avoid cloning the camera or scene

		editor.execute(new CreateObjectCommand(deepClone(object), editor));

	} );
	options.add( option );

	// Delete

	option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( strings.getKey( 'menubar/edit/delete' ) );
	option.add( new UIText( 'DEL' ).setClass( 'key' ) );
	option.onClick( function () {

		const object = editor.selector.currentSelectedObject;

		if ( object !== null && object.parent !== null ) {

			editor.execute( new DeleteObjectCommand( object, editor ) );

		}

	} );
	options.add( option );

	return container;

}

export { MenubarEdit };
