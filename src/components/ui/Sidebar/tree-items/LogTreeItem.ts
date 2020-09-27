import vscode from 'vscode';
import path from 'path';
import Log from '../../../Log';
import settings from '../../../Settings';

class LogTreeItem extends vscode.TreeItem {
	contextValue = 'showLine';

	constructor(public readonly id: string, public readonly log: Log) {
		super(log.previewTitle, vscode.TreeItemCollapsibleState.Expanded);
		this.iconPath = path.resolve(
			__dirname,
			`../../../../../assets/img/log-icons/${log.type}.svg`
		);
		this.tooltip = (settings.editor.debug ? `${new.target.name} > ` : '') + this.id;
	}
}

export default LogTreeItem;
