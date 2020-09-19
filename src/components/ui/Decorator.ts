import vscode, { workspace, window } from 'vscode';
import Log from '../Log';
import { ISettings } from '../Extension';
import { getPathOfRoot } from '../../utils';

export interface IDecoratorContainer {
	[key: string]: vscode.TextEditorDecorationType[];
}

class Decorator {
	private decorators: IDecoratorContainer = {};
	constructor(private settings: ISettings) {}

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

	private resetDocumentDecorators = (path: string) => {
		const decoratoesArr = this.decorators[path];
		if (decoratoesArr) {
			decoratoesArr.forEach((decorator) => decorator.dispose());
		}
		this.decorators[path] = [];
	};

	reset() {
		Object.values(this.decorators).forEach((decorators) =>
			decorators.forEach((decorator) => decorator.dispose())
		);

		this.decorators = {};
	}

	onChange(logs: Log[]) {
		const activeEditor = window.activeTextEditor;

		if (!activeEditor) {
			return;
		}

		const documentPath = activeEditor.document.uri.path;

		if (activeEditor.document.isDirty) {
			this.resetDocumentDecorators(documentPath);
		} else {
			logs.forEach((log) => {
				const absolutLogPath = getPathOfRoot(log.originalPosition.source);

				if (documentPath !== absolutLogPath) {
					return;
				}

				const decorator = this.getDecorator(log.previewTitle);
				const range = [this.getRange(log.originalPosition.line)];
				activeEditor.setDecorations(decorator, range);

				const decoratorsArr = this.decorators[absolutLogPath];
				if (decoratorsArr) {
					decoratorsArr.push(decorator);
				} else {
					this.decorators[absolutLogPath] = [decorator];
				}
			});
		}
	}
}

export default Decorator;
