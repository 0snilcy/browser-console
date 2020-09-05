import vscode from 'vscode';
import logger from './components/Logger';
import Extension from './components/Extension';
import StatusBar from './components/StatusBar';

let ext: Extension | undefined;

export async function activate(context: vscode.ExtensionContext) {
	const statusBar = new StatusBar();

	try {
		logger.init(context);
		ext = new Extension(context, statusBar);

		context.subscriptions.push(
			statusBar.bar,
			vscode.commands.registerCommand('browser-console.commands', ext.showCommands),
			vscode.commands.registerCommand('browser-console.start', ext.Command.Start),
			vscode.commands.registerCommand('browser-console.stop', ext.Command.Stop),
			vscode.commands.registerCommand('browser-console.restart', ext.Command.Restart)
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
