'use strict';

const funcs = require('funcs-js');

/**
 * Promise utility class.
 *
 * @author Sagie Gur-Ari
 * @class PromiseHelper
 * @private
 */
function PromiseHelper() {
    this.extensions = {
        pool: {},
        connection: {}
    };
}

/**
 * Empty function.
 *
 * @function
 * @memberof! PromiseHelper
 * @private
 * @returns {undefined} Empty return
 */
PromiseHelper.prototype.noop = function () {
    return undefined;
};

/**
 * Returns true if the provided object supports the basic promise capabilities.
 *
 * @function
 * @memberof! PromiseHelper
 * @private
 * @param {Object} promise - The promise object to validate
 * @returns {Boolean} True if the provided object supports the basic promise capabilities
 */
PromiseHelper.prototype.isPromise = function (promise) {
    let valid = false;
    if (promise && promise.then && promise.catch && (typeof promise.then === 'function') && (typeof promise.catch === 'function')) {
        valid = true;
    }

    return valid;
};

/**
 * Ensures the provided function is invoked as an async function even if returning a promise.
 *
 * @function
 * @memberof! PromiseHelper
 * @private
 * @param {Object} func - The function to invoke
 * @param {function} callback - The callback to provide to the invoked function
 */
PromiseHelper.prototype.runAsync = function (func, callback) {
    callback = funcs.once(callback, {
        callbackStyle: true
    });

    const promise = func(callback);

    if (this.isPromise(promise)) {
        promise.then(function onDone(result) {
            callback(null, result);
        }).catch(callback);
    }
};

/**
 * Calls the provided function with a callback.
 *
 * @function
 * @memberof! PromiseHelper
 * @private
 * @param {function} run - The async function to call (callback will be provided)
 * @returns {Promise} In case of no callback provided in input, this function will return a promise
 */
PromiseHelper.prototype.runPromise = function (run) {
    let promise;
    let promiseCallback;

    if (global.Promise) {
        promise = new global.Promise(function runViaPromise(resolve, reject) {
            promiseCallback = function (error, output) {
                if (error) {
                    reject(error);
                } else {
                    resolve(output);
                }
            };

            run(promiseCallback);
        });
    } else {
        throw new Error('No callback provided and promise not supported.');
    }

    return promise;
};

/**
 * Calls the provided function with a callback and if needed, return a promise.
 *
 * @function
 * @memberof! PromiseHelper
 * @private
 * @param {function} run - The async function to call (callback will be provided)
 * @param {function} [callback] - An optional callback function
 * @param {Boolean} [force=false] - If true, do not check if promise is supported
 * @returns {Promise} In case of no callback provided in input, this function will return a promise
 * @example
 * ```js
 * promiseHelper.run(function myFunc(promiseCallback) {
 *   //do some async activity...
 * }, function onFuncDone(error, result) {
 *   if (error) {
 *     //function failed.
 *   } else {
 *     //function done
 *   }
 * });
 * ```
 */
PromiseHelper.prototype.run = function (run, callback, force) {
    //if promise requested and supported by current platform
    let promise;
    if ((force || global.Promise) && (!callback)) {
        promise = this.runPromise(run);
    } else {
        run(callback);
    }

    return promise;
};

/**
 * Adds promise support for the provided function.
 *
 * @function
 * @memberof! PromiseHelper
 * @private
 * @param {function} func - The function to promisify
 * @param {Object} [options] - Holds constious behaviour options
 * @param {Boolean} [options.force=false] - If true, do not check if promise is supported
 * @param {Boolean} [options.defaultCallback=false] - If true and no callback provided, generate an empty callback
 * @param {Number} [options.callbackMinIndex=0] - The minimum index in the arguments that the callback is found in
 * @returns {function} The wrapper function
 * @example
 * ```js
 * Connection.prototype.query = promiseHelper.promisify(Connection.prototype.query);
 * ```
 */
PromiseHelper.prototype.promisify = function (func, options) {
    //jscs:disable safeContextKeyword
    const promiseHelper = this;
    //jscs:enable safeContextKeyword

    options = options || {};

    return function promiseWrapper() {
        /*eslint-disable no-invalid-this*/
        const self = this;
        /*eslint-enable no-invalid-this*/

        const argumentsArray = Array.prototype.slice.call(arguments, 0);

        //if last element is callback but undefined was provided
        let continueRemove = true;
        do {
            if (argumentsArray.length && (argumentsArray[argumentsArray.length - 1] === undefined)) {
                argumentsArray.pop();
            } else {
                continueRemove = false;
            }
        } while (continueRemove);

        const minArgs = (options.callbackMinIndex || 0) + 1;

        let callback;
        let output;
        if ((argumentsArray.length >= minArgs) && (typeof argumentsArray[argumentsArray.length - 1] === 'function')) {
            output = func.apply(self, argumentsArray);
        } else { //promise
            if ((!options.force) && (!options.defaultCallback) && (!global.Promise)) {
                throw new Error('No callback provided and promise not supported.');
            }

            output = promiseHelper.run(function asyncFunction(promiseCallback) {
                callback = callback || promiseCallback;

                if ((!callback) && options.defaultCallback) {
                    callback = promiseHelper.noop;
                }

                argumentsArray.push(callback);

                func.apply(self, argumentsArray);
            }, callback, options.force);
        }

        return output;
    };
};

module.exports = new PromiseHelper();
