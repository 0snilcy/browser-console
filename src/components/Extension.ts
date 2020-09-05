import vscode, { workspace, window } from 'vscode';
import Client from './Client';
import LogHandler from './LogHandler';
import config from '../config';
import logger from './Logger';

export default class Extension {
	private client: Client;
	private logHandler: LogHandler;

	constructor(context: vscode.ExtensionContext) {
		this.logHandler = new LogHandler(context);
	}

	private getMessage(text: string) {
		return `${config.appNameU}: ${text}`;
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
		};
	}

	private async initClient(port: number | string) {
		try {
			this.client = new Client();

			this.client.on('update', this.logHandler.reset);
			this.client.on('log', this.logHandler.add);

			await this.client.init(port);

			await window.showInformationMessage(
				this.getMessage(`Virtual console has been connected to http://localhost:${port}!`)
			);
		} catch (err) {
			console.error(err);
			await window.showErrorMessage(
				this.getMessage(
					`Virtual console has not been connected to http://localhost:${port}!`
				)
			);
		}
	}

	public onStartExtension = async () => {
		if (workspace.rootPath) {
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

			window.showErrorMessage('Port is not valid!');
		}

		throw Error('Workspase is empty!');
	};

	public onStopExtensin = async () => {
		await this.client.close();
		this.logHandler.reset();

		await window.showErrorMessage(
			this.getMessage(`Virtual console has been disconnected!`)
		);
	};
}
