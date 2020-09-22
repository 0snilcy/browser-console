import vscode, { window } from 'vscode';
import config from '../../config';
import extension from '../Extension';

class StatusBar {
	bar: vscode.StatusBarItem;

	constructor() {
		this.bar = window.createStatusBarItem(vscode.StatusBarAlignment.Right, 10000);
		this.bar.text = `$(browser) ${config.appNameU}`;
		this.bar.show();
		this.bar.command = 'browser-console.commands';

		extension.on('start', () => {
			this.bar.text = `$(play) ${config.appNameU}`;
		});

		extension.on(['stop', 'error'], () => {
			this.bar.text = `$(browser) ${config.appNameU}`;
		});

		extension.on('progressStart', () => {
			this.bar.text = `$(ellipsis) ${config.appNameU}`;
		});
	}
}

export default new StatusBar();
