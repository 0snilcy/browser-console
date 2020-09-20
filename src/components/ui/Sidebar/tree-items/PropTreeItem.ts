import vscode from 'vscode';
import Log, { IPreview } from '../../../Log';

class PropTreeItem extends vscode.TreeItem {
	constructor(
		public readonly log: Log,
		public readonly key: string,
		public readonly preview: IPreview,
		public readonly command?: vscode.Command,
		public readonly collapsibleState?: vscode.TreeItemCollapsibleState
	) {
		super(key + ':', collapsibleState);

		this.collapsibleState = preview.objectId
			? vscode.TreeItemCollapsibleState.Collapsed
			: vscode.TreeItemCollapsibleState.None;

		// this.iconPath = path.resolve(__dirname, `../../assets/img/log-icons/${log.type}.svg`);
	}

	get description() {
		return this.preview.title;
	}
}

export default PropTreeItem;
