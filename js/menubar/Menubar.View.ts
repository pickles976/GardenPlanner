import { UIHorizontalRule, UIPanel, UIRow, UIText } from '../libs/ui.js';
import { Strings } from '../sidebar/Strings.js';
import {eventBus, EventEnums} from '../EventBus.js'
import { Editor } from '../Editor.js';

const strings = Strings({'language': 'en'});

class MenubarView {

	editor: Editor;
	container: UIPanel;
	states: Object;

	gridHelper: UIRow;
	cameraHelper: UIRow;

	compassState: boolean;
	compassHelper: UIRow;

	constructor (editor: Editor) {
		this.editor = editor;
		this.container = new UIPanel();
		this.container.setClass( 'menu' );

		const title = new UIPanel();
		title.setClass( 'title' );
		title.setTextContent( strings.getKey( 'menubar/view' ) );
		this.container.add( title );

		const options = new UIPanel();
		options.setClass( 'options' );
		this.container.add( options );

		// Helpers
		this.states = {
			gridHelper: true,
			cameraHelper: false,
			compassHelper: true,
		};

		// Grid Helper

		this.gridHelper = new UIRow().addClass( 'option' ).addClass( 'toggle' ).setTextContent( "Grid" ) 
		this.gridHelper.add( new UIText( "SHIFT+G" ).setClass( 'key' ));
		this.gridHelper.onClick(() => this.toggleGrid());
		this.gridHelper.toggleClass('toggle-on', true)

		// Camera Helper
		this.cameraHelper = new UIRow().addClass( 'option' ).addClass( 'toggle' ).setTextContent( "Top-Down" )
		this.cameraHelper.add( new UIText( "SHIFT+C" ).setClass( 'key' ));
		this.cameraHelper.onClick(() => this.toggleCamera());
		this.cameraHelper.toggleClass('toggle-on', false)

		// Compass Helper
		this.compassHelper = new UIRow().addClass( 'option' ).addClass( 'toggle' ).setTextContent( "Compass" )
		// this.compassHelper.add( new UIText( "SHIFT+C" ).setClass( 'key' ));
		this.compassHelper.onClick(() => this.toggleCompass());
		this.compassHelper.toggleClass('toggle-on', true)

		options.add( this.gridHelper );
		options.add(this.cameraHelper)
		options.add(this.compassHelper)

		eventBus.on(EventEnums.CHANGE_CAMERA_UI, (value) => this.setCamera(value))

	}

	public setCamera(value) {
		this.states.cameraHelper = value;
		this.cameraHelper.toggleClass('toggle-on', value)
	}

	public toggleCompass() {
		this.states.compassHelper = !this.states.compassHelper;
		eventBus.emit(EventEnums.TOGGLE_COMPASS, this.states.compassHelper);
		this.compassHelper.toggleClass( 'toggle-on', this.states.compassHelper );
	}

	public toggleGrid() {
		this.states.gridHelper = ! this.states.gridHelper;
		eventBus.emit(EventEnums.GRID_VISIBILITY_CHANGED, this.states.gridHelper)
		this.gridHelper.toggleClass( 'toggle-on', this.states.gridHelper );
	}

	public toggleCamera() {
		this.states.cameraHelper = !this.states.cameraHelper;
		eventBus.emit(EventEnums.CAMERA_CHANGED, this.states.cameraHelper)
		this.cameraHelper.toggleClass( 'toggle-on', this.states.cameraHelper );
	}




	// // Camera Helpers

	// option = new UIRow().addClass( 'option' ).addClass( 'toggle' ).setTextContent( strings.getKey( 'menubar/view/cameraHelpers' ) ).onClick( function () {

	// 	states.cameraHelpers = ! states.cameraHelpers;

	// 	this.toggleClass( 'toggle-on', states.cameraHelpers );

	// 	// signals.showHelpersChanged.dispatch( states );

	// } ).toggleClass( 'toggle-on', states.cameraHelpers );

