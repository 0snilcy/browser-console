import vscode from 'vscode';
import path from 'path';
import Log from '../../../Log';

class LogTreeItem extends vscode.TreeItem {
	constructor(
		public readonly log: Log,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode
			.TreeItemCollapsibleState.Expanded // public readonly command?: vscode.Command
	) {
		super(log.previewTitle, collapsibleState);
		this.iconPath = path.resolve(
			__dirname,
			`../../../../../assets/img/log-icons/${log.type}.svg`
		);
	}
}

export default LogTreeItem;
