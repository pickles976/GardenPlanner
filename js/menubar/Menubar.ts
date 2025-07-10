import { UIPanel } from '../libs/ui.js';

import { MenubarAdd } from './Menubar.Add.js';
import { MenubarEdit } from './Menubar.Edit.js';
import { MenubarFile } from './Menubar.File.js';
import { MenubarView } from './Menubar.View.js';
import { MenubarHelp } from './Menubar.Help.js';
import { MenubarStatus } from './Menubar.Status.js';
import { Editor } from '../Editor.js';

class Menubar {

	editor: Editor;
	menuBar: MenubarView;

	constructor (editor: Editor) {
		this.editor = editor;
		this.container = new UIPanel();
		this.container.setId( 'menubar' );

		this.menuBar = new MenubarView( editor );

		this.container.add( new MenubarFile( editor ) );
		this.container.add( new MenubarEdit( editor ) );
		this.container.add( new MenubarAdd( editor ) );
		this.container.add( this.menuBar.container );
		
		// this.container.add( new MenubarHelp( editor ) );

		this.container.add( new MenubarStatus( editor ) );

	}

	public handleKeyDown(event) {
		this.menuBar.handleKeyDown(event)
	}



}

export { Menubar };
