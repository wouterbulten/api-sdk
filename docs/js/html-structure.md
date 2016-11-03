---
layout: default
title: JS SDK - HTML structure
---

# HTML structure

> Make sure to read the [Setting Up](loading-product) guide first before you follow the guide below.

There are a few requirements to your HTML before you can load products (instruments and reports). The most basic setup contains three div elements:

1.  A loading div: displayed when the API is loading new content. You can customize the content
    of this div; the API will only hide and show this element.
2.  A product div: All instruments are rendered in this div. It is important not to add
    any content here as this will be overwritten.
3. A report div: HTML reports are rendered in this div. It is important not to add
    any content here as this will be overwritten.

The most basic example is as follows:

```HTML

<div id="its123api-loading">
  <!-- Custom loading message -->
  <p>Loading</p>
</div>

<div id="its123api-product">
  <!-- Instruments are rendered in this div, keep empty -->
</div>

<div id="its123api-report">
  <!-- HTML reports are rendered in this div, keep empty -->
</div>
```

We opt for [convention-over-configuration](https://en.wikipedia.org/wiki/Convention_over_configuration), so as long as you keep the id's of the divs the same no further configuration is needed.

## Using different id's or existing elements

If you want to render instruments or reports to other elements, or would like to change the names of the
id's some configuration is needed. Non-default id's can be passed to the constructor of the `Its123` object:

```js

var api = new Its123({
    ... other configuration ..

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
    }
});
```
