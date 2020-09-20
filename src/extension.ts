import vscode from 'vscode';
import logger from './components/Logger';
import Extension from './components/Extension';
import StatusBar from './components/ui/StatusBar';
import settings from './components/Settings';
import ArgTreeItem from './components/ui/sidebar/tree-items/ArgTreeItem';
import LogTreeItem from './components/ui/sidebar/tree-items/LogTreeItem';

let ext: Extension | undefined;

const toggleEnumerableCb = (state: boolean) => {
	settings.update({
		showEnumerable: state,
	});

	vscode.commands.executeCommand('setContext', 'browser-console.showEnumerable', state);
};

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
			vscode.commands.registerCommand(
				'browser-console.showLine',
				(treeItem: ArgTreeItem | LogTreeItem) =>
					ext?.showLine(treeItem.log.originalPosition)
			),
			vscode.commands.registerCommand('browser-console.hideEnumerable', () => {
				toggleEnumerableCb(false);
			}),
			vscode.commands.registerCommand('browser-console.showEnumerable', () => {
				toggleEnumerableCb(true);
			})
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
