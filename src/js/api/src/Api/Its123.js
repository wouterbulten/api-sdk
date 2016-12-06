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

import 'regenerator-runtime/runtime';

import request from '../util/request';

import { tryAtMost } from '../util/promise';

import ClientStorage from '../util/storage';

/**
 * Default configuration for api, can be overriden by user
 * @type {Object}
 */
const defaultApiConfig = {
  // Domain config
  domain: 'https://api.123test.com',
  version: 'v2',

  // Environment config
  logErrors: true,
  environment: 'production',

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

  // Number of retries some fetch request may make
  maxHttpRetries: 2,
  // Initial delay before a retry
  retryDelay: 5000,
  // Number of times a user can try to resubmit a form
  maxSubmitRetries: 10,

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
        'Api key must be set when initalising Its123 object. Please check your api config.',
      );
    }

    // Query the DOM and set options
    this.api.elements.loadingElement = document.getElementById(this.api.elements.loadingElementId);
    this.api.elements.productElement = document.getElementById(this.api.elements.productElementId);
    this.api.elements.reportElement = document.getElementById(this.api.elements.reportElementId);
    if (!this.api.elements.loadingElement
      || !this.api.elements.productElement || !this.api.elements.reportElement) {
      throw new Error(
        'Element for loading, product or report not found. Please check your HTML and Api config.',
      );
    }

    // Placeholder for eventlisteners
    this.eventListeners = {};

    // Create new storage object for localStorage functionality
    this.store = new ClientStorage();
  }

  /**
   * Wrapper around loadAndRunProduct with error handling
   *
   * @param  {String} productId product to load
   * @param  {Object} [config={}] Product configuration, see loadAndRunProduct
   * @return {Promise}
   * @see loadAndRunProduct()
   */
  async loadProduct(productId, { renderReport = true, storage = true, user = '' } = {}) {
    try {
      return await this.loadAndRunProduct(productId, { renderReport, storage, user });
    } catch (error) {
      if (storage) {
        // Something could be wrong with our local store,
        // clear it to prevent any future errors
        this.store.clearProduct(productId);
      }
      this.handleException(error);
    }

    return {};
  }

  /**
   * Load and run a product
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
  async loadAndRunProduct(productId, { renderReport = true, storage = true, user = '' } = {}) {
    let product = null;

    // Show loading div
    this.api.elements.productElement.style.display = 'none';
    this.api.elements.loadingElement.style.display = 'block';

    if (storage) {
      // Try to load product information from local storage, if it fails
      // fall back to a API request
      product = this.store.loadProduct(productId, user);

      if (!product) {
        product = await this.requestProduct(productId, user);
        // Store the requested product in the local store for future requests
        this.store.saveProduct(productId, product, user);
      }
    } else {
      product = this.requestProduct(productId, user);
    }

    let instruments = product.slots.instruments;
    this.triggerEvent('instruments-loaded', instruments);

    if (storage) {
      // Filter any instruments that already have been completed
      // Prevents unnecessary requests to the API
      instruments = instruments.filter((i) => {
        const status = this.store.loadInstrumentStatus(i.access_code);

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
      });
    }

    for (let i = 0; i < instruments.length; i += 1) {
      const accessCode = instruments[i].access_code;

      const result = await this.requestInstrument(accessCode);
      this.triggerEvent('instrument-started', { accessCode, status: result.status });
      await this.processApiInstrumentResponse(accessCode, result, storage);
    }


    if (renderReport) {
      // All instruments have been completed, render report
      await this.loadReport(product.reports[0].access_code);
    }

    // Remove this session from the local storage
    this.store.clearProduct(productId);
    // Trigger event and pass product info
    this.triggerEvent('product-completed', product);

    return product;
  }

  /**
  /**
   * Load an render a report by its access code
   * @param  {String} accessCode Access code for report
   * @param  {String} metaData  Base64 encoded meta data
   * @param  {String} metaHmac  HMAC for meta data
   * @return {Promise}
   */
  async loadReport(accessCode, { metaData, metaHmac } = {}) {
    const body = await this.requestReport(accessCode, { metaData, metaHmac });

    this.renderReport(body);
    this.triggerEvent('report-ready');
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
   * @param  {Boolean} storage   Whether to load instrument input data from local storage
   * @return {Promise}
   */
  async processApiInstrumentResponse(accessCode, { status, resources, body }, storage) {
    switch (status) {
      case 'started':
      case 'in-progress': // eslint-disable-line no-case-declarations
        this.store.saveInstrumentStatus(accessCode, status);

        // Wait for resources to load
        await Its123.loadResources(resources);

        this.renderInstrument(body);

        // Try to load item data from local storage when enabled
        if (storage) {
          this.loadInstrumentStateFromStorage(accessCode);
          this.bindInstrumentStorageListeners(accessCode);
        }

        this.runResourceFunctions(resources);

        let lastError = null;
        for (let i = 0; i < this.api.maxSubmitRetries; i += 1) {
          const { form } = await this.waitForInstrumentToSubmit();

          try {
            const result = await tryAtMost(this.api.maxHttpRetries, this.api.retryDelay, () =>
              this.submitInstrumentData(accessCode, form),
            );
            // Run function again until instrument has ended
            return await this.processApiInstrumentResponse(accessCode, result);
          } catch (error) {
            this.triggerEvent('instrument-submit-failed', null, 'error');

            // Save error for later, we first let the user retry
            lastError = error;
          }
        }
        // Failed after max attempts, throw last error
        throw lastError;

      case 'ended-items':
      case 'ended-skipped':
      case 'ended-time':
        this.store.saveInstrumentStatus(accessCode, status);
        this.triggerEvent('instrument-completed', { accessCode, status });
        break;
      default:
        throw new Error(`Unexpected instrument status ${status}`);
    }

    return {};
  }

  /**
   * (Async) Request a product from the api
   *
   * Promise returns an object contains all the instruments
   * @param  {String} productId      ID of the product
   * @param  {String} user UUID v4
   * @return {Promise}
   */
  async requestProduct(productId, user) {
    const headers = {
      'Content-Type': 'application/json',
      'X-123test-ApiKey': this.api.apiKey,
      'X-123test-ProductId': productId,
    };

    if (user && user.length === 36) {
      headers['X-123test-Respondent'] = user;
    }

    try {
      const response = await request(`${this.api.endpoint}/product/request-product`, {
        method: 'GET',
        mode: 'cors',
        headers,
      });

      const json = await response.json();
      return {
        slots: json.slots,
        reports: json.reports,
        product_access_code: json.product_access_code,
      };
    } catch (error) {
      switch (error.status) {
        case 401:
          this.triggerEvent('invalid-api-key', error.response, 'error');
          break;
        case 403:
          this.triggerEvent('product-no-access', error.response, 'error');
          break;
        default:
          // Do nothing
      }

      throw Error;
    }
  }

  /**
   * Get information about a specific product running
   * @param  {String} accessCode Access code for product run
   * @return {Promise}
   */
  async requestProductInfo(accessCode) {
    const headers = {
      'Content-Type': 'application/json',
      'X-123test-ApiKey': this.api.apiKey,
    };

    const response = await request(`${this.api.endpoint}/product/${accessCode}/overview`, {
      method: 'GET',
      mode: 'cors',
      headers,
    });

    const json = await response.json();

    return {
      slots: json.slots,
      reports: json.reports,
      product_access_code: json.product_access_code,
    };
  }

  /**
   * (Async) Request an instrument from the api
   *
   * Promise returns body and resources that need to be loaded
   * @param  {String} accessCode Access code for the instrument
   * @return {Promise}
   */
  async requestInstrument(accessCode) {
    const response = await request(`${this.api.endpoint}/instrument/next-items`, {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'X-123test-ApiKey': this.api.apiKey,
        'X-123test-InstrumentRun': accessCode,
      },
    });

    const body = await response.text();
    return {
      body,
      status: response.headers.get('X-123test-InstrumentStatus'),
      resources: JSON.parse(response.headers.get('X-123test-Resources')),
    };
  }

  /**
   * Attach a listener to the instrument, makes use of a promise that resolves
   * when the button is clicked.
   * @return {Promise}
   */
  waitForInstrumentToSubmit() {
    const className = 'its123-disabled-loading';
    const loadingIcon = '<div class="its123-loading-spinner"><div></div><div></div><div></div></div>';
    const form = document.querySelector(this.api.elements.instrumentFormSelector);
    const button = form.querySelector('button[type=submit]');

    // Re-enable button if it was previously disabled by this function
    if (button.classList.contains(className)) {
      button.disabled = false;
      button.innerHTML = (button.getAttribute('data-label')) ?
        button.getAttribute('data-label') : button.innerText;
      button.classList.remove(className);
    }

    // Return a new promise that resolves when the submit button is clicked
    return new Promise((resolve) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();

        // Disable submit button and add class so that we know that
        // the api js disabled the button (and not individual instrument js)
        button.disabled = true;
        button.classList.add(className);
        // Save content to an attribute to reset it later
        if (!button.getAttribute('data-label')) {
          button.setAttribute('data-label', button.innerText);
        }
        button.innerHTML = loadingIcon;

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
  async submitInstrumentData(accessCode, form) {
    this.triggerEvent('instrument-submitting', accessCode);

    const response = await request(`${this.api.endpoint}/instrument/next-items`, {
      method: 'POST',
      cache: 'no-cache',
      body: new FormData(form),
      headers: {
        'X-123test-ApiKey': this.api.apiKey,
        'X-123test-InstrumentRun': accessCode,
      },
    });

    const body = await response.text();

    return {
      body,
      status: response.headers.get('X-123test-InstrumentStatus'),
      resources: JSON.parse(response.headers.get('X-123test-Resources')),
    };
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
   * Add event listeners to radio buttons in instruments
   * @param  {String} accessCode Access code of the instrument
   * @return {null}
   */
  bindInstrumentStorageListeners(accessCode) {
    const elements = this.api.elements.productElement.getElementsByTagName('input');

    for (let e = 0; e < elements.length; e += 1) {
      const input = elements[e];

      if (input.type === 'radio') {
        input.addEventListener('change', () => {
          this.store.set(`${accessCode}-${input.name}`, input.value);
        });
      }
    }
  }

  /**
   * Apply stored instrument state to the DOM
   * @param  {String} accessCode Access code of instrument
   * @return {null}
   */
  loadInstrumentStateFromStorage(accessCode) {
    const elements = this.api.elements.productElement.getElementsByTagName('input');

    let loaded = false;
    for (let e = 0; e < elements.length; e += 1) {
      const input = elements[e];
      const value = this.store.get(`${accessCode}-${input.name}`);

      if (value !== null && input.type === 'radio' && input.value === value) {
        input.checked = true;
        loaded = true;
      }
    }

    if (loaded) {
      this.triggerEvent('instrument-item-data-loaded', { access_code: accessCode });
    }
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
  static loadResources(resources) {
    // Map each resource to a new Promise
    // JS resources resolve when loaded
    return Promise.all(Object.keys(resources).map(key => (
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
  async requestReport(accessCode, { metaData = '', metaHmac = '' } = {}) {
    let url;
    if (metaData.length <= 0 || metaHmac.length <= 0) {
      url = `${this.api.endpoint}/report/${accessCode}`;
    } else {
      url = `${this.api.endpoint}/report/${accessCode}?meta=${metaData}&meta_hmac=${metaHmac}`;
    }

    const response = await request(url, {
      headers: {
        'X-123test-ApiKey': this.api.apiKey,
      },
      method: 'GET',
      mode: 'cors',
    });

    return await response.text();
  }

  /**
   * Log an exception and retrow
   * @param  {Object} e The error
   * @return null
   */
  handleException(e) {
    if (this.api.logErrors) {
      switch (e.status) {
        case 401:
        case 403:
          console.error(`123test API Permission error: ${e.message} (${e.status})`);
          break;
        case 404:
          console.error(`123test API Product error: ${e.message} (${e.status})`);
          break;
        case 408:
          console.error('123test API Server error: API is unavailable');
          this.triggerEvent('api-unavailable', e, 'error');
          break;
        case 500:
          console.error(`123test API Server error: ${e.message} (${e.status})`);
          break;
        default:
          // Unknown error
          throw e;
      }
    }

    // Trigger that a unhandled exception has occurred
    this.triggerEvent('error', e, 'error');
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
    const report = product.reports.find(r => r.type === type);

    if (!report) {
      throw new Error('No access code for pdf is present in product object.');
    }

    return `${this.api.endpoint}/report/${report.access_code}`;
  }

  /**
   * Send a new event to the listeners
   * @param  {String} eventName Name of the event
   * @param  {Object} data      Optional event data
   * @param  {String} type      Event type
   * @return {void}
   */
  triggerEvent(eventName, data, type = 'info') {
    const listeners = this.eventListeners[eventName];

    if (listeners && listeners.length > 0) {
      listeners.forEach(l => l(data));
    }

    if (this.api.environment === 'development') {
      switch (type) {
        case 'error':
          console.error(`Event triggered: ${eventName}`);
          break;
        case 'info':
        default:
          console.info(`Event triggered: ${eventName}`);
      }
    }
  }

  /**
   * Register a new event listener
   * @param  {String|Array}   eventName Name of the event
   * @param  {Function} callback
   * @return {void}
   */
  on(eventName, callback) {
    let events = [];

    if (Array.isArray(eventName)) {
      events = eventName;
    } else {
      events.push(eventName);
    }

    events.forEach((event) => {
      if (!this.eventListeners[event]) {
        this.eventListeners[event] = [];
      }

      this.eventListeners[event].push(callback);
    });
  }
}

export default Its123;
