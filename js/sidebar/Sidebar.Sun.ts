import * as THREE from 'three';

import { UIPanel, UIRow, UIInput, UIButton, UIColor, UICheckbox, UIInteger, UITextArea, UIText, UINumber } from '../libs/ui.js';

import { Editor } from '../Editor.js';
import SunCalc from "suncalc";
import { rad2deg } from '../Utils.js';


const LAT = 30.354156;
const LON = -97.757466;

function getTimeString(date: Date) {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
}

class SidebarSun {

    editor: Editor;
    container: UIPanel;

    northRow: UIRow;
    north: UINumber;

    latitudeRow: UIRow;
    latitude: UINumber;

    longitudeRow: UIRow;
    longitude: UINumber;

    timeRow: UIRow;
    time: object;

    constructor ( editor: Editor ) {
        this.editor = editor;

        this.container = new UIPanel();
        this.container.setBorderTop( '0' );
        this.container.setPaddingTop( '20px' );
        this.container.setDisplay("Block")

        this.northRow = new UIRow;
        this.north = new UINumber().setPrecision( 3 ).setNudge( 1.0 ).setWidth( '70px' ).onChange( () => { this.update() } ).setUnit('°');
        this.north.setValue(0.0);
        this.northRow.add( new UIText( "North" ).setClass( 'Label' ).setWidth('70px') );
        this.northRow.add(this.north);

        // Lat/Lon
        this.latitudeRow = new UIRow();
        this.latitude = new UINumber().setPrecision( 6 ).setWidth( '70px' ).onChange( () => { this.update() } ).setUnit('°');
        this.latitudeRow.add( new UIText( "Latitude" ).setClass( 'Label' ).setWidth('70px') );
        this.latitudeRow.add(this.latitude)

        this.longitudeRow = new UIRow();
        this.longitude = new UINumber().setPrecision( 6 ).setWidth( '70px' ).onChange( () => { this.update() } ).setUnit('°');
        this.longitudeRow.add( new UIText( "Longitude" ).setClass( 'Label' ).setWidth('70px') );
        this.longitudeRow.add( this.longitude );

        this.latitude.setValue(LAT) 
        this.longitude.setValue(LON) 

        const date = new Date();

        // Time
        this.timeRow = new UIRow();
        this.time = document.createElement('input');
        this.time.addEventListener('change', () => { this.update() });

        this.time.type = 'datetime-local';
        this.time.id = 'meeting-time';
        this.time.name = 'meeting-time';
        this.time.value = getTimeString(date);
        this.time.min = '2025-01-01T00:00';
        this.time.max = '2080-01-01T00:00';

        this.timeRow.add( new UIText( "Time" ).setClass( 'Label' ).setWidth('70px') );
        this.timeRow.dom.appendChild(this.time)

        this.container.add(this.latitudeRow)
        this.container.add(this.longitudeRow)
        this.container.add(this.timeRow)
        this.container.add(this.northRow)

        const pos = SunCalc.getPosition(new Date(), LAT, LON, 0)
        editor.setSunPosition(rad2deg(pos.azimuth), rad2deg(pos.altitude));

    }

    private update() {

        const date = new Date(this.time.value);
        const lon = this.longitude.value;
        const lat = this.latitude.value;

        this.editor.setNorth(this.north.value);

        const pos = SunCalc.getPosition(date, lat, lon, 0)
        this.editor.setSunPosition(rad2deg(pos.azimuth), rad2deg(pos.altitude));

    }

    // public handleKeyDown(e) {

    //     if (e.shiftKey) {
    //         switch (e.code) {
    //             case 'KeyS':
    //                 this.snapCheck.setValue(!this.snapCheck.getValue());
    //                 eventBus.emit(EventEnums.SNAP_CHANGED, this.snapCheck.getValue());
    //                 break;
    //             case 'KeyM':
    //                 this.metricCheck.setValue(!this.metricCheck.getValue());
    //                 eventBus.emit(EventEnums.METRIC_CHANGED, this.metricCheck.getValue());
    //                 break;
    //         }
    //         return;
    //     }

    //     if (e.code === "KeyG") {
    //         this.grassCheck.setValue(!this.grassCheck.getValue())
    //         eventBus.emit(EventEnums.GRASS_CHANGED, this.grassCheck.getValue());
    //     } 

    // }

}

export { SidebarSun };
