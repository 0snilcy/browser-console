import vscode from 'vscode';
import Log, { IDescriptor } from '../../Log';

import ArgTreeItem from './tree-items/ArgTreeItem';
import LogTreeItem from './tree-items/LogTreeItem';
import PathTreeItem from './tree-items/PathTreeItem';
import PropTreeItem from './tree-items/PropTreeItem';

import settings from '../../Settings';
import { Emitter } from '../../../interfaces';
import logger from '../../Logger';

type MaybeLog = vscode.TreeItem | undefined;

interface IPathLog {
  [key: string]: IPathLog | Log[];
}

interface ISiebarEvents {
  load: Log[];
}

interface IIdsCache {
  [key: string]: number;
}

class Sidebar
  extends Emitter<ISiebarEvents>
  implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    MaybeLog
  > = new vscode.EventEmitter<MaybeLog>();
  readonly onDidChangeTreeData: vscode.Event<MaybeLog> = this
    ._onDidChangeTreeData.event;
  private sortedLogs: IPathLog = {};
  private isLoad = false;
  private argsIdCache: IIdsCache = {};
  private logs: Log[] = [];

  /**
   * Sidebar ready to render
   */
  isReady = false;

  constructor() {
    super();
    settings.on('update', this.refresh);
  }

  getParent(element: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem> {
    return undefined;
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(
    parentElement: vscode.TreeItem
  ): Promise<vscode.TreeItem[]> {
    if (!this.isReady) return Promise.resolve([]);

    logger.log({
      parentTooltip: parentElement?.tooltip,
    });

    if (parentElement) {
      if (parentElement instanceof PathTreeItem) {
        const { value } = parentElement;

        if (Array.isArray(value)) {
          // logs
          return Promise.resolve(this.getTreeItemsFromArray(value));
        }

        // include dirs
        return Promise.resolve(
          Object.keys(value).map(
            (path) =>
              new PathTreeItem(`${parentElement.id}/${path}`, path, value[path])
          )
        );
      }

      if (parentElement instanceof LogTreeItem) {
        const preview = parentElement.log.preview;
        return Promise.resolve(
          preview.map(
            (arg, id) =>
              new ArgTreeItem(
                `${parentElement.id}[${id}]`,
                parentElement.log,
                arg
              )
          )
        );
      }

      if (
        parentElement instanceof ArgTreeItem ||
        parentElement instanceof PropTreeItem
      ) {
        const id = parentElement.preview.objectId;
        if (id) {
          try {
            const response = await parentElement.log.getProps(
              parentElement.preview
            );
            if (response) {
              return Promise.resolve(
                response
                  .filter(
                    ({ descriptors }) =>
                      settings.editor.showEnumerable || descriptors.enumerable
                  )
                  .sort((a, b) => {
                    if (a.name.startsWith('[[')) return 1;
                    if (b.name.startsWith('[[')) return -1;
                    if (a.name.startsWith('__')) return 1;
                    if (b.name.startsWith('__')) return -1;
                    if (a.name.startsWith('Symbol(')) return 1;
                    if (b.name.startsWith('Symbol(')) return -1;
                    return a.name > b.name ? 1 : -1;
                  })
                  .map(
                    ({ name, preview, descriptors }) =>
                      new PropTreeItem(
                        parentElement.log,
                        name,
                        preview,
                        Object.keys(descriptors)
                          .map(
                            (key) =>
                              `${key}: ${descriptors[key as keyof IDescriptor]}`
                          )
                          .join('\n'),
                        `${parentElement.id}['${name}']`
                      )
                  )
              );
            }
          } catch (err) {
            console.error(err);
          }
        }
      }

      return Promise.resolve([]);
    } else {
      // root dirs
      logger.log('rootDirs', {
        logs: this.sortedLogs,
        isLoad: this.isLoad,
      });

      if (this.isLoad) {
        return Promise.resolve(
          settings.editor.treeViewMode
            ? this.pathItems
            : this.getTreeItemsFromArray(this.logs)
        );
      }

      return new Promise((resolve) => {
        logger.log('once.load.add');
        this.once('load', (logs) => {
          logger.log('once.load.ready', logs.length);
          this.isLoad = true;
          this.logs = logs;
          this.sortedLogs = {};
          logs.forEach(this.reduceLogByPath);

          resolve(
            settings.editor.treeViewMode
              ? this.pathItems
              : this.getTreeItemsFromArray(this.logs)
          );
        });
      });
    }
  }

  private getTreeItemsFromArray(logs: Log[]) {
    logger.log({
      logsLength: logs.length,
    });

    return logs
      .map((log: Log, id) => {
        const first = log.args[0];
        const preview = log.getPreview(first);
        const { line, column, source } = log.originalPosition;
        const argId = this.getArgId(
          `${log.route}${source}:${line}:${column}`,
          id
        );

        return log.args.length > 1
          ? new LogTreeItem(argId, log)
          : new ArgTreeItem(argId, log, preview);
      })
      .sort(({ log: logA }, { log: logB }) => {
        return settings.editor.treeViewMode
          ? logA.originalPosition.line - logB.originalPosition.line
          : 0;
      });
  }

  private getArgId(key: string, id?: number) {
    logger.log({
      key,
      id,
      counter: this.argsIdCache[key],
    });

    const exist = this.argsIdCache[key];

    if (typeof exist === 'number') {
      if (typeof id === 'number' && exist >= id) {
        return `${key}[${id}]`;
      }

      ++this.argsIdCache[key];
    } else {
      this.argsIdCache[key] = 0;
    }

    return `${key}[${this.argsIdCache[key]}]`;
  }

  private copy = (obj: IPathLog) => {
    const result: IPathLog = {};

    for (const [key, value] of Object.entries(obj)) {
      if (!Array.isArray(value)) {
        const newObj = this.copy(value);
        const newKeys = Object.keys(newObj);

        if (newKeys.length === 1) {
          const nextKey = newKeys[0];
          result[`${key}/${nextKey}`] = newObj[nextKey];
        } else {
          result[key] = newObj;
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  };

  private get pathItems() {
    const renderedLogs = this.copy(this.sortedLogs);

    return Object.keys(renderedLogs)
      .map((path) => new PathTreeItem(path, path, renderedLogs[path]))
      .sort((a, b) => (a.id > b.id ? 1 : -1));
  }

  private reduceLogByPath = (log: Log): IPathLog => {
    const pathArr = log.originalPosition.source.split('/').filter((el) => el);

    if (settings.editor.routes && settings.editor.routes.length > 1) {
      pathArr.unshift(log.route);
    }

    return pathArr.reduce((obj, path, id, arr) => {
      const existLogs = obj[path];
      const isLast = !arr[id + 1];

      if (existLogs) {
        if (Array.isArray(existLogs)) {
          existLogs.push(log);
          return obj;
        }

        return existLogs;
      }

      if (!isLast) {
        const nextPathObj = {};
        obj[path] = nextPathObj;
        return nextPathObj;
      }

      obj[path] = [log];
      return obj;
    }, this.sortedLogs);
  };

  private rerender() {
    this.sortedLogs = {};
    this.argsIdCache = {};
    this.refresh();
  }

  private refresh = () => {
    logger.log();
    this._onDidChangeTreeData.fire(undefined);
  };

  /**
   * Render only received logs in the Sidebar
   */
  add = (logs: Log[]) => {
    logger.log();
    this.sortedLogs = {};
    logs.forEach(this.reduceLogByPath);
    this.logs = logs;
    this.isLoad = true;
    this.refresh();
  };

  /**
   * Runs the progress bar and waits for the event to load
   */
  update = () => {
    logger.log();
    this.isLoad = false;
    this.rerender();
  };

  /**
   * Render empty sidebar
   */
  clear = () => {
    logger.log();
    this.isLoad = true;
    this.rerender();
  };
}

export default new Sidebar();
