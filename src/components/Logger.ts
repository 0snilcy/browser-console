import { OutputChannel, ExtensionContext, window } from 'vscode';
import config from '../config';
import settings from './Settings';

class Logger {
	private channel: OutputChannel;

	init(context: ExtensionContext) {
		this.channel = window.createOutputChannel(config.appNameU);
		context.subscriptions.push(this.channel);

		if (settings.editor.debug) {
			this.channel.show();
		}

		this.log('Logger is ready');
	}

	log = (...messages: any[]) => {
		const fileName = (new Error().stack as string).match(/at ([\w\s.<>]+)/gm);

		this.channel.appendLine(
			`${fileName && fileName[1] ? `${fileName[1].slice(2).trim()} > ` : ''}${messages
				.map((message) => {
					return typeof message === 'object'
						? Object.keys(message)
								.map((key) => `${key}: ${message[key]}`)
								.join(' , ')
						: `${message}`;
				})
				.join(' | ')}`
		);
	};
}

export default new Logger();
