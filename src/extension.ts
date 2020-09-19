import vscode from 'vscode';
import logger from './components/Logger';
import Extension from './components/Extension';
import StatusBar from './components/ui/StatusBar';
import Sidebar from './components/ui/Sidebar';

let ext: Extension | undefined;

export async function activate(context: vscode.ExtensionContext) {
	const statusBar = new StatusBar();

	try {
		logger.init(context);
		ext = new Extension(context, statusBar);

		context.subscriptions.push(
			statusBar.bar,
			vscode.commands.registerCommand('browser-console.commands', ext.showCommands),
			vscode.commands.registerCommand('browser-console.start', ext.startExtension),
			vscode.commands.registerCommand('browser-console.stop', ext.stopExtensin),
			vscode.commands.registerCommand('browser-console.restart', ext.restartExtension),
			vscode.commands.registerCommand('browser-console.showLine', ext.showLine)
		);
	} catch (err) {
		statusBar.inStopped();
		console.error(err);
		logger.log(err);
	}
}

export async function deactivate() {
	if (ext) {
		await ext.stopExtensin();
	}
}
