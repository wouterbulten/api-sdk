// Bind store
const store = window.localStorage;

// Test local storage support
// Adapted from https://github.com/Modernizr/Modernizr
const storeAvailable = (() => {
  const testItem = 'test';
  try {
    store.setItem(testItem, testItem);
    store.removeItem(testItem);
    return true;
  } catch (e) {
    return false;
  }
})();

/**
 * Save an item to storage
 * @param  {String} id   identifier
 * @param  {mixed} item Value to store
 * @return {null}
 */
export function saveToStorage(id, item) {
  if (!storeAvailable) {
    return;
  }

  store.setItem(id, item);
}

/**
 * Retrieve an item from storage
 * @param  {String} id Storage identifier
 * @return {mixed}    The value
 */
export function getFromStorage(id) {
  if (!storeAvailable) {
    return null;
  }

  return store.getItem(id);
}

/**
 * Remove item from storage
 * @param  {String} id Storage identifier
 * @return {null}
 */
export function removeFromStorage(id) {
  if (!storeAvailable) {
    return;
  }

  store.removeItem(id);
}

/**
 * Remove all local storage elements that start with a given prefix
 * @param  {String} prefix Prefix to search for
 * @return {null}
 */
export function removeFromStorageByPrefix(prefix) {
  if (!storeAvailable) {
    return;
  }

  for (let i = store.length - 1; i >= 0; i--) {
    if (store.key(i).startsWith(prefix)) {
      store.removeItem(store.key(i));
    }
  }
}
