---
layout: default
title: JS SDK - Full PDF example
---

# Full Example with PDF button

If you have access to PDF version of reports you can add a download link for your users. The code below describes how to show a button (with a link to the PDF report) after the test has finished.

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

<!-- Link will contain a href to the pdf -->
<a href="#" id="its123api-download-pdf" style="display: none">Download PDF</a>

<script type="text/javascript" id="its123-js">
  window.loadIts123Api=function(a,b){var c="undefined"!=typeof Promise&&Promise.toString().indexOf("[native code]")!==-1&&window.fetch,d=function(a,b){var c=document.createElement("script");c.type="text/javascript",c.src=a,c.onload=b;var d=document.getElementsByTagName("script")[0];d.parentNode.insertBefore(c,d)};c?d(a+"/its123api.min.js",b):d(a+"/its123api.polyfill.min.js",b)};

  loadIts123Api('https://api.123test.com', function () {
      var api = new Its123({
          apiKey: 'your-api-key'
      });

      api.loadProduct('vitaliteit-nl_nl-1').then(function(product) {

          var url = api.getPdfUrl(product, 'standard');
          var button = document.getElementById('its123api-download-pdf');
          button.href = url;
          button.style.display = 'block';
      });
  });
</script>

</body>
</html>
```
