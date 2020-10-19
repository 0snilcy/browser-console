import { workspace } from 'vscode';
import config from '../config';
import { Emitter } from '../interfaces';

export interface IRoute {
  route: string;
  events?: string[];
}

export interface IEditorSettings {
  port?: number;
  debug?: boolean;
  pathToChrome?: string;
  textColor?: string;
  showEnumerable?: boolean;
  treeViewMode?: boolean;
  routes?: IRoute[];
  excludeDirs?: string[];
  ignoreRequestTypes?: string[];
}

interface ISettingsEvents {
  update: IEditorSettings;
}

class Settigns extends Emitter<ISettingsEvents> {
  private _editor: IEditorSettings = {};

  constructor() {
    super();

    workspace.onDidChangeConfiguration(this.updateFromConfig);
    this.updateFromConfig();
  }

  updateFromConfig = () => {
    const settings = workspace.getConfiguration(config.appName);
    this.update(settings as IEditorSettings);
  };

  get editor() {
    return this._editor;
  }

  update(settings: IEditorSettings) {
    this._editor = {
      ...this.editor,
      ...settings,
    };
    this.emit('update', this._editor);
  }
}

export default new Settigns();
