import { EventEmitter } from 'events';
import vscode, { workspace } from 'vscode';
import config from '../config';
import { Emitter } from '../interfaces';

export interface IEditorSettings {
	port?: number;
	debug?: boolean;
	pathToChrome?: string;
	textColor?: string;
	showEnumerable?: boolean;
}

interface ISettingsEvents {
	update: IEditorSettings;
}

class Settigns extends Emitter<ISettingsEvents> {
	private _editor: IEditorSettings = {};
	private _context: vscode.ExtensionContext;

	constructor() {
		super();

		const settings = workspace.getConfiguration(config.appName);

		this.update({
			port: settings.get('port'),
			debug: settings.get('debug'),
			pathToChrome: settings.get('pathToChrome'),
			textColor: settings.get('textColor'),
			showEnumerable: settings.get('showEnumerable'),
		});
	}

	get editor() {
		return this._editor;
	}

	get context() {
		return this._context;
	}

	update(settings: IEditorSettings) {
		this._editor = {
			...this.editor,
			...settings,
		};
		this.emit('update', this._editor);
	}

	setContext(context: vscode.ExtensionContext) {
		this._context = context;
	}
}

export default new Settigns();
