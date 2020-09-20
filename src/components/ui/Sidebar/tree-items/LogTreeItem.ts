import vscode from 'vscode';
import path from 'path';
import Log from '../../../Log';

class LogTreeItem extends vscode.TreeItem {
	contextValue = 'showLine';

	constructor(public readonly log: Log) {
		super(log.previewTitle, vscode.TreeItemCollapsibleState.Expanded);
		this.iconPath = path.resolve(
			__dirname,
			`../../../../../assets/img/log-icons/${log.type}.svg`
		);
	}
}

export default LogTreeItem;
