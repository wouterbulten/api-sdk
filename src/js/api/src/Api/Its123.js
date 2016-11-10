/*
 * 123Test Api v2
 *
 * @author Wouter Bulten <github.com/wouterbulten>
 * @author Theo den Hollander <github.com/theodenhollander>
 * @license
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 123test
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Default configuration for api, can be overriden by user
 * @type {Object}
 */
const defaultApiConfig = {
  // Domain config
  domain: 'https://api.123test.com',
  version: 'v2',

  // Environment config
  logErrors: false,
  environment: 'production',
  bugSnagApiKey: '',

  // DOM config
  elements: {
    instrumentFormSelector: 'form.its123-instrument',
    loadingElementId: 'its123api-loading',
    productElementId: 'its123api-product',
    reportElementId: 'its123api-report',
    loadingElement: null,
    productElement: null,
    reportElement: null,
  },

  apiKey: 'not-set',
};

/**
 * Main API class
 */
class Its123 {

  /**
   * Create new Api object
   * @param  {Object} [apiConfig={}] Api configuration
   * @return {void}
   */
  constructor(apiConfig = {}) {
    // Set api config to default and override with parameters
    this.api = {
      ...defaultApiConfig,
      ...apiConfig,
    };
    // Construct correct api end point
    this.api.endpoint = `${this.api.domain}/${this.api.version}`;
    // Set env based on domain
    this.api.environment =
      (this.api.domain === 'https://api.123test.dev') ? 'development' : 'production';

    // Check for valid api key
    if (this.api.apiKey === 'not-set') {
      throw new Error(
        'Api key must be set when initalising Its123 object. Please check your api config.'
      );
    }

    // Query the DOM and set options
    this.api.elements.loadingElement = document.getElementById(this.api.elements.loadingElementId);
    this.api.elements.productElement = document.getElementById(this.api.elements.productElementId);
    this.api.elements.reportElement = document.getElementById(this.api.elements.reportElementId);
    if (!this.api.elements.loadingElement
      || !this.api.elements.productElement || !this.api.elements.reportElement) {
      throw new Error(
        'Element for loading, product or report not found. Please check your HTML and Api config.'
      );
    }

    // Insert BugSnag error reporting
    if (this.api.logErrors) {
      this.insertLogScript();
    }

    // Placeholder for eventlisteners
    this.eventListeners = {};
  }

  /**
   * Load a product
   *
   * Runs all the required sub steps from instrument to report. All promises are chained
   * and the final promise returns the product data when resolved.
   *
   * Will automatically render the first report that is available. Set `renderReport` to false
   * to counter this behaviour.
   *
   * Data structure of the product object:
   *
   * product = {
   *  slots: {
   *    instruments: [],
   *    respondent: {},
   *  },
   *  reports: [],
   *  access_code: null,
   * };
   *
   * @param  {String} productId product to load
   * @param  {Boolean} [renderReport=true] Set to true to automatically call the
   *                                       report render functions
   * @param  {Boolean} [storage=true]      Set to true to try loading product data
   *                                       from local storage.
   * @param  {String}  [user=''] Optional user UUID
   * @return {Promise}
   */
  loadProduct(productId, { renderReport = true, storage = true, user = '' } = {}) {
    let product = {};
    let promise;

    if (storage) {
      // Try to load product information from local storage, if it fails
      // fall back to a API request
      promise = this.loadFromStorage(productId, user)
        .catch(() => this.requestProduct(productId, user)
          // Store the requested product in the local store for future requests
          .then((p) => {
            this.storeInStorage(productId, p, user);
            return p;
          })
        );
    } else {
      promise = this.requestProduct(productId, user);
    }

    promise = promise.then((p) => {
      product = p;
      let instruments = product.slots.instruments;
      this.triggerEvent('instruments-loaded', instruments);

      if (storage) {
        // Filter any instruments that already have been completed
        // Prevents unnecessary requests to the API
        instruments = instruments.filter((i => {
          const status = this.getInstrumentStatusFromStorage(i.access_code);

          switch (status) {
            case 'ended-items':
            case 'ended-skipped':
            case 'ended-time':
              this.triggerEvent('instrument-already-completed',
                { accessCode: i.access_code, status });
              return false;
            case 'in-progress':
              this.triggerEvent('instrument-continue',
                { accessCode: i.access_code, status });
              return true;
            case 'started':
            default:
              return true;
          }
        }));
      }

      // Run all instruments in series
      // 'reduce' is used as a special construct to map a list of instruments
      // to a chain of promises that resolve in series. The chain is fired by
      // setting a 'Promise.resolve()' as the initial value.
      return instruments.reduce((previousStep, { access_code: accessCode }) => (
        previousStep
          .then(() => this.requestInstrument(accessCode))
          .then((result) => {
            this.triggerEvent('instrument-started', { accessCode, status: result.status });
            return this.processApiInstrumentResponse(accessCode, result);
          })
      ), Promise.resolve());
    });

    if (renderReport) {
      // All instruments have been completed, render report
      promise = promise.then(() => this.loadReport(product.reports[0].access_code));
    }

    // Return initial promise and make sure that returning the product is the last step in the chain
    return promise
      // Remove this session from the local storage
      .then(() => this.clearStorage(productId, product.slots.instruments))
      // Trigger event and pass product info
      .then(() => this.triggerEvent('product-completed', product))
      .then(() => product)
      // Also add a catch, this removes the need of having individual catches for every fetch
      .catch((e) => {
        if (storage) {
          // Something could be wrong with our local store,
          // clear it to prevent any future errors
          this.clearStorage(productId);
        }
        return this.handleException(e);
      });
  }

