# Configuration

Overview of all the API options that can be set:

```js

const defaultApiConfig = {

  // Main API domain
  domain: 'https://api.123test.com',
  // Version to use
  version: 'v2',

  // Whether or not to log errors
  logErrors: true,
  // Environment
  environment: 'production',

  // DOM config
  elements: {
    // ID for the loading div
    loadingElementId: 'its123api-loading',
    // ID for the instrument/product div
    productElementId: 'its123api-product',
    // ID for the report div
    reportElementId: 'its123api-report',

    // Selector used to bind events to instrument forms, we advise
    // not to alter this selector.
    instrumentFormSelector: 'form.its123-instrument',

    // Internal placeholders for the DOM elements, do not set these to any values
    loadingElement: null,
    productElement: null,
    reportElement: null,
  },

  // API key to use
  apiKey: 'not-set',
};

```
