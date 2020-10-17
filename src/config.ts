const pathToChrome: {
  [key in NodeJS.Platform]?: string;
} = {
  win32: `C:/Program Files${
    process.arch === 'x32' ? ' (x86)' : ''
  }/Google/Chrome/Application/chrome.exe`,
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  linux: '/usr/bin/google-chrome',
};

export default {
  appName: 'browserConsole',
  appNameU: 'BrowserConsole',
  appNameShort: 'BConsole',
  languagesIdentifiers: [
    'javascript',
    'javascriptreact',
    'typescript',
    'typescriptreact',
  ],
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
  pathToChrome,
};
