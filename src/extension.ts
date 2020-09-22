import vscode from 'vscode';
import logger from './components/Logger';
import extension from './components/Extension';
import statusBar from './components/ui/StatusBar';
import settings from './components/Settings';
import ArgTreeItem from './components/ui/sidebar/tree-items/ArgTreeItem';
import LogTreeItem from './components/ui/sidebar/tree-items/LogTreeItem';

const toggleEnumerableCb = (state: boolean) => {
	settings.update({
		showEnumerable: state,
	});

	vscode.commands.executeCommand('setContext', 'browser-console.showEnumerable', state);
};

export async function activate(context: vscode.ExtensionContext) {
	try {
		extension.init();
		logger.init(context);

		context.subscriptions.push(
			statusBar.bar,
			vscode.commands.registerCommand('browser-console.commands', extension.showCommands),
			vscode.commands.registerCommand('browser-console.start', extension.startExtension),
			vscode.commands.registerCommand('browser-console.stop', extension.stopExtensin),
			vscode.commands.registerCommand(
				'browser-console.restart',
				extension.restartExtension
			),
			vscode.commands.registerCommand(
				'browser-console.showLine',
				(treeItem: ArgTreeItem | LogTreeItem) =>
					extension.showLine(treeItem.log.originalPosition)
			),
			vscode.commands.registerCommand('browser-console.hideEnumerable', () =>
				toggleEnumerableCb(false)
			),
			vscode.commands.registerCommand('browser-console.showEnumerable', () =>
				toggleEnumerableCb(true)
			)
		);
	} catch (err) {
		extension?.emit('error', err);
	}
}

export async function deactivate() {
	await extension.stopExtensin();
}
