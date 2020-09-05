import vscode, { window } from 'vscode';
import config from '../config';

export default class StatusBar {
	private bar: vscode.StatusBarItem;

	constructor() {
		this.bar = window.createStatusBarItem(vscode.StatusBarAlignment.Right);
		this.bar.text = `$(play) ${config.appNameU}`;
		this.bar.show();
	}
}
