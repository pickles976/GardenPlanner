import { UIPanel } from '../libs/ui.js';

import { SidebarObject } from './Sidebar.Object.js';
import { Strings } from './Strings.js';
import { SidebarBed } from './Sidebar.Bed.js'
import { SidebarFence } from './Sidebar.Fence.js';
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

	const bedTab = new SidebarBed( editor );
	bedTab.setDisplay("none")

	const fenceTab = new SidebarFence( editor );
	fenceTab.setDisplay("none")
	
	container.add(bedTab);
	container.add(fenceTab);
	container.add(plantTab);
	container.add(objectTab);

	eventBus.on(EventEnums.BED_SELECTED, (value) => {bedTab.setDisplay(value ? "Block" : "none")});
	eventBus.on(EventEnums.BED_CREATION_STARTED, () => {bedTab.setDisplay("Block")});
	eventBus.on(EventEnums.BED_EDITING_STARTED, () => {bedTab.setDisplay("Block")});
	eventBus.on(EventEnums.BED_EDITING_FINISHED, () => {bedTab.setDisplay("none")});
	eventBus.on(EventEnums.BED_EDITING_CANCELLED, () => {bedTab.setDisplay("none")});

	eventBus.on(EventEnums.FENCE_SELECTED, (value) => {fenceTab.setDisplay(value ? "Block" : "none")});
	eventBus.on(EventEnums.FENCE_CREATION_STARTED, () => {fenceTab.setDisplay("Block")});
	eventBus.on(EventEnums.FENCE_EDITING_STARTED, () => {fenceTab.setDisplay("Block")});
	eventBus.on(EventEnums.FENCE_EDITING_FINISHED, () => {fenceTab.setDisplay("none")});
	eventBus.on(EventEnums.FENCE_EDITING_CANCELLED, () => {fenceTab.setDisplay("none")});

	eventBus.on(EventEnums.PLANT_SELECTED, (value) => {plantTab.setDisplay(value ? "Block" : "none")})

	return container;

}

export { SidebarProperties };
