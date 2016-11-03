---
layout: default
title: JS docs
---

# Using Javascript to access the 123test API

Adding tests to your website can be done easily using our Javascript SDK. With just a few lines of Javascript and almost no change to your markup you can include tests and reports to existing pages. See the [Full Example](examples/full-example) for a template.

We utilize [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) to restrict API requests to whitelisted domains. Additionally, every request must contain a valid API key for identification. Our client side Javascript library handles all requests and makes sure that the correct headers are set.

## Documentation

Follow the steps below to add a product to your page:

1. [Setting Up](setting-up)
2. [HTML structure](html-structure)
3. [Loading products](loading-products)

## Additional information:

* [Configuration](configuration)
* [Using the event system](events)
* Examples:
  * [Full Example](examples/full-example)
  * [PDF download button](examples/pdf-button)