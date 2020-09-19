import vscode, { window } from 'vscode';
import config from '../../config';

export default class StatusBar {
	bar: vscode.StatusBarItem;

	constructor() {
		this.bar = window.createStatusBarItem(vscode.StatusBarAlignment.Right, 10000);
		this.bar.text = `$(browser) ${config.appNameU}`;
		this.bar.show();
		this.bar.command = 'browser-console.commands';
	}

	inActive() {
		this.bar.text = `$(play) ${config.appNameU}`;
	}

	inProgress() {
		this.bar.text = `$(ellipsis) ${config.appNameU}`;
	}

	inStopped() {
		this.bar.text = `$(browser) ${config.appNameU}`;
	}
}
