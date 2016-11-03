---
layout: default
title: JS SDK - Full example
---

# Full Example

The code below is the minimal approach to loading a Jung test including report:

```html
<!DOCTYPE html>
<html>
<head>
    <title>123test API Example</title>
</head>
<body>

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

<script type="text/javascript" id="its123-js">
  window.loadIts123Api=function(a,b){var c="undefined"!=typeof Promise&&Promise.toString().indexOf("[native code]")!==-1&&window.fetch,d=function(a,b){var c=document.createElement("script");c.type="text/javascript",c.src=a,c.onload=b;var d=document.getElementsByTagName("script")[0];d.parentNode.insertBefore(c,d)};c?d(a+"/its123api.min.js",b):d(a+"/its123api.polyfill.min.js",b)};

  loadIts123Api('https://api.123test.com', function () {
      var api = new Its123({
          apiKey: 'your-api-key'
      });

      api.loadProduct('jung-en_us-1');
  });
</script>

</body>
</html>
```
