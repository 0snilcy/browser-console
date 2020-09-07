import vscode from 'vscode';
import Log from './Log';
import logger from './Logger';
import path from 'path';
interface PathLog {
	[key: string]: PathLog | Log[];
}

type TreeItem = LogTreeItem | PathTreeItem;

type MaybeLog = TreeItem | undefined;

export default class Sidebar implements vscode.TreeDataProvider<LogTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<MaybeLog> = new vscode.EventEmitter<
		MaybeLog
	>();
	readonly onDidChangeTreeData: vscode.Event<MaybeLog> = this._onDidChangeTreeData.event;
	private sortedLogs: PathLog = {};

	constructor(private workspaceRoot?: string) {}

	getTreeItem(element: LogTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(parentElement: PathTreeItem): Thenable<TreeItem[]> {
		if (parentElement) {
			const { value } = parentElement;

			if (Array.isArray(value)) {
				return Promise.resolve(
					value
						.sort((a: Log, b: Log) => +a.originalPosition.line - +b.originalPosition.line)
						.map(
							(log: Log) =>
								new LogTreeItem(log, vscode.TreeItemCollapsibleState.None, {
									command: 'browser-console.showLine',
									title: '',
									arguments: [log.originalPosition],
								})
						)
				);
			}

			return Promise.resolve(
				Object.keys(value).map((path) => new PathTreeItem(path, value[path]))
			);
		} else {
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
			.TreeItemCollapsibleState.Collapsed
	) {
		super(label, collapsibleState);
	}
}

class LogTreeItem extends vscode.TreeItem {
	constructor(
		public readonly log: Log,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode
			.TreeItemCollapsibleState.Collapsed,
		public readonly command: vscode.Command
	) {
		super(`${log.originalPosition.line}: ${log.preview}`, collapsibleState);

		console.log(path.resolve(__dirname, `../../assets/img/log-icons/${log.type}.svg`));

		this.iconPath = path.resolve(__dirname, `../../assets/img/log-icons/${log.type}.svg`);
	}
}
