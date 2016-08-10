# Setting up

123test offers a ready to use Javascript library to access the API. The library manages
everything from requesting products, displaying instruments and showing reports.

The library comes in two forms:

- A lightweight version that can be used by modern browsers which only includes code to access the API. This version can only be used in browsers that have native support for promises, fetch an modern objects. Roughly this applies to Firefox >= 39, Chrome >= 42, Opera > 29, Edge and modern versions of Chrome for Android. The minified version of this library is ~7kB.
- For older browsers we supply a compatibility version of the library which includes polyfills for promises and fetch. This library additionally supports Internet Explorer >= 9 and Safari. The minified version of this library is ~37kB.

The correct version of the library can be loaded automatically by using a small feature-detection loader. The loader inserts the correct version of the library into the DOM. If only a subset of browsers needs to be supported it is possible to manually select one of the libraries.

## Using the loader

```html
<script type='text/javascript'>
window.loadIts123Api=function(a,b){var c="undefined"!=typeof Promise&&Promise.toString().indexOf("[native code]")!==-1&&window.fetch,d=function(a,b){var c=document.createElement("script");c.type="text/javascript",c.src=a,c.onload=b;var d=document.getElementsByTagName("script")[0];d.parentNode.insertBefore(c,d)};c?d(a+"/its123api.min.js",b):d(a+"/its123api.polyfill.min.js",b)};
</script>
```
