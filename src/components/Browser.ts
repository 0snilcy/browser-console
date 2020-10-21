import puppeteer from 'puppeteer-core';
import { Protocol } from 'devtools-protocol';
import os from 'os';

import SourceMaps from './SourceMaps';
import config from '../config';
import Log from './Log';
import { Emitter } from '../interfaces';
import settings, { IRoute } from './Settings';

export interface IFileLoaderResponse {
  status: number;
  statusText: string;
  ok: boolean;
  content?: string;
}

export interface IBrowserEvent {
  log: Log;
  reload: undefined;
  load: string;
}

interface IPage {
  page: puppeteer.Page;
  cdp: puppeteer.CDPSession;
}

class Browser extends Emitter<IBrowserEvent> {
  private browser: puppeteer.Browser;
  private pages: {
    [key: string]: IPage;
  } = {};
  private serverHash: string;
  private sourceMaps = SourceMaps;
  private port: number | string;

  private get defaultBrowserDir() {
    const platform = os.platform();
    return config.pathToChrome[platform];
  }

  async createPage({ route }: IRoute) {
    const page = await this.browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', this.onScriptRequest);
    page.on('load', () => {
      this.emit('load', route);
      const routeSettings = settings.editor.routes?.find(
        (settingRoute) => settingRoute.route === route
      );

      if (!routeSettings || !routeSettings.events?.length) return;

      routeSettings.events.forEach(async (event) => {
        const match = event.match(/^\s*(\w+)\s+'(.+)'\s*(\d*)\s*$/);

        if (match) {
          const [, type, selector, timeout = 0] = match;
          const elsHandle = await page.$$(selector);
          if (elsHandle.length) {
            page.evaluate(
              (type, timeout, ...els) => {
                els.forEach((el) => {
                  setTimeout(() => {
                    const eventObj = new Event(type);
                    el.dispatchEvent(eventObj);
                  }, timeout);
                });
              },
              type,
              +timeout,
              ...elsHandle
            );
          }
        }
      });
    });

    const CDPclient = await page.target().createCDPSession();
    await CDPclient.send('Runtime.enable');
    await CDPclient.send('Network.enable');
    CDPclient.on('Runtime.consoleAPICalled', (event) =>
      this.onConsoleLog(route, event)
    );
    CDPclient.on('Network.webSocketFrameReceived', this.onWSReloadPage);

    page.goto(`http://localhost:${this.port}${route}`);
    this.pages[route] = {
      page,
      cdp: CDPclient,
    };
  }

  async init(port: number | string, browserDir?: string) {
    this.port = port;

    this.browser = await puppeteer.launch({
      args: config.browserArgs,
      executablePath: browserDir || this.defaultBrowserDir,

      ...(settings.editor.debug
        ? {
            headless: false,
            devtools: true,
          }
        : {}),
    });

    settings.editor.routes?.forEach(this.createPage, this);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private onWSReloadPage = (
    event: Protocol.Network.WebSocketFrameReceivedEvent
  ) => {
    // https://github.com/sockjs/sockjs-client/blob/110788c1e6422972c89d7a65365cc5e46bb6f6ec/lib/main.js#L245
    const message = event.response.payloadData;
    if (!message) {
      return;
    }

    const type = message.slice(0, 1);
    const data = message.slice(1);

    if (data && type === 'a') {
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
          this.emit('reload');
        }
      });
    }
  };

  private onScriptRequest = async (request: puppeteer.Request) => {
    const type = request.resourceType();
    if (
      settings.editor.ignoreRequestTypes &&
      settings.editor.ignoreRequestTypes.includes(type)
    ) {
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
  };

  private getPropsByObjectId = async (
    route: string,
    objectId: Protocol.Runtime.RemoteObjectId,
    isProperty = true
  ): Promise<Protocol.Runtime.GetPropertiesResponse | undefined> => {
    if (objectId) {
      const client = this.pages[route].cdp;
      return (await client.send('Runtime.getProperties', {
        objectId,
        ownProperties: isProperty,
        accessorPropertiesOnly: !isProperty,
        generatePreview: true,
      } as Protocol.Runtime.GetPropertiesRequest)) as Protocol.Runtime.GetPropertiesResponse;
    }

    console.error('objectId is missing');
  };

  private onConsoleLog = async (
    route: string,
    event: Protocol.Runtime.ConsoleAPICalledEvent
  ) => {
    const log = new Log(
      route,
      event,
      this.getPropsByObjectId.bind(this, route)
    );

    if (log.existOnClient) {
      this.emit('log', log);
    }
  };

  private async loadFile(
    url: string
  ): Promise<IFileLoaderResponse | undefined> {
    const page = await this.browser.newPage();
    const response = await page.goto(url);
    if (!response) {
      return;
    }

    const data: IFileLoaderResponse = {
      status: response.status(),
      statusText: response.statusText(),
      ok: response.ok(),
      content: await response.text(),
    };

    await page.close();
    return data;
  }

  reload() {
    Object.keys(this.pages).forEach((key) => this.pages[key].page.reload());
  }
}

const test = async () => {
  console.clear();
  const browser = new Browser();
  await browser.init(8080);
};

// test();

export default Browser;
