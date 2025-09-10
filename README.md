# Shopgate Connect - Userlike Live chat

This extension integrates the [Userlike Messenger API](https://github.com/userlike/messenger) to provide live chat functionality.

## Configuration

### widgetKey (string)
The Userlike widget key

### pagesWithoutWidget (array)
Array of Page patterns which should not have the chat widget

Example:
```json
"pagesWithoutWidget": [
  "/cart",
  "/"
  "/item"
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

Shopgate Connect - Swell is available under the Apache License, Version 2.0.

See the [LICENSE](./LICENSE) file for more information.
