/**
 * Loader
 *
 * Loads resources required for the 123test API. For legacy browsers it downloads
 * a file which includes the necessary polyfills.
 *
 * @param  {String}   apiDomain The domain to query
 * @param  {Function} callback  Function to execute after load
 * @return {void}
 */
window.loadIts123Api = function (apiDomain, callback) {
    var modernBrowser = typeof Promise !== "undefined" && Promise.toString().indexOf("[native code]") !== -1 && window.fetch;
    var importScript = function (src, fn) {
        var oScript = document.createElement('script');
        oScript.type = 'text/javascript';
        oScript.src = src;
        oScript.onload = fn;
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(oScript, s);
    };
    if (!modernBrowser) {
        importScript(apiDomain + '/its123api.polyfill.min.js', callback);
    } else {
        importScript(apiDomain + '/its123api.min.js', callback);
    }
};
