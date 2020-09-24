import vscode from 'vscode';
import Log, { IDescriptor } from '../../Log';

import ArgTreeItem from './tree-items/ArgTreeItem';
import LogTreeItem from './tree-items/LogTreeItem';
import PathTreeItem from './tree-items/PathTreeItem';
import PropTreeItem from './tree-items/PropTreeItem';
import settings from '../../Settings';
import { Emitter } from '../../../interfaces';
// import logger from '../Logger';

interface IPathLog {
	[key: string]: IPathLog | Log[];
}

type MaybeLog = vscode.TreeItem | undefined;

interface ISidebarEvents {
	load: Log[];
}

class Sidebar
	extends Emitter<ISidebarEvents>
	implements vscode.TreeDataProvider<vscode.TreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<MaybeLog> = new vscode.EventEmitter<
		MaybeLog
	>();
	readonly onDidChangeTreeData: vscode.Event<MaybeLog> = this._onDidChangeTreeData.event;
	private sortedLogs: IPathLog = {};
	private isLoaded = false;

	constructor() {
		super();
		settings.on('update', this.refresh);
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	// TODO vscode need Promise, but TreeDataProvider Thenable (linter error)
	async getChildren(parentElement: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
		if (parentElement) {
			if (parentElement instanceof PathTreeItem) {
				const { value } = parentElement;

				if (parentElement)
					if (Array.isArray(value)) {
						// logs
						return Promise.resolve(
							value
								.map((log: Log) => {
									const first = log.args[0];
									const preview = log.getPreview(first);

									const { line, column, source } = log.originalPosition;
									return log.args.length > 1
										? new LogTreeItem(log)
										: new ArgTreeItem(`${source}:${line}:${column}[0]`, log, preview);
								})
								.sort(
									({ log: logA }, { log: logB }) =>
										logA.originalPosition.line - logB.originalPosition.line
								)
						);
					}

				// include dirs
				return Promise.resolve(
					Object.keys(value).map(
						(path) => new PathTreeItem(`${parentElement.id}/${path}`, path, value[path])
					)
				);
			}

			if (parentElement instanceof LogTreeItem) {
				const preview = parentElement.log.preview;
				return Promise.resolve(
					preview.map(
						(arg, id) =>
							new ArgTreeItem(`${parentElement.id}[${id}]`, parentElement.log, arg)
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
									.filter(
										({ descriptors }) =>
											settings.editor.showEnumerable || descriptors.enumerable
									)
									.sort((a, b) => {
										if (a.name.startsWith('[[')) return 1;
										if (b.name.startsWith('[[')) return -1;
										if (a.name.startsWith('__')) return 1;
										if (b.name.startsWith('__')) return -1;
										if (a.name.startsWith('Symbol(')) return 1;
										if (b.name.startsWith('Symbol(')) return -1;
										return a.name > b.name ? 1 : -1;
									})
									.map(
										({ name, preview, descriptors }) =>
											new PropTreeItem(
												parentElement.log,
												name,
												preview,
												Object.keys(descriptors)
													.map((key) => `${key}: ${descriptors[key as keyof IDescriptor]}`)
													.join('\n'),
												`${parentElement.id}['${name}']`
											)
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
			if (this.isLoaded) {
				return Promise.resolve(
					Object.keys(this.sortedLogs).map(
						(path) => new PathTreeItem(path, path, this.sortedLogs[path])
					)
				);
			}

			return new Promise((resolve) => {
				this.once('load', (logs) => {
					this.isLoaded = true;
					this.sortedLogs = {};
					logs.forEach(this.reduceLogByPath);
					resolve(
						Object.keys(this.sortedLogs).map(
							(path) => new PathTreeItem(path, path, this.sortedLogs[path])
						)
					);
				});
			});
		}
	}

	add = (log: Log) => {
		this.reduceLogByPath(log);
		this.refresh();
	};

	reduceLogByPath = (log: Log): IPathLog => {
		const pathArr = log.originalPosition.source.split('/').filter((el) => el);

		return pathArr.reduce((obj, path, id, arr) => {
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
	};

	reset = () => {
		this.isLoaded = false;
		this.refresh();
	};

	refresh = () => {
		this._onDidChangeTreeData.fire(undefined);
	};
}

export default Sidebar;
