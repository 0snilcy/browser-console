import vscode from 'vscode';
import Log from '../../Log';

import ArgTreeItem from './tree-items/ArgTreeItem';
import LogTreeItem from './tree-items/LogTreeItem';
import PathTreeItem from './tree-items/PathTreeItem';
import PropTreeItem from './tree-items/PropTreeItem';
// import logger from '../Logger';

interface IPathLog {
	[key: string]: IPathLog | Log[];
}

type MaybeLog = vscode.TreeItem | undefined;

class Sidebar implements vscode.TreeDataProvider<vscode.TreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<MaybeLog> = new vscode.EventEmitter<
		MaybeLog
	>();
	readonly onDidChangeTreeData: vscode.Event<MaybeLog> = this._onDidChangeTreeData.event;
	private sortedLogs: IPathLog = {};

	getTreeItem(element: LogTreeItem): vscode.TreeItem {
		// console.log('getTreeItem');
		return element;
	}

	async getChildren(parentElement: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
		console.log('getChildren', parentElement?.label);
		if (parentElement) {
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
									? new LogTreeItem(log)
									: new ArgTreeItem(log, preview);
							})
						);
					}

				// include dirs
				return Promise.resolve(
					Object.keys(value).map((path) => new PathTreeItem(path, value[path]))
				);
			}

			if (parentElement instanceof LogTreeItem) {
				const preview = parentElement.log.preview;
				return Promise.resolve(
					preview.map(
						(arg) =>
							new ArgTreeItem(
								parentElement.log,
								arg
								// {
								// 	command: 'browser-console.showLine',
								// 	title: '',
								// 	arguments: [parentElement.log.originalPosition],
								// }
							)
					)
				);
			}

			if (parentElement instanceof ArgTreeItem || parentElement instanceof PropTreeItem) {
				const id = parentElement.preview.objectId;
				if (id) {
					try {
						const response = await parentElement.log.getProps(parentElement.preview);
						if (response) {
							return Promise.resolve(
								response
									.sort()
									.map(
										({ name, preview }) =>
											new PropTreeItem(parentElement.log, name, preview)
									)
							);
						}
					} catch (err) {
						console.error(err);
					}
				}
			}

			return Promise.resolve([]);
		} else {
			// root dirs
			return Promise.resolve(
				Object.keys(this.sortedLogs).map((el) => new PathTreeItem(el, this.sortedLogs[el]))
			);
		}
	}

	add = (log: Log) => {
		const pathArr = log.originalPosition.source.split('/').filter((el) => el);

		pathArr.reduce((obj, path, id, arr) => {
			const existLogs = obj[path];
			const isLast = !arr[id + 1];

			if (existLogs) {
				if (Array.isArray(existLogs)) {
					existLogs.push(log);
					return obj;
				}

				return existLogs;
			}

			if (!isLast) {
				const nextPathObj = {};
				obj[path] = nextPathObj;
				return nextPathObj;
			}

			obj[path] = [log];
			return obj;
		}, this.sortedLogs);

		this.refresh();
	};

	reset = () => {
		console.log('sidebar reset');
		this.sortedLogs = {};
		this.refresh();
	};

	refresh = () => {
		console.log('sidebar refresh');
		this._onDidChangeTreeData.fire(undefined);
	};
}

export default Sidebar;
