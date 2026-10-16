# Shopgate Connect - Userlike Live chat

Shoppers who need help inside the app usually have no direct way to reach the merchant's support
team. This extension adds the [Userlike](https://www.userlike.com) live chat to the Shopgate app,
so shoppers can start a chat from any page.

What the shopper sees:

- A chat button that floats above the tab bar, the page footer and the device's safe area.
- The button is hidden on pages the merchant excludes (e.g. cart, login) and while a sheet
  (bottom drawer) is open.
- The chat only loads after the shopper accepted comfort cookies in the app's cookie consent (on
  PWA versions without cookie consent it loads on app start).
- Logged-in shoppers don't have to enter their name and email again – they are passed to
  Userlike, provided statistics cookies were accepted.

Userlike can be connected in two ways:

- **Widget Key** (default) – integrates the [Userlike Messenger API](https://github.com/userlike/messenger)
  via `@userlike/messenger` and a configured widget key.
- **JavaScript SDK file** – injects the Userlike SDK `<script>` and controls it via the global
  `window.userlike` API (the method used up to version 1.2.1).

## Upgrading

Stores upgrading from 1.2.x or 1.3.x keep their integration method without manual changes (see
`integrationType` below).

Stores upgrading from **1.2.x** should check `iframeChatTitle`: its default changed from
`"Kundensupport-Chat"` (1.2.x) to `"Chat"` (since 1.3.0). If the value was never saved in the
admin, set it to the title of your chat iframe again, otherwise the safe-area padding and
background color are no longer applied to the chat window.

## Configuration

### integrationType (select)
Selects the integration method. One of:

- `auto` (default) – detect the method from the configured keys: if only `sdkUrl` is set (and no
  `widgetKey`), the JavaScript SDK file is used; otherwise the widget key is used. This keeps
  upgrades from older versions working without manual changes.
- `widgetKey` – always use the Userlike Messenger widget key.
- `sdkUrl` – always use the legacy JavaScript SDK file.

### widgetKey (string)
The Userlike widget key. Used when `integrationType` is `widgetKey`, and by `auto` whenever it is
set.

### sdkUrl (string)
The URL of the Userlike JavaScript SDK file. Used when `integrationType` is `sdkUrl`, and by
`auto` when no `widgetKey` is set.

### pagesWithoutWidget (array)
Array of Page patterns which should not have the chat widget

Example:
```json
"pagesWithoutWidget": [
  "/cart",
  "/",
  "/item/:productId"
]
```

### iframeChatTitle (string)
Defines the `title` attribute used to identify the chat iframe

### iframeBackgroundColor (string)
Defines the background color of the iframe


## About Shopgate

Shopgate is the leading mobile commerce platform.

Shopgate offers everything online retailers need to be successful in mobile. Our leading
software-as-a-service (SaaS) enables online stores to easily create, maintain and optimize native
apps and mobile websites for the iPhone, iPad, Android smartphones and tablets.

## License

Shopgate Connect - Userlike Live chat is available under the Apache License, Version 2.0.

See the [LICENSE](./LICENSE) file for more information.
