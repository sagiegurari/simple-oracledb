'use strict';

var promiseHelper = require('./promise-helper');

/**
 * Holds all extensions of the pool/connection objects.
 *
 * @author Sagie Gur-Ari
 * @class Extensions
 * @private
 */
function Extensions() {
    this.extensions = {
        pool: {},
        connection: {}
    };
}

/**
 * Adds an extension to all newly created objects of the requested type.<br>
 * An extension, is a function which will be added to any pool or connection instance created after the extension was added.<br>
 * Extension functions automatically get promisified unless specified differently in the optional options.
 *
 * @function
 * @memberof! Extensions
 * @public
 * @param {String} type - Either 'connection' or 'pool'
 * @param {String} name - The function name which will be added to the object
 * @param {function} extension - The function to be added
 * @param {Object} [options] - Any extension options needed
 * @param {Object} [options.promise] - Promise options
 * @param {Boolean} [options.promise.noPromise=false] - If true, do not promisify function
 * @param {Boolean} [options.promise.force=false] - If true, do not check if promise is supported
 * @param {Boolean} [options.promise.defaultCallback=false] - If true and no callback provided, generate an empty callback
 * @param {Number} [options.promise.callbackMinIndex=0] - The minimum index in the arguments that the callback is found in
 * @returns {Boolean} True if added, false if ignored
 */
Extensions.prototype.add = function (type, name, extension, options) {
    var added = false;
    if (type && ((type === 'pool') || (type === 'connection')) && name && (typeof name === 'string') && extension && (typeof extension === 'function')) {
        this.extensions[type][name] = extension;
        added = true;

        options = options || {};
        options.promise = options.promise || {};

        if (!options.promise.noPromise) {
            //add promise support
            this.extensions[type][name] = promiseHelper.promisify(extension, options.promise);
        }
    }

    return added;
};

/**
 * Returns all extensions for the requested typp (pool/connection)
 *
 * @function
 * @memberof! Extensions
 * @public
 * @param {String} type - Either 'connection' or 'pool'
 * @returns {Object} All extensions defined as name:function
 */
Extensions.prototype.get = function (type) {
    var output;
    if (type && ((type === 'pool') || (type === 'connection'))) {
        output = this.extensions[type];
    }

    return output;
};

module.exports = new Extensions();
