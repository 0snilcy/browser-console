import vscode, { workspace, window } from 'vscode';

import Log from './Log';
import Decorator from './ui/Decorator';
import sidebar from './ui/sidebar/Sidebar';
import logger from './Logger';

class LogController {
	private logs: Log[] = [];
	private decorator = new Decorator();
	private listeners: vscode.Disposable[] = [];
	private isLoad = false;
	private sidebar = sidebar;

	log = (log: Log) => {
		this.logs.push(log);
		logger.log('log', {
			logsLength: this.logs.length,
			isLoad: this.isLoad,
			logTitle: log.previewTitle,
		});

		if (this.isLoad) {
			this.sidebar.add(this.logs);
			this.decorator.add([log]);
		}
	};
	update = () => {
		this.logs = [];

		logger.log('update', {
			isLoad: this.isLoad,
			logsLength: this.logs.length,
		});

		this.isLoad = false;
		this.sidebar.update();
		this.decorator.reset();
	};

	load = () => {
		logger.log('load', {
			logsLength: this.logs.length,
		});

		this.sidebar.emit('load', this.logs);
		this.decorator.add(this.logs);
		this.isLoad = true;
	};

	addListeners() {
		logger.log();

		workspace.onDidChangeTextDocument(
			() => {
				if (this.isLoad) {
					this.decorator.add(this.logs);
				}
			},
			null,
			this.listeners
		);

		window.onDidChangeActiveTextEditor(
			() => this.decorator.add(this.logs),
			null,
			this.listeners
		);

		workspace.onWillSaveTextDocument(
			() => {
				this.isLoad = false;
			},
			null,
			this.listeners
		);

		this.sidebar.isReady = true;
	}

	removeListeners() {
		logger.log();

		this.logs = [];
		this.isLoad = false;
		this.sidebar.clear();
		this.decorator.reset();

		this.listeners.forEach((listener) => listener.dispose());
		this.sidebar.isReady = false;
	}
}

export default LogController;
