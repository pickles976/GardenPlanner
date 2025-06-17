import { contain } from 'three/src/extras/TextureUtils.js';
import { UITabbedPanel } from '../libs/ui.js';

import { SidebarObject } from './Sidebar.Object.js';
import { Strings } from './Strings.js';
import { SidebarBed } from './Sidebar.Bed.js'
import { eventBus, EventEnums } from '../EventBus.js';
// import { SidebarGeometry } from './Sidebar.Geometry.js';
// import { SidebarMaterial } from './Sidebar.Material.js';

const strings = new Strings({});

function SidebarProperties( editor ) {

	// const strings = editor.strings;

	const container = new UITabbedPanel();
	container.setId( 'properties' );

	container.addTab('objectTab', strings.getKey( 'sidebar/properties/object' ), new SidebarObject(editor));

	container.addTab( 'bedTab', "Bed", new SidebarBed( editor ) );
	container.select( 'objectTab' );

	eventBus.on(EventEnums.BED_CREATION_STARTED, () => {container.select('bedTab')});

	return container;

}

export { SidebarProperties };
