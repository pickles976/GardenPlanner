import { UITabbedPanel, UISpan, UIPanel } from '../libs/ui.js';

import { SidebarScene } from './Sidebar.Scene.js';
import { SidebarProperties } from './Sidebar.Properties.js';
import { SidebarGlobals } from './Sidebar.Globals.ts';

import { Strings } from './Strings.js';
import { Editor } from '../editors/Editor.ts';
const strings = Strings({'language': 'en'});

class Sidebar {

	editor: Editor;
	container: UIPanel;
	sidebarGlobals: SidebarGlobals;
	sidebarScene: UIPanel;
	sidebarProperties: UITabbedPanel;
	scene: UISpan;


	constructor (editor: Editor) {
		this.editor = editor;
		this.container = new UIPanel();
		this.container.setId( 'sidebar' );

		this.sidebarGlobals = new SidebarGlobals( editor );
		this.sidebarScene = SidebarScene( editor );
		this.sidebarProperties = SidebarProperties( editor );

		this.scene = new UISpan().add(
			this.sidebarGlobals.container,
			this.sidebarScene,
			this.sidebarProperties
		);

		this.container.add(this.scene );
		// this.container.select( 'scene' );

		// Need these to be local sothe callback will work (TODO: pull this out into a method?)
		// const container = this.container;
		// const sidebarProperties = this.sidebarProperties;
		// const sidebarPropertiesResizeObserver = new ResizeObserver( function () {
		// 	sidebarProperties.tabsDiv.setWidth( getComputedStyle( container.dom ).width );
		// } );

		// sidebarPropertiesResizeObserver.observe( this.container.tabsDiv.dom );

	}

	public handleKeyDown(event) {
		this.sidebarGlobals.handleKeyDown(event)
	}


}

export { Sidebar };
