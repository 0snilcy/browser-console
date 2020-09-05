import puppeteer from 'puppeteer';

export default {
	appName: 'browserConsole',
	appNameU: 'BrowserConsole',
	logRegexp: /.*console\.log\((.+?)\);*$/gm,
	reconnectTime: 3000,
	decoratorColor: '#ccc',
	languagesIdentifiers: ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'],
	request: {
		ignoreTypes: ['image', 'font', 'stylesheet'],
	},
	browserArgs: [
		// Disable sandboxing when not available
		'--no-sandbox',
		// No GPU available inside Docker
		'--disable-gpu',
		// Seems like a powerful hack, not sure why
		// https://github.com/Codeception/CodeceptJS/issues/561
		"--proxy-server='direct://'",
		'--proxy-bypass-list=*',
		// Disable cache
		'--disk-cache-dir=/dev/null',
		'--media-cache-size=1',
		'--disk-cache-size=1',
		// Disable useless UI features
		'--no-first-run',
		'--noerrdialogs',
		'--disable-notifications',
		'--disable-translate',
		'--disable-infobars',
		'--disable-features=TranslateUI',
		// Disable dev-shm
		// See https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#tips
		'--disable-dev-shm-usage',
		// '--remote-debugging-port=9222',
	],
};
