import vscode from 'vscode';

class PathTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly value?: any,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode
			.TreeItemCollapsibleState.Expanded
	) {
		super(label, collapsibleState);
	}
}

export default PathTreeItem;
