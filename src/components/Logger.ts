import { OutputChannel, ExtensionContext, window } from 'vscode';
import config from '../config';
import settings from './Settings';

class Logger {
	private channel: OutputChannel;

	init(context: ExtensionContext) {
		if (settings.editor.debug) {
			this.channel = window.createOutputChannel(config.appNameU);
			context.subscriptions.push(this.channel);
			this.log('Extension has been activated');
		}
	}

	log = (...text: any) => {
		if (settings.editor.debug) {
			this.channel.appendLine(text);
		}
	};
}

export default new Logger();
