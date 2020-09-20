import vscode, { workspace, window, Command } from 'vscode';
import Browser from './Browser';
import LogController from './LogContrller';
import config from '../config';
import logger from './Logger';
import StatusBar from './ui/StatusBar';
import { IPosition } from './Log';
import { URL } from 'url';
import settings, { IEditorSettings } from './Settings';

type AsyncFn = () => Promise<void>;

interface ICommand {
	Start: AsyncFn;
	Stop: AsyncFn;
	Restart: AsyncFn;
}

export default class Extension {
	private browser: Browser | null;
	private logController: LogController;

	constructor(context: vscode.ExtensionContext, private statusBar: StatusBar) {
		settings.setContext(context);

		if (settings.editor.debug) {
			this.startExtension();
		}
	}

	private getMessage(text: string) {
		return `${config.appNameU}: ${text}`;
	}

	private showInfo(message: string) {
		window.showInformationMessage(this.getMessage(message));
	}

	private showWarn(message: string) {
		window.showWarningMessage(this.getMessage(message));
	}

	private showError(err: string | Error) {
		// this.stopExtensin();
		console.error(err);
		logger.log(err);

		if (err instanceof Error) {
			return window.showErrorMessage(this.getMessage(err.message));
		}

		window.showErrorMessage(this.getMessage(err));
	}

	private async getWebpackConfig() {
		try {
			const webpackConfig = await workspace.findFiles(
				'webpack.config.js',
				'**/node_modules/**'
			);

			for await (const config of webpackConfig) {
				const { devServer } = await import(config.path);
				if (!devServer) {
					return;
				}

				const { port, publicPath } = devServer;

				if (port) {
					return port;
				}

				if (publicPath) {
					return new URL(publicPath).port;
				}
			}
		} catch (err) {
			console.error(err);
			logger.log(err);
		}
	}

	private async initBrowser(port: number | string) {
		try {
			this.logController = new LogController();
			this.browser = new Browser();

			this.browser.on('update', this.logController.reset);
			this.browser.on('log', this.logController.add);

			await this.browser.init(port);

			this.showInfo(`Virtual console has been connected to http://localhost:${port}!`);
			this.statusBar.inActive();
			vscode.commands.executeCommand(
				'setContext',
				'browser-console.browserIsStarting',
				true
			);

			vscode.commands.executeCommand(
				'setContext',
				'browser-console.showEnumerable',
				settings.editor.showEnumerable
			);
		} catch (err) {
			this.showError(err);
		}
	}

	startExtension = async () => {
		if (!workspace.rootPath) {
			this.showError('Workspase is empty!');
		}

		this.statusBar.inProgress();

		const { port: configPort } = settings.editor;
		if (configPort) {
			return this.initBrowser(configPort);
		}

		const webpackPort = await this.getWebpackConfig();
		if (webpackPort) {
			return this.initBrowser(webpackPort);
		}

		const inputPort = await window.showInputBox({
			placeHolder: 'Port number',
			prompt: this.getMessage('Enter the port number of the running web server'),
			ignoreFocusOut: true,
		});

		if (inputPort) {
			const portNumbr = parseInt(inputPort);

			if (portNumbr) {
				return this.initBrowser(portNumbr);
			}
		}

		this.showError('Port is not valid!');
	};

	stopExtensin = async () => {
		if (!this.browser) {
			return;
		}

		await this.browser.close();
		this.logController.reset();
		this.logController.removeListeners();
		this.statusBar.inStopped();
		vscode.commands.executeCommand(
			'setContext',
			'browser-console.browserIsStarting',
			false
		);
		this.browser = null;
	};

	restartExtension = async () => {
		this.statusBar.inProgress();
		await this.stopExtensin();
		await this.startExtension();
	};

	showCommands = async () => {
		const Command: ICommand = {
			Start: this.startExtension,
			Stop: this.stopExtensin,
			Restart: this.restartExtension,
		};

		const value = (await vscode.window.showQuickPick(Object.keys(Command))) as
			| keyof ICommand
			| undefined;

		if (value) {
			Command[value].call(this);
		}
	};

	showLine = async (position: IPosition) => {
		const rootpath = vscode.Uri.file(workspace.rootPath as string);
		const filePath = vscode.Uri.joinPath(rootpath, position.source);
		const line = position.line - 1;
		const codePosition = new vscode.Position(line, 0);

		const visibleEditor = window.visibleTextEditors.find((editor) => {
			return filePath.path === editor.document.uri.path;
		});

		if (visibleEditor) {
			visibleEditor.selection = new vscode.Selection(codePosition, codePosition);
			visibleEditor.revealRange(new vscode.Range(codePosition, codePosition));
		} else {
			window.showTextDocument(filePath, {
				selection: new vscode.Range(codePosition, codePosition),
			});
		}
	};
}
