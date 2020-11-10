# Browser Console

The Browser Console allows you to see console.log statements from the browser in the editor.

**Usage:**

1. Start the development server.
2. Set the port to confugure `browserConsole.port`
3. Launch the virtual browser
   - with the command `BrowserConsole: Start`
   - or via _Status bar_ panel `BConsole` > `BrowserConsole: Start`
4. Open the `Browser Console` view in the _Menu panel_

## Features

### Decorate the line

![Alt text](./assets/preview/decorator.png)

---

### Show object property descriptors and hide enumerable property

![Alt text](./assets/preview/enumerable.gif)

---

### Go to line

![Alt text](./assets/preview/go-to-line.gif)

---

### Routing

Configuration `browserConsole.routes`, for example:

```json
{
  "browserConsole.routes": [
    {
      "route": "/",
      "events": []
    },
    {
      "route": "/movie-page",
      "events": []
    }
  ]
}
```

---

### Custom events

Configuration `browserConsole.routes`, for example:

```json
{
  "browserConsole.routes": [
    {
      "route": "/",
      "events": ["click 'button.click-me' 1000"]
    }
  ]
}
```

This configuration dispatches index page click event on html elements _button.click-me_ after page load and timeout of 1000ms. `document.querySelectorAll` used for searching.
