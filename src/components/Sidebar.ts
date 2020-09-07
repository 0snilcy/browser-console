import vscode from 'vscode';
import Log, { Preview } from './Log';
import logger from './Logger';
import path from 'path';
interface PathLog {
	[key: string]: PathLog | Log[];
}

type MaybeLog = vscode.TreeItem | undefined;

export default class Sidebar implements vscode.TreeDataProvider<vscode.TreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<MaybeLog> = new vscode.EventEmitter<
		MaybeLog
	>();
	readonly onDidChangeTreeData: vscode.Event<MaybeLog> = this._onDidChangeTreeData.event;
	private sortedLogs: PathLog = {};

	constructor(private workspaceRoot?: string) {}

	getTreeItem(element: LogTreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(parentElement: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
		if (parentElement) {
			if (parentElement instanceof ArgTreeItem || parentElement instanceof PropTreeItem) {
				const id = parentElement.preview.objectId;
				if (id) {
					const response = await parentElement.log.getPropsByObjectId(id);
					if (response) {
						const { result } = response;
						return Promise.resolve(
							result.map((propertyDescriptor) => {
								const { value, name, enumerable } = propertyDescriptor;
								if (value && name) {
									const preview = parentElement.log.getPreview(value);
									return new PropTreeItem(
										parentElement.log,
										name,
										preview,
										preview.objectId
											? enumerable
												? vscode.TreeItemCollapsibleState.Expanded
												: vscode.TreeItemCollapsibleState.Collapsed
											: vscode.TreeItemCollapsibleState.None
									);
								}
							}) as PropTreeItem[]
						);
					}
				}

				return Promise.resolve([]);
			}

			if (parentElement instanceof LogTreeItem) {
				const preview = parentElement.log.preview;
				return Promise.resolve(
					preview.map(
						(arg) =>
							new ArgTreeItem(
								parentElement.log,
								arg,
								arg.objectId
									? vscode.TreeItemCollapsibleState.Expanded
									: vscode.TreeItemCollapsibleState.None
								// {
								// 	command: 'browser-console.showLine',
								// 	title: '',
								// 	arguments: [parentElement.log.originalPosition],
								// }
							)
					)
				);
			}

			if (parentElement instanceof PathTreeItem) {
				const { value } = parentElement;

				if (parentElement)
					if (Array.isArray(value)) {
						// logs
						return Promise.resolve(
							value.map((log: Log) => {
								const first = log.args[0];
								const preview = log.getPreview(first);
								return log.args.length > 1
									? new LogTreeItem(log, vscode.TreeItemCollapsibleState.Expanded)
									: new ArgTreeItem(
											log,
											preview,
											preview.objectId
												? vscode.TreeItemCollapsibleState.Expanded
												: vscode.TreeItemCollapsibleState.None
									  );
							})
						);
					}

				// include dirs
				return Promise.resolve(
					Object.keys(value).map((path) => new PathTreeItem(path, value[path]))
				);
			}
		} else {
			// root dirs
			return Promise.resolve(
				Object.keys(this.sortedLogs).map((el) => new PathTreeItem(el, this.sortedLogs[el]))
			);
		}
	}

	add(log: Log) {
		const pathArr = log.originalPosition.source.split('/').filter((el) => el);
		pathArr.reduce((obj: PathLog, path, id, arr) => {
			const existLogs = obj[path];
			if (existLogs) {
				if (Array.isArray(existLogs)) {
					existLogs.push(log);
				}

				return existLogs;
			}

			obj[path] = arr[id + 1] ? {} : [log];
			return obj[path];
		}, this.sortedLogs);

		this.refresh();
	}

	reset() {
		this.sortedLogs = {};
		this.refresh();
	}

	refresh() {
		this._onDidChangeTreeData.fire(undefined);
	}
}

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

class LogTreeItem extends vscode.TreeItem {
	constructor(
		public readonly log: Log,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode
			.TreeItemCollapsibleState.Expanded // public readonly command?: vscode.Command
	) {
		super(log.previewTitle, collapsibleState);
		this.iconPath = path.resolve(__dirname, `../../assets/img/log-icons/${log.type}.svg`);
	}
}

class ArgTreeItem extends vscode.TreeItem {
	constructor(
		public readonly log: Log,
		public readonly preview: Preview,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode
			.TreeItemCollapsibleState.None,
		public readonly command?: vscode.Command
	) {
		super(preview.title, collapsibleState);
		this.iconPath = path.resolve(__dirname, `../../assets/img/log-icons/${log.type}.svg`);
	}
}

class PropTreeItem extends vscode.TreeItem {
	constructor(
		public readonly log: Log,
		public readonly key: string,
		public readonly preview: Preview,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode
			.TreeItemCollapsibleState.None,
		public readonly command?: vscode.Command
	) {
		super(key + ':', collapsibleState);

		// this.iconPath = path.resolve(__dirname, `../../assets/img/log-icons/${log.type}.svg`);
	}

	get description() {
		return this.preview.title;
	}
}
