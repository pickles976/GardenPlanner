import { contain } from 'three/src/extras/TextureUtils.js';
import { UITabbedPanel, UIPanel } from '../libs/ui.js';

import { SidebarObject } from './Sidebar.Object.js';
import { Strings } from './Strings.js';
import { SidebarBed } from './Sidebar.Bed.js'
import { eventBus, EventEnums } from '../EventBus.js';
import { SidebarPlant } from './Sidebar.Plant.js';
import { SidebarRuler } from './Sidebar.Ruler.js';

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

	const rulerPanel = new SidebarRuler(editor);
	rulerPanel.setDisplay("none")
	
	container.add(bedPanel);
	container.add(rulerPanel);
	container.add(plantTab);
	container.add(objectTab);

	eventBus.on(EventEnums.BED_SELECTED, (value) => {bedPanel.setDisplay(value ? "Block" : "none")});
	eventBus.on(EventEnums.BED_CREATION_STARTED, () => {bedPanel.setDisplay("Block")});
	eventBus.on(EventEnums.BED_EDITING_STARTED, () => {bedPanel.setDisplay("Block")});
	eventBus.on(EventEnums.BED_EDITING_FINISHED, () => {bedPanel.setDisplay("none")});
	eventBus.on(EventEnums.BED_EDITING_CANCELLED, () => {bedPanel.setDisplay("none")});

	eventBus.on(EventEnums.RULER_SELECTED, (value) => {rulerPanel.setDisplay(value ? "Block" : "none")});
	eventBus.on(EventEnums.RULER_CREATION_STARTED, () => {rulerPanel.setDisplay("Block")});
	eventBus.on(EventEnums.RULER_EDITING_STARTED, () => {rulerPanel.setDisplay("Block")});
	eventBus.on(EventEnums.RULER_EDITING_FINISHED, () => {rulerPanel.setDisplay("none")});
	eventBus.on(EventEnums.RULER_EDITING_CANCELLED, () => {rulerPanel.setDisplay("none")});


	eventBus.on(EventEnums.PLANT_SELECTED, (value) => {plantTab.setDisplay(value ? "Block" : "none")})

	return container;

}

export { SidebarProperties };
