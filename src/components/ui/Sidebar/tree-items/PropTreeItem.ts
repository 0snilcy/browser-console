import vscode from 'vscode';
import Log, { IPreview } from '../../../Log';

class PropTreeItem extends vscode.TreeItem {
	constructor(
		public readonly log: Log,
		public readonly key: string,
		public readonly preview: IPreview,
		public readonly tooltip: string,
		public readonly command?: vscode.Command
	) {
		super(key + ':');

		this.collapsibleState = preview.objectId
			? vscode.TreeItemCollapsibleState.Collapsed
			: vscode.TreeItemCollapsibleState.None;

		this.id = key + this.preview.title;
		this.description = this.preview.title;
	}
}

export default PropTreeItem;
