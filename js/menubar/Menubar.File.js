import { UIPanel, UIRow, UIHorizontalRule } from '../libs/ui.js';
import { Strings } from '../sidebar/Strings.js';
import * as THREE from 'three';
import { saveJSON } from '../Utils.js';

const strings = Strings({'language': 'en'});

function MenubarFile( editor ) {

	// const strings = editor.strings;

	// const saveArrayBuffer = editor.utils.saveArrayBuffer;
	// const saveString = editor.utils.saveString;

	const container = new UIPanel();
	container.setClass( 'menu' );

	const title = new UIPanel();
	title.setClass( 'title' );
	title.setTextContent( strings.getKey( 'menubar/file' ) );
	container.add( title );

	const options = new UIPanel();
	options.setClass( 'options' );
	container.add( options );

	// New Project

	const newProjectSubmenuTitle = new UIRow().setTextContent( strings.getKey( 'menubar/file/new' ) ).addClass( 'option' ).addClass( 'submenu-title' );
	newProjectSubmenuTitle.onMouseOver( function () {

		const { top, right } = this.dom.getBoundingClientRect();
		const { paddingTop } = getComputedStyle( this.dom );
		newProjectSubmenu.setLeft( right + 'px' );
		newProjectSubmenu.setTop( top - parseFloat( paddingTop ) + 'px' );
		newProjectSubmenu.setDisplay( 'block' );

	} );
	newProjectSubmenuTitle.onMouseOut( function () {

		newProjectSubmenu.setDisplay( 'none' );

	} );
	options.add( newProjectSubmenuTitle );

	const newProjectSubmenu = new UIPanel().setPosition( 'fixed' ).addClass( 'options' ).setDisplay( 'none' );
	newProjectSubmenuTitle.add( newProjectSubmenu );

	// New Project / Empty

	let option = new UIRow().setTextContent( strings.getKey( 'menubar/file/new/empty' ) ).setClass( 'option' );
	option.onClick( function () {

		if ( confirm( strings.getKey( 'prompt/file/open' ) ) ) {

			editor.clear();
			editor.initScene();

		}

	} );
	newProjectSubmenu.add( option );

	// Open

	const openProjectForm = document.createElement( 'form' );
	openProjectForm.style.display = 'none';
	document.body.appendChild( openProjectForm );

	const openProjectInput = document.createElement( 'input' );
	openProjectInput.multiple = false;
	openProjectInput.type = 'file';
	openProjectInput.accept = '.json';
	openProjectInput.addEventListener( 'change', async function () {

		const file = openProjectInput.files[ 0 ];

		if ( file === undefined ) return;

		try {

			const json = JSON.parse( await file.text() );

			const loader = new THREE.ObjectLoader();
			const parsed = {
				"scene": loader.parse(json.scene),
				"config": json.config
			}

			editor.loadFromJson(parsed)

		} catch ( e ) {

			alert( strings.getKey( 'prompt/file/failedToOpenProject' ) );
			console.error( e );

		} finally {

			openProjectForm.reset();

		}

	} );

	openProjectForm.appendChild( openProjectInput );

	const openProjectSubmenuTitle = new UIRow().setTextContent( "Open" ).addClass( 'option' ).addClass( 'submenu-title' );
	openProjectSubmenuTitle.onMouseOver( function () {

		const { top, right } = openProjectSubmenuTitle.dom.getBoundingClientRect();
		const { paddingTop } = getComputedStyle( this.dom );

		openProjectSubmenu.setLeft( right + 'px' );
		openProjectSubmenu.setTop( top - parseFloat( paddingTop ) + 'px' );
		openProjectSubmenu.setStyle( 'max-height', [ `calc( 100vh - ${top}px )` ] );
		openProjectSubmenu.setDisplay( 'block' );

	} );
	openProjectSubmenuTitle.onMouseOut( function () {

		openProjectSubmenu.setDisplay( 'none' );

	} );
	options.add( openProjectSubmenuTitle );

	const openProjectSubmenu = new UIPanel().setPosition( 'fixed' ).addClass( 'options' ).setDisplay( 'none' );
	openProjectSubmenuTitle.add( openProjectSubmenu );

	// OPEN FROM JSON
	option = new UIRow()
	.addClass( 'option' )
	.setTextContent( "From Local File" )
	.onClick( function () {

		if ( confirm( strings.getKey( 'prompt/file/open' ) ) ) {

			openProjectInput.click();

		}

	} );

	openProjectSubmenu.add( option );

	// OPEN FROM LOCAL STORAGE
	option = new UIRow()
	.addClass( 'option' )
	.setTextContent( "From Browser" )
	.onClick( function () {
		// TODO: open!
	} );

	openProjectSubmenu.add( option );


	// Save

	const saveProjectSubmenuTitle = new UIRow().setTextContent( "Save" ).addClass( 'option' ).addClass( 'submenu-title' );
	saveProjectSubmenuTitle.onMouseOver( function () {

		const { top, right } = saveProjectSubmenuTitle.dom.getBoundingClientRect();
		const { paddingTop } = getComputedStyle( this.dom );

		saveProjectSubmenu.setLeft( right + 'px' );
		saveProjectSubmenu.setTop( top - parseFloat( paddingTop ) + 'px' );
		saveProjectSubmenu.setStyle( 'max-height', [ `calc( 100vh - ${top}px )` ] );
		saveProjectSubmenu.setDisplay( 'block' );

	} );
	saveProjectSubmenuTitle.onMouseOut( function () {

		saveProjectSubmenu.setDisplay( 'none' );

	} );
	options.add( saveProjectSubmenuTitle );

	const saveProjectSubmenu = new UIPanel().setPosition( 'fixed' ).addClass( 'options' ).setDisplay( 'none' );
	saveProjectSubmenuTitle.add( saveProjectSubmenu );

	option = new UIRow()
		.addClass( 'option' )
		.setTextContent( "Save to File" )
		.onClick( function () {

			const json = editor.exportToJson();
			const blob = new Blob( [ JSON.stringify( json ) ], { type: 'application/json' } );
			saveJSON( blob, 'project.json' );

		} );

	saveProjectSubmenu.add( option );

	option = new UIRow()
	.addClass( 'option' )
	.setTextContent( "Save to Browser" )
	.onClick( function () {
		// TODO: save!
	} );

	saveProjectSubmenu.add( option );


	//

	// options.add( new UIHorizontalRule() );

	// Import

	// const form = document.createElement( 'form' );
	// form.style.display = 'none';
	// document.body.appendChild( form );

	// const fileInput = document.createElement( 'input' );
	// fileInput.multiple = true;
	// fileInput.type = 'file';
	// fileInput.addEventListener( 'change', function () {

	// 	editor.loader.loadFiles( fileInput.files );
	// 	form.reset();

	// } );
	// form.appendChild( fileInput );

	// option = new UIRow();
	// option.setClass( 'option' );
	// option.setTextContent( strings.getKey( 'menubar/file/import' ) );
	// option.onClick( function () {

	// 	fileInput.click();

	// } );
	// options.add( option );

	return container;

}

export { MenubarFile };
