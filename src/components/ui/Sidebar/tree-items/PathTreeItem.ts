import vscode from 'vscode';

class PathTreeItem extends vscode.TreeItem {
	constructor(public readonly label: string, public readonly value?: any) {
		super(label, vscode.TreeItemCollapsibleState.Expanded);
	}
}

export default PathTreeItem;