  /**
  /**
   * Load an render a report by its access code
   * @param  {String} accessCode Access code for report
   * @param  {String} metaData  Base64 encoded meta data
   * @param  {String} metaHmac  HMAC for meta data
   * @return {Promise}
   */
  loadReport(accessCode, { metaData, metaHmac } = {}) {
    return this.requestReport(accessCode, { metaData, metaHmac })
      .then((body) => this.renderReport(body))
      .then(() => this.triggerEvent('report-ready'));
  }

  /**
   * Process a single API response from an instrument call
   *
   * When the instrument is still running the function will return a new Promise
   * that waits for a form submit.
   *
   * @param  {String} accessCode Access code for this instrument
   * @param  {String} status     Current instrument status
   * @param  {Array} resources  Resources to load
   * @param  {String} body       Html to put in the DOM
   * @return {Promise}
   */
  processApiInstrumentResponse(accessCode, { status, resources, body }) {
    switch (status) {
      case 'started':
      case 'in-progress':
        this.updateInstrumentInStorage(accessCode, status);
        return this.loadResources(resources)
          .then(() => this.renderInstrument(body))
          .then(() => this.runResourceFunctions(resources))
          .then(() => this.waitForInstrumentToSubmit())
          .then(({ form }) => this.submitInstrumentData(accessCode, form))
          // Run function again until instrument has ended
          .then((result) => this.processApiInstrumentResponse(accessCode, result));
      case 'ended-items':
      case 'ended-skipped':
      case 'ended-time':
        this.updateInstrumentInStorage(accessCode, status);
        this.triggerEvent('instrument-completed', { accessCode, status });
        return Promise.resolve();
      default:
        throw new Error(`Unexpected instrument status ${status}`);
    }
  }

  /**
   * (Async) Request a product from the api
   *
   * Promise returns an object contains all the instruments
   * @param  {String} productId      ID of the product
   * @param  {String} user UUID v4
   * @return {Promise}
   */
  requestProduct(productId, user) {
    const headers = {
      'Content-Type': 'application/json',
      'X-123test-ApiKey': this.api.apiKey,
      'X-123test-ProductId': productId,
    };

    if (user && user.length === 36) {
      headers['X-123test-Respondent'] = user;
    }

    return fetch(`${this.api.endpoint}/product/request-product`, {
      method: 'GET',
      mode: 'cors',
      headers,
    })
    .then((response) => response.json())
    .then((json) => ({
      slots: json.slots,
      reports: json.reports,
      product_access_code: json.product_access_code,
    }));
  }

  /**
   * Get information about a specific product running
   * @param  {String} accessCode Access code for product run
   * @return {Promise}
   */
  requestProductInfo(accessCode) {
    const headers = {
      'Content-Type': 'application/json',
      'X-123test-ApiKey': this.api.apiKey,
    };

    return fetch(`${this.api.endpoint}/product/${accessCode}/overview`, {
      method: 'GET',
      mode: 'cors',
      headers,
    })
    .then((response) => response.json())
    .then((json) => ({
      slots: json.slots,
      reports: json.reports,
      product_access_code: json.product_access_code,
    }));
  }

