import vscode from 'vscode';
import path from 'path';
import Log, { IPreview } from '../../../Log';

class ArgTreeItem extends vscode.TreeItem {
	constructor(
		public readonly log: Log,
		public readonly preview: IPreview,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode
			.TreeItemCollapsibleState.None,
		public readonly command?: vscode.Command
	) {
		super(preview.title, collapsibleState);
		this.collapsibleState = preview.objectId
			? vscode.TreeItemCollapsibleState.Collapsed
			: vscode.TreeItemCollapsibleState.None;

		this.iconPath = path.resolve(
			__dirname,
			`../../../../../assets/img/log-icons/${log.type}.svg`
		);
	}

	get tooltip() {
		return `${this.log.originalPosition.source}:${this.log.originalPosition.line}`;
	}
}

export default ArgTreeItem;
