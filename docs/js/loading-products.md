> Make sure to read the [Setting Up](loading-product.md) and [HTML structure](html-structure.md) guide first before you follow the guide below.

# Loading a product

The library offers a convenience function `loadProduct` that does all the heavy lifting regarding loading instruments and reports. This function will be applicable to most use cases and makes using the 123test API very easy.

To start a new product run, call the function and pass the required product name:

```js
var api = new Its123({
    apiKey: 'your-api-key'

    ... optional other configuration ...
});

api.loadProduct('jung-en_us-1');
```

After calling `loadProduct` the user is guided through the whole process (all instruments linked to the product and showing the report).

## Accessing product information

The `loadProduct` function returns a Promise which, when resolved, returns a plain JS object that contains information about the product run. The structure of the returned object is as follows:

```js
product = {
  slots: {
    instruments: [ /* list of instruments with access codes */ ],
    respondent: { /* unique respondent id */ },
  },
  reports: [ /* list of reports with access codes */ ],
  access_code: 'access code for current run',
};
```

Access codes for reports can be used to access them later. A report access code always grants access to that specific report.

```js
...

api.loadProduct('jung-en_us-1').then(function(product) {
  // Output product info to the console
  console.log(product);
});
```

## Not showing the report / showing a different version

To not show a report (or do this manually) pass an additional parameter to the `loadProduct` function:

```js
...

api.loadProduct('jung-en_us-1', false).then(function(product) {
  //Reports are not shown, you can do this here manually
  //...
});
```

### Example: Manually showing a report

```js
...

api.loadProduct('jung-en_us-1', false).then(function(product) {

  // Get the access code for a specific report
  var report = product.reports[0].access_code;

  return api.requestReport(report))
    .then(function(body) {
      // Do something with report body
    });
});
```
