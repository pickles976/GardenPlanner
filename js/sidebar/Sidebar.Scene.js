import * as THREE from 'three';

import { UIPanel, UIBreak, UIRow, UIColor, UISelect, UIText, UINumber } from '../libs/ui.js';
import { UIOutliner, UITexture } from '../libs/ui.three.js';
import { eventBus, EventEnums } from '../EventBus.js';

function SidebarScene( editor ) {

	// const signals = editor.signals;
	// const strings = editor.strings;

	const container = new UIPanel();
	container.setBorderTop( '0' );
	container.setPaddingTop( '20px' );

	// outliner

	const nodeStates = new WeakMap();

	function buildOption( object, draggable ) {

		const option = document.createElement( 'div' );
		option.draggable = draggable;
		option.innerHTML = buildHTML( object );
		option.value = object.uuid;

		// opener

		if ( nodeStates.has( object ) ) {

			const state = nodeStates.get( object );

			const opener = document.createElement( 'span' );
			opener.classList.add( 'opener' );

			if ( object.children.length > 0 ) {

				opener.classList.add( state ? 'open' : 'closed' );

			}

			opener.addEventListener( 'click', function () {
				nodeStates.set( object, nodeStates.get( object ) === false ); // toggle
				refreshUI();

			} );

			option.insertBefore( opener, option.firstChild );

		}

		return option;

	}

	function getMaterialName( material ) {

		if ( Array.isArray( material ) ) {

			const array = [];

			for ( let i = 0; i < material.length; i ++ ) {

				array.push( material[ i ].name );

			}

			return array.join( ',' );

		}

		return material.name;

	}

	function escapeHTML( html ) {

		// Handle empty string
		if (!html) {
			return "None"
		}

		return html
			.replace( /&/g, '&amp;' )
			.replace( /"/g, '&quot;' )
			.replace( /'/g, '&#39;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' );

	}

	function getObjectType( object ) {

		if ( object.isScene ) return 'Scene';
		if ( object.isCamera ) return 'Camera';
		if ( object.isLight ) return 'Light';
		if ( object.isMesh ) return 'Mesh';
		if ( object.isLine ) return 'Line';
		if ( object.isPoints ) return 'Points';

		return 'Object3D';

	}

	function buildHTML( object ) {

		let html = `<span class="type ${ getObjectType( object ) }"></span> ${ escapeHTML( object.name ) }`;

		if ( object.isMesh ) {

			const geometry = object.geometry;
			const material = object.material;

			html += ` <span class="type Geometry"></span> ${ escapeHTML( geometry.name ) }`;
			html += ` <span class="type Material"></span> ${ escapeHTML( getMaterialName( material ) ) }`;

		}

		return html;

	}

	let ignoreObjectSelectedSignal = false;

	const outliner = new UIOutliner( editor );
	outliner.setId( 'outliner' );
	outliner.onChange( function () {

		ignoreObjectSelectedSignal = true;
		editor.selectByUUID( outliner.getValue() );
		ignoreObjectSelectedSignal = false;

	} );
	outliner.onDblClick( function () {
		editor.focusByUUID( outliner.getValue() );
	} );
	container.add( outliner );
	container.add( new UIBreak() );

	function refreshUI() {

		const camera = editor.camera;
		const scene = editor.scene;

		const options = [];

		// options.push( buildOption( camera, false ) );
		options.push( buildOption( scene, false ) );

		( function addObjects( objects, pad ) {

			for ( let i = 0, l = objects.length; i < l; i ++ ) {

				const object = objects[ i ];

				if (!object.userData.hasOwnProperty("selectable")) {
					continue;
				}

				if ( nodeStates.has( object ) === false ) {

					nodeStates.set( object, false );

				}

				const option = buildOption( object, true );
				option.style.paddingLeft = ( pad * 18 ) + 'px';
				options.push( option );

				if ( nodeStates.get( object ) === true ) {

					addObjects( object.children, pad + 1 );

				}

			}

		} )( scene.children, 0 );

		outliner.setOptions( options );

		if ( editor.selector.currentSelectedObject !== null && editor.selector.currentSelectedObject !== undefined ) {

			outliner.setValue( editor.selector.currentSelectedObject.uuid );

		}

	}

	refreshUI();

	eventBus.on(EventEnums.OBJECT_SELECTED, refreshUI);
	eventBus.on(EventEnums.BED_CREATION_STARTED, () => {
		container.setDisplay("none")
	})
	eventBus.on(EventEnums.BED_EDITING_FINISHED, () => {
		container.setDisplay("Block")
		refreshUI()
	})
	eventBus.on(EventEnums.BED_EDITING_CANCELLED, () => {
		container.setDisplay("Block")
		refreshUI()
	})
	eventBus.on(EventEnums.OBJECT_ADDED, () => {
		refreshUI()
	})
	eventBus.on(EventEnums.OBJECT_REMOVED, () => {
		refreshUI()
	})

	return container;

}

export { SidebarScene };