	// options.add( option );

	// // Light Helpers

	// option = new UIRow().addClass( 'option' ).addClass( 'toggle' ).setTextContent( strings.getKey( 'menubar/view/lightHelpers' ) ).onClick( function () {

	// 	states.lightHelpers = ! states.lightHelpers;

	// 	this.toggleClass( 'toggle-on', states.lightHelpers );

	// 	// signals.showHelpersChanged.dispatch( states );

	// } ).toggleClass( 'toggle-on', states.lightHelpers );

	// options.add( option );

	// // Skeleton Helpers

	// option = new UIRow().addClass( 'option' ).addClass( 'toggle' ).setTextContent( strings.getKey( 'menubar/view/skeletonHelpers' ) ).onClick( function () {

	// 	states.skeletonHelpers = ! states.skeletonHelpers;

	// 	this.toggleClass( 'toggle-on', states.skeletonHelpers );

	// 	// signals.showHelpersChanged.dispatch( states );

	// } ).toggleClass( 'toggle-on', states.skeletonHelpers );

	// options.add( option );

	// // new helpers are visible by default, the global visibility state
	// // of helpers is managed in this component. every time a helper is added,
	// // we request a viewport updated by firing the showHelpersChanged signal.

	// // signals.helperAdded.add( function () {

	// // 	signals.showHelpersChanged.dispatch( states );

	// // } );

	// //

	// options.add( new UIHorizontalRule() );

	// // Fullscreen

	// option = new UIRow();
	// option.setClass( 'option' );
	// option.setTextContent( strings.getKey( 'menubar/view/fullscreen' ) );
	// option.onClick( function () {

	// 	if ( document.fullscreenElement === null ) {

	// 		document.documentElement.requestFullscreen();

	// 	} else if ( document.exitFullscreen ) {

	// 		document.exitFullscreen();

	// 	}

	// 	// Safari

	// 	if ( document.webkitFullscreenElement === null ) {

	// 		document.documentElement.webkitRequestFullscreen();

	// 	} else if ( document.webkitExitFullscreen ) {

	// 		document.webkitExitFullscreen();

	// 	}

	// } );
	// options.add( option );

	// // XR (Work in progress)

	// if ( 'xr' in navigator ) {

	// 	if ( 'offerSession' in navigator.xr ) {

	// 		// signals.offerXR.dispatch( 'immersive-ar' );

	// 	} else {

	// 		navigator.xr.isSessionSupported( 'immersive-ar' )
	// 			.then( function ( supported ) {

	// 				if ( supported ) {

	// 					const option = new UIRow();
	// 					option.setClass( 'option' );
	// 					option.setTextContent( 'AR' );
	// 					option.onClick( function () {

	// 						// signals.enterXR.dispatch( 'immersive-ar' );

	// 					} );
	// 					options.add( option );

	// 				} else {

	// 					navigator.xr.isSessionSupported( 'immersive-vr' )
	// 						.then( function ( supported ) {

	// 							if ( supported ) {

	// 								const option = new UIRow();
	// 								option.setClass( 'option' );
	// 								option.setTextContent( 'VR' );
	// 								option.onClick( function () {

	// 									// signals.enterXR.dispatch( 'immersive-vr' );

	// 								} );
	// 								options.add( option );

	// 							}

	// 						} );

	// 				}

	// 			} );

	// 	}

	// }

	//

	// return container;

	// TODO: move this up a level
    public handleKeyDown(e) {
        if (e.shiftKey) {
            switch (e.code) {
                case 'KeyC':
                    this.toggleCamera()
                    eventBus.emit(EventEnums.CAMERA_CHANGED, this.states.cameraHelper);
                    break;
                case 'KeyG':
					this.toggleGrid()
                    eventBus.emit(EventEnums.GRID_VISIBILITY_CHANGED, this.states.gridHelper);
                    break;
            }

        }
    }

}

export { MenubarView };
