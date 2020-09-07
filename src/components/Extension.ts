import vscode, { workspace, window } from 'vscode';
import Client from './Client';
import LogHandler from './LogHandler';
import config from '../config';
import logger from './Logger';
import StatusBar from './StatusBar';
import Sidebar from './Sidebar';
import { Position } from './Log';

export interface Settings {
	port?: number;
	debug?: boolean;
	pathToChrome?: string;
	textColor?: string;
}

export default class Extension {
	private client: Client | null;
	private logHandler: LogHandler;
	Command: {
		[key: string]: any;
		Start: any;
		Stop: any;
		Restart: any;
	};

	constructor(
		private context: vscode.ExtensionContext,
		private statusBar: StatusBar,
		private sidebar: Sidebar
	) {
		this.Command = {
			Start: this.startExtension,
			Stop: this.stopExtensin,
			Restart: this.restartExtension,
		};
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
		this.stopExtensin();
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
		}
	}

	private get settings() {
		const settings = workspace.getConfiguration(config.appName);

		return {
			port: settings.get('port'),
			debug: settings.get('debug'),
			pathToChrome: settings.get('pathToChrome'),
			textColor: settings.get('textColor'),
		} as Settings;
	}

	private async initClient(port: number | string) {
		try {
			this.logHandler = new LogHandler(this.context, this.sidebar, this.settings);
			this.client = new Client();

			this.client.on('update', this.logHandler.reset);
			this.client.on('log', this.logHandler.add);

			await this.client.init(port, this.settings.pathToChrome);

			this.showInfo(`Virtual console has been connected to http://localhost:${port}!`);
			this.statusBar.inActive();
		} catch (err) {
			this.showError(err);
		}
	}

	public startExtension = async () => {
		if (!workspace.rootPath) {
			this.showError('Workspase is empty!');
		}

		this.statusBar.inProgress();

		const { port: configPort } = this.settings;
		if (configPort) {
			return this.initClient(configPort);
		}

		const webpackPort = await this.getWebpackConfig();
		if (webpackPort) {
			return this.initClient(webpackPort);
		}

		const inputPort = await window.showInputBox({
			placeHolder: 'Port number',
			prompt: this.getMessage('Enter the port number of the running web server'),
			ignoreFocusOut: true,
		});

		if (inputPort) {
			const portNumbr = parseInt(inputPort);

			if (portNumbr) {
				return this.initClient(portNumbr);
			}
		}

		this.showError('Port is not valid!');
	};

	public stopExtensin = async () => {
		if (!this.client) {
			return;
		}

		await this.client.close();
		this.logHandler.reset();
		this.statusBar.inStopped();
		this.client = null;
	};

	public restartExtension = async () => {
		this.statusBar.inProgress();
		await this.stopExtensin();
		await this.startExtension();
	};

	public showCommands = async () => {
		const value = await vscode.window.showQuickPick(Object.keys(this.Command));

		if (!value) {
			return;
		}

		this.Command[value].call(this);
	};

	public showLine = async (position: Position) => {
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