  /**
   * (Async) Request an instrument from the api
   *
   * Promise returns body and resources that need to be loaded
   * @param  {String} accessCode Access code for the instrument
   * @return {Promise}
   */
  requestInstrument(accessCode) {
    return fetch(`${this.api.endpoint}/instrument/next-items`, {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'X-123test-ApiKey': this.api.apiKey,
        'X-123test-InstrumentRun': accessCode,
      },
    })
    // reponse.text() returns a Promise so we add an extra closure here
    // to also access the resource variable itself
    .then((response) => response.text()
      .then((body) => ({
        body,
        status: response.headers.get('X-123test-InstrumentStatus'),
        resources: JSON.parse(response.headers.get('X-123test-Resources')),
      }))
    );
  }

  /**
   * Attach a listener to the instrument, makes use of a promise that resolves
   * when the button is clicked.
   * @return {Promise}
   */
  waitForInstrumentToSubmit() {
    const form = document.querySelector(this.api.elements.instrumentFormSelector);

    // Return a new promise that resolves when the submit button is clicked
    return new Promise((resolve) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();

        // Disable all buttons in the form
        const buttons = event.target.getElementsByTagName('button');
        for (let b = 0; b < buttons.length; b++) {
          buttons[b].disabled = true;
        }
        resolve({ form, event });
      });
    });
  }

  /**
   * Submit a form to the API for a given instrument
   * @param  {String} accessCode Access code of the instrument
   * @param  {Object} form       HTML Form
   * @return {Promise}
   */
  submitInstrumentData(accessCode, form) {
    return fetch(`${this.api.endpoint}/instrument/next-items`, {
      method: 'POST',
      cache: 'no-cache',
      body: new FormData(form),
      headers: {
        'X-123test-ApiKey': this.api.apiKey,
        'X-123test-InstrumentRun': accessCode,
      },
    })
    .then((response) => response.text()
      .then((body) => ({
        body,
        status: response.headers.get('X-123test-InstrumentStatus'),
        resources: JSON.parse(response.headers.get('X-123test-Resources')),
      }))
    );
  }

  /**
   * Output an instrument to the DOM
   * @param  {String} body Instrument HTML
   * @return {void}
   */
  renderInstrument(body) {
    this.api.elements.productElement.innerHTML = body;
    this.api.elements.loadingElement.style.display = 'none';
    this.api.elements.productElement.style.display = 'initial';
  }

  /**
   * Render a report to the DOM
   *
   * @param  {String} body report body
   * @return {Promise}
   */
  renderReport(body) {
    this.api.elements.productElement.style.display = 'none';
    this.api.elements.loadingElement.style.display = 'none';
    this.api.elements.reportElement.innerHTML = body;
    this.api.elements.reportElement.style.display = 'initial';
  }

  /**
   * Add new resources to the DOM
   *
   * Returns a new Promise that resolves when all critical assets have been loaded
   * @param  {Object} resources The resources to load
   * @return {void}
   */
  loadResources(resources) {
    // Map each resource to a new Promise
    // JS resources resolve when loaded
    return Promise.all(Object.keys(resources).map((key) => (
      new Promise((resolve, reject) => {
        const resourceItem = resources[key];
        const head = document.getElementsByTagName('head')[0];

        // Do not load resources that are already present
        if (document.querySelectorAll(`script[src="${resourceItem.path}"]`).length > 0) {
          resolve();
          return;
        }
        switch (resourceItem.type) {
          case 'js': {
            const script = document.createElement('script');
            script.src = resourceItem.path;
            // Allow some files to not load asynchronous
            script.async = resourceItem.async || false;
            // Resolve when loaded
            script.onload = resolve;
            // Append to the head of the page
            head.appendChild(script);
          }
            break;
          case 'css': {
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.type = 'text/css';
            cssLink.media = 'all';
            cssLink.href = resourceItem.path;
            // Append to the head of the page
            head.appendChild(cssLink);

            // Directy resolve css, not critical
            resolve();
          }
            break;
          default:
            reject(`Unknown resource type ${resourceItem.type}`);
        }
      })
    )));
  }

  /**
   * Run functions for a list of JS resources
   * @param  {Object} resources
   * @return {void}
   */
  runResourceFunctions(resources) {
    Object.keys(resources).forEach((key) => {
      const resource = resources[key];
      if (resource.type === 'js'
        && typeof window.its123[resource.func] === 'function') {
        // Give context as variable
        window.its123[resource.func](this.api);
      }
    });
  }

  /**
   * Request a report by its access code
   * @param  {String} accessCode access code for the report
   * @param  {String} metaData  Base64 encoded meta data
   * @param  {String} metaHmac  HMAC for meta data
   * @return {Promise}
   */
  requestReport(accessCode, { metaData = '', metaHmac = '' } = {}) {
    let url;
    if (metaData.length <= 0 || metaHmac.length <= 0) {
      url = `${this.api.endpoint}/report/${accessCode}`;
    } else {
      url = `${this.api.endpoint}/report/${accessCode}?meta=${metaData}&meta_hmac=${metaHmac}`;
    }

    return fetch(url, {
      headers: {
        'X-123test-ApiKey': this.api.apiKey,
      },
      method: 'GET',
      mode: 'cors',
    })
      .then((response) => this.checkReponseStatus(response))
      .then((response) => response.text());
  }

  /**
   * Validate API response
   * @param  {Object} response Response object
   * @return {Object}
   */
  checkReponseStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      return response;
    }

    const error = new Error(`${response.statusText} ${response.url}`);
    error.response = response;
    throw error;
  }

  /**
   * Store a product in the local storage
   * @param  {String} productId Id of the product
   * @param  {object} product   Product information
   * @param  {String} user      User UUID
   * @return {void}
   */
  storeInStorage(productId, product, user) {
    const store = window.localStorage;

    // Check browser support
    if (!store) {
      return;
    }

    // Add new record
    const productData = {
      ...product,
      user,
      started: Date.now(),
    };

    store.setItem(`its123Api-${productId}`, JSON.stringify(productData));
  }

  /**
   * Load a product from the storage
   *
   * Returns a promise that resolves when a local storage item has been found.
   * @param  {String} productId             Product id
   * @param  {String} [user='']             User UUID
   * @param  {Number} [expirationTime=3600] Max lifetime of storage entry in seconds
   * @return {Promise}
   */
  loadFromStorage(productId, user = '', expirationTime = 3600) {
    return new Promise((resolve, reject) => {
      const store = window.localStorage;
      const item = `its123Api-${productId}`;

      // Check browser support and presence of object
      if (!store || !store.getItem(item)) {
        reject('No support or storage present');
      }

      const product = JSON.parse(store.getItem(item));

      if (product && (product.started + (expirationTime * 1000)) > Date.now()
        && product.user === user) {
        console.info('Loading instrument from local storage.');
        resolve(product);
      }

      reject('No product in local store');
    });
  }

  /**
   * Clear the local storage of all items
   * @return {void}
   */
  clearStorage(productId, instruments = []) {
    const store = window.localStorage;

    if (!store) {
      return;
    }

    store.removeItem(`its123Api-${productId}`);
    instruments.forEach(i => store.removeItem(`its123Api-${i.access_code}`));
  }

  /**
   * Set the current state of an instrument in storage
   * @param  {String} accessCode Access code for instrument
   * @param  {String} status     Status indicator
   * @return {void}
   */
  updateInstrumentInStorage(accessCode, status) {
    const store = window.localStorage;

    if (!store) {
      return;
    }

    store.setItem(`its123Api-${accessCode}`, status);
  }

  /**
   * Get status of an instrument from storage
   * @param  {String} accessCode Access code for instrument
   * @return {String|null} Status
   */
  getInstrumentStatusFromStorage(accessCode) {
    const store = window.localStorage;

    if (!store) {
      return null;
    }

    return store.getItem(`its123Api-${accessCode}`);
  }

  /**
   * Log an exception and retrow
   * @param  {Object} e The error
   * @return {Object}   the error
   */
  handleException(e) {
    if (this.api.logErrors) {
      if (typeof Bugsnag === 'function') {
        Bugsnag.notifyException(e, 'API its123api');
      }
    }
    throw e;
  }

  /**
   * Insert a log script in to the dom
   * @return void
   */
  insertLogScript() {
    const head = document.getElementsByTagName('head')[0];
    const script = document.createElement('script');
    script.src = `${this.api.domain}/logIts123.js`;
    script.onload = () => {
      /* global Bugsnag */
      Bugsnag.apiKey = this.api.bugSnagApiKey;
      Bugsnag.releaseStage = this.api.environment;
    };
    head.appendChild(script);
  }

  /**
   * Utility function to get the url to a PDF report for a given product object
   * @param  {Object} product               The product that contains the report list
   * @param  {String} [typeName='standard'] Can be 'standard' or 'premium'
   * @return {String}                       Url to the report
   */
  getPdfUrl(product, typeName = 'standard') {
    // Get correct type id for premium or standard pdf
    const type = (typeName === 'premium') ? 221 : 121;
    const report = product.reports.find((r) => r.type === type);

    if (!report) {
      throw new Error('No access code for pdf is present in product object.');
    }

    return `${this.api.endpoint}/report/${report.access_code}`;
  }

  /**
   * Send a new event to the listeners
   * @param  {String} eventName Name of the event
   * @param  {Object} data      Optional event data
   * @return {void}
   */
  triggerEvent(eventName, data) {
    const listeners = this.eventListeners[eventName];

    if (listeners && listeners.length > 0) {
      listeners.forEach((l) => l(data));
    }

    if (this.api.environment === 'development') {
      console.info(`Event triggered: ${eventName}`);
    }
  }

  /**
   * Register a new event listener
   * @param  {String}   eventName Name of the event
   * @param  {Function} callback
   * @return {void}
   */
  on(eventName, callback) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }

    this.eventListeners[eventName].push(callback);
  }
}

export default Its123;
