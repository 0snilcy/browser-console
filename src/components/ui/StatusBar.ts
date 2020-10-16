import vscode, { window } from 'vscode';
import config from '../../config';
import extension from '../Extension';

const Icon = {
  BROWSER: 'browser',
  PLAY: 'play',
  ELLIPSIS: 'ellipsis',
};

class StatusBar {
  bar: vscode.StatusBarItem;

  constructor() {
    this.bar = window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      10000
    );
    this.icon = Icon.BROWSER;
    this.bar.show();
    this.bar.command = 'browser-console.commands';

    extension.on('start', () => (this.icon = Icon.PLAY));
    extension.on(['stop', 'error'], () => (this.icon = Icon.BROWSER));
    extension.on('progressStart', () => (this.icon = Icon.ELLIPSIS));
  }

  set icon(iconName: string) {
    this.bar.text = `$(${iconName}) ${config.appNameShort}`;
  }
}

export default new StatusBar();
