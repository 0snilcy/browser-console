import vscode from 'vscode';
import logger from './components/Logger';
import Extension from './components/Extension';
import StatusBar from './components/StatusBar';

let ext: Extension | undefined;

export async function activate(context: vscode.ExtensionContext) {
	logger.init(context);
	ext = new Extension(context);
	const statusBar = new StatusBar();

	setTimeout(async () => {
		const value = await vscode.window.showQuickPick(['test', 'go']);
		console.log(value);
	}, 2000);

	context.subscriptions.push(
		vscode.commands.registerCommand('browser-console.start', ext.onStartExtension),
		vscode.commands.registerCommand('browser-console.stop', ext.onStopExtensin),
		vscode.commands.registerCommand('browser-console.restart', async () => {
			if (ext) {
				await ext.onStopExtensin();
				await ext.onStartExtension();
			}
		})
	);
}

export async function deactivate() {
	if (ext) {
		await ext.onStopExtensin();
	}
}
