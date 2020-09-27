import vscode from 'vscode';
import Log, { IPreview } from '../../../Log';
import settings from '../../../Settings';

class PropTreeItem extends vscode.TreeItem {
	constructor(
		public readonly log: Log,
		public readonly key: string,
		public readonly preview: IPreview,
		public readonly tooltip: string,
		public readonly id: string
	) {
		super(key + ':');

		this.collapsibleState = preview.objectId
			? vscode.TreeItemCollapsibleState.Collapsed
			: vscode.TreeItemCollapsibleState.None;

		this.description = this.preview.title;
		this.tooltip = settings.editor.debug ? `${new.target.name} > ${this.id}` : this.tooltip;
	}
}

export default PropTreeItem;
