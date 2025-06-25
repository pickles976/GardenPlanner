
import { UIPanel, UIRow } from '../libs/ui.js';

import { Strings } from '../sidebar/Strings.js';
import { eventBus, EventEnums } from '../EventBus.js';
import { createCube, createCylinder, createPlane, createSphere } from '../Creation.js';
import { createSearchPanel } from '../Plants.js';

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

	const pathSubmenuTitle = new UIRow().setTextContent( "Path" ).addClass( 'option' ).addClass( 'submenu-title' );
	pathSubmenuTitle.onMouseOver( function () {

		const { top, right } = pathSubmenuTitle.dom.getBoundingClientRect();
		const { paddingTop } = getComputedStyle( this.dom );

		pathSubmenu.setLeft( right + 'px' );
		pathSubmenu.setTop( top - parseFloat( paddingTop ) + 'px' );
		pathSubmenu.setStyle( 'max-height', [ `calc( 100vh - ${top}px )` ] );
		pathSubmenu.setDisplay( 'block' );

	} );
	pathSubmenuTitle.onMouseOut( function () {

		pathSubmenu.setDisplay( 'none' );

	} );
	options.add( pathSubmenuTitle );

	const pathSubmenu = new UIPanel().setPosition( 'fixed' ).addClass( 'options' ).setDisplay( 'none' );
	pathSubmenuTitle.add( pathSubmenu );

	// Bed
	option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( "Bed" );
	option.onClick(() => eventBus.emit(EventEnums.BED_CREATION_STARTED, undefined));
	pathSubmenu.add( option );

	// Fence
	option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( "Fence" );
	option.onClick(() => eventBus.emit(EventEnums.FENCE_CREATION_STARTED, undefined));
	pathSubmenu.add( option );

	// Ruler
	option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( "Ruler" );
	option.onClick(() => eventBus.emit(EventEnums.RULER_CREATION_STARTED, undefined));
	pathSubmenu.add( option );

	// Path
	option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( "Path" );
	option.onClick(() => eventBus.emit(EventEnums.PATH_CREATION_STARTED, undefined));
	pathSubmenu.add( option );

	// Plants

	const plantSubmenuTitle = new UIRow().setTextContent( "Plant" ).addClass( 'option' ).addClass( 'submenu-title' );
	plantSubmenuTitle.onMouseOver( function () {

		const { top, right } = plantSubmenuTitle.dom.getBoundingClientRect();
		const { paddingTop } = getComputedStyle( this.dom );

		plantSubmenu.setLeft( right + 'px' );
		plantSubmenu.setTop( top - parseFloat( paddingTop ) + 'px' );
		plantSubmenu.setStyle( 'max-height', [ `calc( 100vh - ${top}px )` ] );
		plantSubmenu.setDisplay( 'block' );

	} );
	plantSubmenuTitle.onMouseOut( function () {

		plantSubmenu.setDisplay( 'none' );

	} );
	options.add( plantSubmenuTitle );

	const plantSubmenu = new UIPanel().setPosition( 'fixed' ).addClass( 'options' ).setDisplay( 'none' );
	plantSubmenuTitle.add( plantSubmenu );

	// From Browser
	option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( "Use Existing" );
	option.onClick(() => {
		if (document.getElementById("search-panel") === null) {
			document.body.appendChild(createSearchPanel());
		}
	});
	plantSubmenu.add( option );

	// New
	option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( "Create New" );
	option.onClick(() => console.error("Not implemented!"));
	plantSubmenu.add( option );

	// Objects
	const objectSubmenuTitle = new UIRow().setTextContent( "Object" ).addClass( 'option' ).addClass( 'submenu-title' );
	objectSubmenuTitle.onMouseOver( function () {

		const { top, right } = objectSubmenuTitle.dom.getBoundingClientRect();
		const { paddingTop } = getComputedStyle( this.dom );

		objectSubmenu.setLeft( right + 'px' );
		objectSubmenu.setTop( top - parseFloat( paddingTop ) + 'px' );
		objectSubmenu.setStyle( 'max-height', [ `calc( 100vh - ${top}px )` ] );
		objectSubmenu.setDisplay( 'block' );

	} );
	objectSubmenuTitle.onMouseOut( function () {

		objectSubmenu.setDisplay( 'none' );

	} );
	options.add( objectSubmenuTitle );

	const objectSubmenu = new UIPanel().setPosition( 'fixed' ).addClass( 'options' ).setDisplay( 'none' );
	objectSubmenuTitle.add( objectSubmenu );

	// Plane
	option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( "Plane" );
	option.onClick( () => createPlane(editor));
	objectSubmenu.add( option );

	// Cube
	option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( "Cube" );
	option.onClick( () => createCube(editor));
	objectSubmenu.add( option );

	// Cylinder
	option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( "Cylinder" );
	option.onClick(() => createCylinder(editor));
	objectSubmenu.add( option );

	// Sphere
	option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( "Sphere" );
	option.onClick(() => createSphere(editor));
	objectSubmenu.add( option );

	return container;

}

export { MenubarAdd };
