---
layout: default
title: JS SDK - Events
---

# Events

The 123test API library uses events to signal important parts of the test process. Event listeners can be attached to extend the behaviour of the API.

**Note:** All actions the library performs are part of a Promise chain. So, technically, it is possible to extend this chain and add additional steps which makes the event system redundant. Nonetheless, events are easier to use and do not force you to replicate the whole chain. For most uses cases we recommend using the event system.

## List of events

| Event name                   | Description                                                                                                                                                               | Data                     |
|------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------|
| instruments-loaded           | Fired when instrument data has been loaded. Data is retrieved from a API request or from localStorage.                                                                    | List of instruments      |
| instrument-started           | Fired when a single instrument is started. Just before loading the instrument in to the DOM.                                                                              | `{ accessCode, status }` |
| instrument-completed         | Fired when a respondent completes an instrument.                                                                                                                          | `{ accessCode, status }` |
| instrument-already-completed | The current instrument was already completed in a previous session. Continues to next instrument or ends the test. Occurs normally on a reload with localStorage enabled. | `{ accessCode, status }` |
| instrument-continue          | The current instrument was started but not completed yet. Continues at the last saved position in the test.                                                               | `{ accessCode, status }` |
| product-completed            | Fired when all instruments have been completed.                                                                                                                           | Product data             |
| report-ready                 | Fired when the report is loaded in to the DOM.                                                                                                                            | -                        |

## Example

```js

var api = new Its123({
    apiKey: 'api-key'
});

/*
Example event:
 */
api.on('instrument-completed', function(data) {
    alert('Instrument ' + data.accessCode + ' loaded with status: ' + data.status);
});

```
