'use strict';

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
 * An extension, is a function which will be added to any pool or connection instance created after the extension was added.
 *
 * @function
 * @memberof! Extensions
 * @public
 * @param {string} type - Either 'connection' or 'pool'
 * @param {string} name - The function name which will be added to the object
 * @param {function} extension - The function to be added
 * @returns {boolean} True if added, false if ignored
 */
Extensions.prototype.add = function (type, name, extension) {
    var added = false;
    if (type && ((type === 'pool') || (type === 'connection')) && name && (typeof name === 'string') && extension && (typeof extension === 'function')) {
        this.extensions[type][name] = extension;
        added = true;
    }

    return added;
};

/**
 * Returns all extensions for the requested typp (pool/connection)
 *
 * @function
 * @memberof! Extensions
 * @public
 * @param {string} type - Either 'connection' or 'pool'
 * @returns {object} All extensions defined as name:function
 */
Extensions.prototype.get = function (type) {
    var output;
    if (type && ((type === 'pool') || (type === 'connection'))) {
        output = this.extensions[type];
    }

    return output;
};

module.exports = new Extensions();
