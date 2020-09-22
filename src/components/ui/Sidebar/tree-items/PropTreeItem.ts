import vscode from 'vscode';
import Log, { IPreview } from '../../../Log';

class PropTreeItem extends vscode.TreeItem {
	constructor(
		public readonly log: Log,
		public readonly key: string,
		public readonly preview: IPreview,
		public readonly hoverPreview: string,
		public readonly command?: vscode.Command,
		public readonly collapsibleState?: vscode.TreeItemCollapsibleState
	) {
		super(key + ':', collapsibleState);

		this.collapsibleState = preview.objectId
			? vscode.TreeItemCollapsibleState.Collapsed
			: vscode.TreeItemCollapsibleState.None;

		// this.iconPath = path.resolve(__dirname, `../../assets/img/log-icons/${log.type}.svg`);

		this.description = this.preview.title;
		this.tooltip = this.hoverPreview;
	}
}

export default PropTreeItem;
