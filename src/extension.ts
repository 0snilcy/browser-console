import vscode, { window } from 'vscode';
import logger from './components/Logger';
import settings from './components/Settings';
import extension from './components/Extension';
import statusBar from './components/ui/StatusBar';
import ArgTreeItem from './components/ui/Sidebar/tree-items/ArgTreeItem';
import LogTreeItem from './components/ui/Sidebar/tree-items/LogTreeItem';
import sidebar from './components/ui/Sidebar/Sidebar';

export async function activate(context: vscode.ExtensionContext) {
  try {
    logger.init(context);
    extension.init();

    context.subscriptions.push(
      statusBar.bar,
      window.registerTreeDataProvider('browser-console-view', sidebar),

      vscode.commands.registerCommand(
        'browser-console.commands',
        extension.showCommands
      ),
      vscode.commands.registerCommand(
        'browser-console.start',
        extension.startExtension
      ),
      vscode.commands.registerCommand(
        'browser-console.stop',
        extension.stopExtensin
      ),
      vscode.commands.registerCommand(
        'browser-console.reload',
        extension.reload
      ),
      vscode.commands.registerCommand('browser-console.toggleViewMode', () => {
        settings.update({ treeViewMode: !settings.editor.treeViewMode });
      }),

      vscode.commands.registerCommand(
        'browser-console.restart',
        extension.restartExtension
      ),
      vscode.commands.registerCommand(
        'browser-console.showLine',
        (treeItem: ArgTreeItem | LogTreeItem) =>
          extension.showLine(treeItem.log.originalPosition)
      ),
      vscode.commands.registerCommand(
        'browser-console.toggleEnumerable',
        () => {
          settings.update({ showEnumerable: !settings.editor.showEnumerable });
        }
      )
    );
  } catch (err) {
    extension?.emit('error', err);
  }
}

export async function deactivate() {
  await extension.stopExtensin();
}
