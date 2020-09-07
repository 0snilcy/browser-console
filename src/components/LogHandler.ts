import vscode, { workspace, window } from 'vscode';
import config from '../config';

import Log from './Log';
import Sidebar from './Sidebar';
import { Settings } from './Extension';

export interface DecoratorContainer {
	path: string;
	decorator: vscode.TextEditorDecorationType;
}
export default class LogHandler {
	private logs: Log[] = [];
	private decorators: DecoratorContainer[] = [];
	private rootPathCache?: vscode.Uri;
	private activeEditor?: vscode.TextEditor = window.activeTextEditor;

	constructor(
		private context: vscode.ExtensionContext,
		private sidebar: Sidebar,
		private settings: Settings
	) {
		workspace.onDidChangeTextDocument(
			(editor) => {
				if (this.decorators.length && editor.document.isDirty) {
					this.resetFile(editor.document.uri.path);
				}

				if (!editor.document.isDirty) {
					this.showLogsInText(this.logs);
				}
			},
			null,
			context.subscriptions
		);

		window.onDidChangeActiveTextEditor(
			(editor) => {
				this.activeEditor = editor;
				this.showLogsInText(this.logs);
			},
			null,
			context.subscriptions
		);

		workspace.onWillSaveTextDocument(this.reset, null, context.subscriptions);
	}

	private get rootPath(): vscode.Uri {
		if (!this.rootPathCache) {
			const path = workspace.rootPath;

			if (!path) {
				throw Error('Workspase is empty!');
			}

			this.rootPathCache = vscode.Uri.file(workspace.rootPath as string);
		}
		return this.rootPathCache;
	}

	private getDecorator(contentText: string) {
		return window.createTextEditorDecorationType({
			isWholeLine: true,
			after: {
				margin: '0 0 0 1rem',
				contentText,
				color: this.settings.debug ? 'red' : this.settings.textColor,
			},
			border: this.settings.debug ? '1px solid red' : 'none',
		});
	}

	private getRange(line: number) {
		line = +line - 1;
		return new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line, 0));
	}

	private getPathOfRoot(path: string): string {
		return vscode.Uri.joinPath(this.rootPath, path).path;
	}

	add = (log: Log) => {
		this.logs.push(log);
		this.showLogsInText([log]);
		this.sidebar.add(log);
	};

	reset = () => {
		this.decorators = this.decorators.filter(({ decorator }) => {
			decorator.dispose();
		});
		this.logs = [];
		this.sidebar.reset();
	};

	resetFile = (path: string) => {
		this.decorators = this.decorators.filter(({ decorator, path: logPath }) => {
			if (logPath !== path) {
				return true;
			}

			decorator.dispose();
		});
		this.logs = this.logs.filter(
			({ originalPosition }) => path !== this.getPathOfRoot(originalPosition.source)
		);
	};

	private showLogsInText(logs: Log[]) {
		if (!this.activeEditor || this.activeEditor.document.isDirty) {
			return;
		}

		const documentPath = (this.activeEditor as vscode.TextEditor).document.uri.path;

		logs.forEach((log) => {
			const absolutLogPath = this.getPathOfRoot(log.originalPosition.source);

			if (documentPath !== absolutLogPath) {
				return;
			}

			const decorator = this.getDecorator(log.previewTitle);
			const range = [this.getRange(log.originalPosition.line)];
			(this.activeEditor as vscode.TextEditor).setDecorations(decorator, range);

			this.decorators.push({
				decorator,
				path: absolutLogPath,
			});
		});
	}
}
