import vscode from 'vscode';
import logger from './components/Logger';
import Extension from './components/Extension';
import StatusBar from './components/StatusBar';
import Sidebar from './components/Sidebar';

let ext: Extension | undefined;

export async function activate(context: vscode.ExtensionContext) {
	const statusBar = new StatusBar();
	const sidebar = new Sidebar(vscode.workspace.rootPath);

	try {
		logger.init(context);
		ext = new Extension(context, statusBar, sidebar);

		context.subscriptions.push(
			vscode.window.registerTreeDataProvider('browser-console-view', sidebar),
			statusBar.bar,
			vscode.commands.registerCommand('browser-console.commands', ext.showCommands),
			vscode.commands.registerCommand('browser-console.start', ext.Command.Start),
			vscode.commands.registerCommand('browser-console.stop', ext.Command.Stop),
			vscode.commands.registerCommand('browser-console.restart', ext.Command.Restart),
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
