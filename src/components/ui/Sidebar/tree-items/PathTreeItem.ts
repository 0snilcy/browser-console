import vscode from 'vscode';
import settings from '../../../Settings';

class PathTreeItem extends vscode.TreeItem {
	constructor(
		public readonly id: string,
		public readonly label: string,
		public readonly value?: any
	) {
		super(label, vscode.TreeItemCollapsibleState.Expanded);
		this.tooltip = (settings.editor.debug ? new.target.name : '') + this.id;
	}
}

export default PathTreeItem;
