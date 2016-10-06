'use strict';

var events = require('events');
var EventEmitter = events.EventEmitter;

/**
 * Extends the provided object with event emitter capabilities.
 *
 * @function
 * @memberof! Emitter
 * @private
 * @param {Object} object - The object to extend
 */
module.exports = function extend(object) {
    if (object && (!object.emit) && (!object.on)) {
        var functions = Object.keys(EventEmitter.prototype);

        functions.forEach(function addProperty(property) {
            object[property] = EventEmitter.prototype[property];
        });
    }
};
