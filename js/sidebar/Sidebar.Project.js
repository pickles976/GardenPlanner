import { UISpan } from '../libs/ui.js';

import { SidebarProjectApp } from './Sidebar.Project.App.js';
/* import { SidebarProjectMaterials } from './Sidebar.Project.Materials.js'; */

function SidebarProject( editor ) {

	const container = new UISpan();

	/* container.add( new SidebarProjectMaterials( editor ) ); */

	container.add( new SidebarProjectApp( editor ) );

	container.add( new SidebarProjectImage( editor ) );

	if ( 'SharedArrayBuffer' in window ) {

		container.add( new SidebarProjectVideo( editor ) );

	}

	return container;

}

export { SidebarProject };
