# Setting up

123test offers a ready-to-use Javascript library to access the API. The library manages
everything from requesting products, displaying instruments and showing reports.

The library comes in two forms:

- A **lightweight version** that can be used by modern browsers which only includes code to access
  the API. This version can only be used in browsers that have native support for promises, fetch
  an modern objects. Roughly this applies to Firefox >= 39, Chrome >= 42, Opera > 29, Edge and
  modern versions of Chrome for Android.

  The minified version of this library is *~7kB*.

- For older browsers we supply a **compatibility version** of the library which includes polyfills
  for promises and fetch. This library additionally supports Internet Explorer >= 9 and Safari.

  The minified version of this library is ~37kB.

The correct version of the library can be loaded automatically by using a small feature-detection loader. The loader inserts the correct version of the library into the DOM. If only a subset of browsers needs to be supported it is possible to manually select one of the libraries.

## Using the loader

We advise to directly place the loader into the HTML of the page. The loader is small (< 0.6kB) and inlining will reduce the number of requests.

The loader adds a new function to the window object: `loadIts123Api`. Calling this function loads the required library into the DOM. `loadIts123Api` requires two arguments:

1. `domain`: The specific 123test API domain you want to use. In almost any case this is `https://api.123test.com`. Note: all requests to the API (also loading the scripts) are served over https.
2.  `callback`: A function to be called when loading of the library is complete. In this function you can define which specific product you want to include.

The loader appends a single javascript file to the DOM.

```html
<script type='text/javascript'>
// Detect browser features and load correct library
window.loadIts123Api=function(a,b){var c="undefined"!=typeof Promise&&Promise.toString().indexOf("[native code]")!==-1&&window.fetch,d=function(a,b){var c=document.createElement("script");c.type="text/javascript",c.src=a,c.onload=b;var d=document.getElementsByTagName("script")[0];d.parentNode.insertBefore(c,d)};c?d(a+"/its123api.min.js",b):d(a+"/its123api.polyfill.min.js",b)};

loadIts123Api('https://api.123test.com', function () {
    var api = new Its123({
        apiKey: 'your-api-key'
    });

    // Request an instrument here
    // ...
});
</script>
```

## Directly including the javascript

The API can also be used without the loader by manually loading *one* of the files:

```html
<!-- For modern browsers: -->
<script src='https://api.123test.com/its123api.min.js'></script>

<!-- Or for legacy browsers: -->
<script src='https://api.123test.com/its123api.polyfill.min.js'></script>
```
