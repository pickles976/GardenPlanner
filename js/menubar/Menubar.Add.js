import * as THREE from 'three';

import { UIPanel, UIRow } from '../libs/ui.js';

import { CreateObjectCommand } from '../commands/CreateObjectCommand.js';
import { Strings } from '../sidebar/Strings.js';
import { eventBus, EventEnums } from '../EventBus.js';
import { createCube } from '../Creation.js';

const strings = Strings({'language': 'en'});

function MenubarAdd( editor ) {

	// const strings = editor.strings;

	const container = new UIPanel();
	container.setClass( 'menu' );

	const title = new UIPanel();
	title.setClass( 'title' );
	title.setTextContent( strings.getKey( 'menubar/add' ) );
	container.add( title );

	const options = new UIPanel();
	options.setClass( 'options' );
	container.add( options );

	// Bed

	let option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( 'Bed' );
	option.onClick(() => eventBus.emit(EventEnums.BED_CREATION_STARTED, undefined));
	options.add( option );

	// Plants
	option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( 'Plant' );
	option.onClick(() => {
		createCube(editor);
	});
	options.add( option );

	// Group

	// let option = new UIRow();
	// option.setClass( 'option' );
	// option.setTextContent( strings.getKey( 'menubar/add/group' ) );
	// option.onClick( function () {

	// 	const mesh = new THREE.Group();
	// 	mesh.name = 'Group';

	// 	editor.execute( new CreateObjectCommand( editor, mesh ) );

	// } );
	// options.add( option );

	// // Mesh

	// const meshSubmenuTitle = new UIRow().setTextContent( strings.getKey( 'menubar/add/mesh' ) ).addClass( 'option' ).addClass( 'submenu-title' );
	// meshSubmenuTitle.onMouseOver( function () {

	// 	const { top, right } = meshSubmenuTitle.dom.getBoundingClientRect();
	// 	const { paddingTop } = getComputedStyle( this.dom );
	// 	meshSubmenu.setLeft( right + 'px' );
	// 	meshSubmenu.setTop( top - parseFloat( paddingTop ) + 'px' );
	// 	meshSubmenu.setStyle( 'max-height', [ `calc( 100vh - ${top}px )` ] );
	// 	meshSubmenu.setDisplay( 'block' );

	// } );
	// meshSubmenuTitle.onMouseOut( function () {

	// 	meshSubmenu.setDisplay( 'none' );

	// } );
	// options.add( meshSubmenuTitle );

	// const meshSubmenu = new UIPanel().setPosition( 'fixed' ).addClass( 'options' ).setDisplay( 'none' );
	// meshSubmenuTitle.add( meshSubmenu );

	// // Mesh / Box

	// option = new UIRow();
	// option.setClass( 'option' );
	// option.setTextContent( strings.getKey( 'menubar/add/mesh/box' ) );
	// option.onClick( function () {

	// 	const geometry = new THREE.BoxGeometry( 1, 1, 1, 1, 1, 1 );
	// 	const mesh = new THREE.Mesh( geometry, new THREE.MeshStandardMaterial() );
	// 	mesh.name = 'Box';

	// 	editor.execute( new CreateObjectCommand( editor, mesh ) );

	// } );
	// meshSubmenu.add( option );

	// Camera

	const cameraSubmenuTitle = new UIRow().setTextContent( strings.getKey( 'menubar/add/camera' ) ).addClass( 'option' ).addClass( 'submenu-title' );
	cameraSubmenuTitle.onMouseOver( function () {

		const { top, right } = cameraSubmenuTitle.dom.getBoundingClientRect();
		const { paddingTop } = getComputedStyle( this.dom );

		cameraSubmenu.setLeft( right + 'px' );
		cameraSubmenu.setTop( top - parseFloat( paddingTop ) + 'px' );
		cameraSubmenu.setStyle( 'max-height', [ `calc( 100vh - ${top}px )` ] );
		cameraSubmenu.setDisplay( 'block' );

	} );
	cameraSubmenuTitle.onMouseOut( function () {

		cameraSubmenu.setDisplay( 'none' );

	} );
	options.add( cameraSubmenuTitle );

	const cameraSubmenu = new UIPanel().setPosition( 'fixed' ).addClass( 'options' ).setDisplay( 'none' );
	cameraSubmenuTitle.add( cameraSubmenu );

	// Camera / Orthographic

	option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( strings.getKey( 'menubar/add/camera/orthographic' ) );
	option.onClick( function () {

		const aspect = editor.camera.aspect;
		const camera = new THREE.OrthographicCamera( - aspect, aspect );
		camera.name = 'OrthographicCamera';

		editor.execute( new CreateObjectCommand( editor, camera ) );

	} );
	cameraSubmenu.add( option );

	// Camera / Perspective

	option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( strings.getKey( 'menubar/add/camera/perspective' ) );
	option.onClick( function () {

		const camera = new THREE.PerspectiveCamera();
		camera.name = 'PerspectiveCamera';

		editor.execute( new CreateObjectCommand( editor, camera ) );

	} );
	cameraSubmenu.add( option );

	return container;

}

export { MenubarAdd };
