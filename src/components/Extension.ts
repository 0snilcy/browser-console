import vscode, { workspace, window } from 'vscode';
import Client from './Client';
import LogHandler from './LogHandler';
import config from '../config';
import logger from './Logger';
import StatusBar from './StatusBar';

export default class Extension {
	private client: Client | null;
	private logHandler: LogHandler;
	private statusBar: StatusBar;
	Command: {
		[key: string]: any;
		Start: any;
		Stop: any;
		Restart: any;
	};

	constructor(context: vscode.ExtensionContext, statusBar: StatusBar) {
		this.logHandler = new LogHandler(context);
		this.statusBar = statusBar;

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

	private getConfig() {
		const settings = workspace.getConfiguration(config.appName);

		return {
			port: settings.get('port') as number | undefined,
			debug: settings.get('debug') as boolean,
			pathToChrome: settings.get('pathToChrome') as string | undefined,
		};
	}

	private async initClient(port: number | string) {
		try {
			this.client = new Client();

			this.client.on('update', this.logHandler.reset);
			this.client.on('log', this.logHandler.add);

			await this.client.init(port, this.getConfig().pathToChrome);

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

		const { port: configPort } = this.getConfig();
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
}
