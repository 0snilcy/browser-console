import { URL } from 'url';
import puppeteer from 'puppeteer-core';
import { Protocol } from 'devtools-protocol';
import { EventEmitter } from 'events';

import SourceMaps from './SourceMaps';
import config from '../config';
import Log from './Log';

export interface ClientEvent {
	log: Log;
	update: boolean;
}

export interface FileLoaderResponse {
	status: number;
	statusText: string;
	ok: boolean;
	content?: string;
}

class Client extends EventEmitter {
	private browser: puppeteer.Browser;
	private page: puppeteer.Page;
	private CDPclient: puppeteer.CDPSession;
	private serverHash: string;
	private sourceMaps = SourceMaps;

	public on<K extends keyof ClientEvent>(
		type: K,
		listener: (arg: ClientEvent[K]) => void
	): this {
		return super.on(type, listener);
	}

	public emit<K extends keyof ClientEvent>(type: K, arg: ClientEvent[K]): boolean {
		return super.emit(type, arg);
	}

	public async init(port: number | string) {
		try {
			this.browser = await puppeteer.launch({
				// headless: false,
				// devtools: true,
				args: config.browserArgs,
				executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
			});

			this.page = await this.browser.newPage();

			await this.page.setRequestInterception(true);
			this.page.on('request', this.onScriptRequest);

			// this.page.on('close', () => console.log('close'));
			// this.page.on('domcontentloaded', () => console.log('domcontentloaded'));
			// this.page.on('load', () => console.log('load'));
			// this.page.on('console', console.log);

			this.CDPclient = await this.page.target().createCDPSession();
			await this.CDPclient.send('Runtime.enable');
			await this.CDPclient.send('Network.enable');
			this.CDPclient.on('Runtime.consoleAPICalled', this.onConsoleLog);
			this.CDPclient.on('Network.webSocketFrameReceived', this.onWSReloadPage);

			await this.page.goto(`http://localhost:${port}/`);
		} catch (err) {
			console.error(err);
		}
	}

	public async close() {
		await this.browser.close();
	}

	private onWSReloadPage = (event: Protocol.Network.WebSocketFrameReceivedEvent) => {
		// https://github.com/sockjs/sockjs-client/blob/110788c1e6422972c89d7a65365cc5e46bb6f6ec/lib/main.js#L245
		const message = event.response.payloadData;
		if (!message) {
			return;
		}

		const type = message.slice(0, 1);
		const data = message.slice(1);

		if (data && type === 'a') {
			try {
				const payloadArr = JSON.parse(data);
				payloadArr.forEach((payload: string) => {
					const parsedPayload = JSON.parse(payload);
					if (parsedPayload.type === 'hash') {
						if (!this.serverHash) {
							this.serverHash = parsedPayload.data;
							return;
						}

						if (parsedPayload.data === this.serverHash) {
							return;
						}

						this.serverHash = parsedPayload.data;
						this.emit('update', true);
					}
				});
			} catch (err) {
				console.error(err);
			}
		}
	};

	private onScriptRequest = async (request: puppeteer.Request) => {
		try {
			const type = request.resourceType();
			if (config.request.ignoreTypes.includes(type)) {
				return request.abort();
			}

			if (type === 'script') {
				const url = request.url();
				const response = await this.loadFile(`${url}.map`);

				if (response && response.ok && response.content) {
					await this.sourceMaps.create(url, response.content);
				}
			}

			return request.continue();
		} catch (err) {
			console.error(err);
		}
	};

	private async getPropsByObjectId(objectId: string) {
		try {
			if (objectId) {
				return await this.CDPclient.send('Runtime.getProperties', {
					objectId,
					ownProperties: false,
					accessorPropertiesOnly: true,
					generatePreview: true,
				} as Protocol.Runtime.GetPropertiesRequest);
			}
		} catch (err) {
			console.error(err);
		}
	}

	private onConsoleLog = async (event: Protocol.Runtime.ConsoleAPICalledEvent) => {
		// console.log(event);
		// console.log(event.stackTrace?.callFrames[0]);

		const log = new Log(event);
		if (log.existOnClient) {
			this.emit('log', log);
		}
	};

	private async loadFile(url: string): Promise<FileLoaderResponse | undefined> {
		try {
			const page = await this.browser.newPage();
			const response = await page.goto(url);
			if (!response) {
				return;
			}

			const data: FileLoaderResponse = {
				status: response.status(),
				statusText: response.statusText(),
				ok: response.ok(),
				content: await response.text(),
			};

			await page.close();
			return data;
		} catch (err) {
			console.error(err);
		}
	}
}

(async () => {
	// return;
	try {
		const client = new Client();
		// client.on('log', console.log);
		// client.on('update', () => console.log('clear decors'));
		await client.init(8080);
	} catch (err) {
		console.error(err);
	}
})();

export default Client;

// C:/Program Files (x86)/Google/Chrome/Application/chrome.exe
// C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe
// /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome
// /usr/bin/google-chrome
