import vscode from 'vscode';
import path from 'path';
import Log, { IPreview } from '../../../Log';
import settings from '../../../Settings';

class ArgTreeItem extends vscode.TreeItem {
	contextValue = 'showLine';

	constructor(
		public readonly id: string,
		public readonly log: Log,
		public readonly preview: IPreview
	) {
		super(preview.title, vscode.TreeItemCollapsibleState.None);
		this.collapsibleState = preview.objectId
			? vscode.TreeItemCollapsibleState.Collapsed
			: vscode.TreeItemCollapsibleState.None;

		this.iconPath = path.resolve(
			__dirname,
			`../../../../../assets/img/log-icons/${log.type}.svg`
		);

		this.tooltip = (settings.editor.debug ? new.target.name : '') + this.id;
	}
}

export default ArgTreeItem;
