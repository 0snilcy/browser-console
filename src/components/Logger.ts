import { OutputChannel, ExtensionContext, window } from 'vscode';
import config from '../config';

class Logger {
	private channel: OutputChannel;
	private debug = true;

	init(context: ExtensionContext) {
		if (this.debug) {
			this.channel = window.createOutputChannel(config.appNameU);
			context.subscriptions.push(this.channel);
			this.log('Extension has been activated');
		}
	}

	log = (...text: any) => {
		if (this.debug) {
			this.channel.appendLine(text);
		}
	};
}

export default new Logger();
