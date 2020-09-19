import vscode, { workspace, window } from 'vscode';

import Log from './Log';
import { ISettings } from './Extension';
import Sidebar from './ui/Sidebar';
import Decorator from './ui/Decorator';
import { getPathOfRoot } from '../utils';

export default class LogController {
	private logs: Log[] = [];
	private sidebar: Sidebar;
	private decorator: Decorator;
	private listeners: vscode.Disposable[] = [];

	constructor(settings: ISettings, context: vscode.ExtensionContext) {
		this.sidebar = new Sidebar();
		this.listeners.push(
			vscode.window.registerTreeDataProvider('browser-console-view', this.sidebar)
		);

		this.decorator = new Decorator(settings);
		workspace.onDidChangeTextDocument(
			() => this.decorator.onChange(this.logs),
			null,
			this.listeners
		);

		window.onDidChangeActiveTextEditor(
			() => this.decorator.onChange(this.logs),
			null,
			this.listeners
		);

		workspace.onWillSaveTextDocument(this.reset, null, this.listeners);
	}

	add = (log: Log) => {
		this.logs.push(log);
		this.sidebar.add(log);
		this.decorator.onChange([log]);
	};

	reset = () => {
		this.logs = [];
		this.sidebar.reset();
		this.decorator.reset();
	};

	removeListeners() {
		this.listeners.forEach((listener) => listener.dispose());
	}
}
