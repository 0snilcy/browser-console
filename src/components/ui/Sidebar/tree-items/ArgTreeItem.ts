import vscode from 'vscode';
import path from 'path';
import Log, { IPreview } from '../../../Log';

class ArgTreeItem extends vscode.TreeItem {
	contextValue = 'showLine';

	constructor(public readonly log: Log, public readonly preview: IPreview) {
		super(preview.title, vscode.TreeItemCollapsibleState.None);
		this.collapsibleState = preview.objectId
			? vscode.TreeItemCollapsibleState.Collapsed
			: vscode.TreeItemCollapsibleState.None;

		this.iconPath = path.resolve(
			__dirname,
			`../../../../../assets/img/log-icons/${log.type}.svg`
		);

		this.tooltip = `${this.log.originalPosition.source}:${this.log.originalPosition.line}`;
	}
}

export default ArgTreeItem;
