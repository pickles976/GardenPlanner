import { contain } from 'three/src/extras/TextureUtils.js';
import { UITabbedPanel, UIPanel } from '../libs/ui.js';

import { SidebarObject } from './Sidebar.Object.js';
import { Strings } from './Strings.js';
import { SidebarBed } from './Sidebar.Bed.js'
import { eventBus, EventEnums } from '../EventBus.js';
import { SidebarPlant } from './Sidebar.Plant.js';

const strings = new Strings({});

function SidebarProperties( editor ) {

	const container = new UIPanel();
	container.setId( 'properties' );

	const objectTab = new SidebarObject(editor);
	objectTab.setDisplay("none")

	const plantTab = new SidebarPlant( editor );
	plantTab.setDisplay("none")

	const bedPanel = new SidebarBed( editor );
	bedPanel.setDisplay("none")
	
	container.add(bedPanel);
	container.add(plantTab);
	container.add(objectTab);

	eventBus.on(EventEnums.BED_SELECTED, (value) => {bedPanel.setDisplay(value ? "Block" : "none")});
	eventBus.on(EventEnums.BED_CREATION_STARTED, () => {bedPanel.setDisplay("Block")});
	eventBus.on(EventEnums.BED_EDITING_STARTED, () => {bedPanel.setDisplay("Block")});
	eventBus.on(EventEnums.BED_EDITING_FINISHED, () => {bedPanel.setDisplay("none")});
	eventBus.on(EventEnums.BED_EDITING_CANCELLED, () => {bedPanel.setDisplay("none")});

	eventBus.on(EventEnums.PLANT_SELECTED, (value) => {plantTab.setDisplay(value ? "Block" : "none")})

	return container;

}

export { SidebarProperties };
