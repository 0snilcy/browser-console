import vscode, { workspace, window } from 'vscode';
import Log from '../Log';
import { getPathOfRoot } from '../../utils';
import settings from '../Settings';

export interface IDecoratorContainer {
	[key: string]: vscode.TextEditorDecorationType[];
}

class Decorator {
	private decorators: IDecoratorContainer = {};

	private getDecorator(contentText: string) {
		return window.createTextEditorDecorationType({
			isWholeLine: true,
			after: {
				margin: '0 0 0 1rem',
				contentText,
				color: settings.editor.debug ? 'red' : settings.editor.textColor,
			},
			border: settings.editor.debug ? '1px solid red' : 'none',
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

	add(logs: Log[]) {
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
