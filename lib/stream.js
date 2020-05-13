'use strict';

const funcs = require('funcs-js');

/*jslint debug: true */
/**
 * Stream helper functions.
 *
 * @author Sagie Gur-Ari
 * @class Stream
 * @private
 */
function Stream() {
    //should not be called
}
/*jslint debug: false */

/**
 * Reads all data from the provided stream.
 *
 * @function
 * @memberof! Stream
 * @public
 * @param {Object} readableStream - The readable stream
 * @param {Boolean} binary - True for binary stream, else character stream
 * @param {AsyncCallback} callback - called when the stream is fully read.
 */
Stream.prototype.read = function (readableStream, binary, callback) {
    if (!binary) {
        readableStream.setEncoding('utf8');
    }

    callback = funcs.once(callback, {
        callbackStyle: true
    });

    let data = [];
    const listeners = [];
    const cleanup = function () {
        let unlisten;
        while (listeners.length) {
            unlisten = listeners.pop();
            unlisten();
        }
    };
    const onData = function (partialData) {
        if (partialData) {
            data.push(partialData);
        }
    };
    const onEnd = function () {
        cleanup();

        if (binary) {
            data = Buffer.concat(data);
        } else {
            data = data.join('');
        }

        callback(null, data);
    };
    const onError = function (error) {
        cleanup();

        callback(error);
    };

    readableStream.on('data', onData);
    listeners.push(function removeDataListener() {
        readableStream.removeListener('data', onData);
    });

    readableStream.once('end', onEnd);
    listeners.push(function removeEndListener() {
        readableStream.removeListener('end', onEnd);
    });

    readableStream.once('error', onError);
    listeners.push(function removeErrorListener() {
        readableStream.removeListener('error', onError);
    });
};

/**
 * Writes the provided data to the stream.
 *
 * @function
 * @memberof! Stream
 * @public
 * @param {Object} writableStream - The writable stream
 * @param {Buffer|String} data - The text of binary data to write
 * @param {AsyncCallback} callback - called when the data is fully written to the provided stream
 */
Stream.prototype.write = function (writableStream, data, callback) {
    if (writableStream && data) {
        let errorDetected = false;
        const onError = function (error) {
            errorDetected = true;

            callback(error);
        };

        writableStream.once('error', onError);

        const onWrite = function () {
            writableStream.removeListener('error', onError);

            if (!errorDetected) {
                callback();
            }
        };

        if (typeof data === 'string') {
            writableStream.end(data, 'utf8', onWrite);
        } else { //Buffer
            writableStream.end(data, onWrite);
        }
    } else {
        callback();
    }
};

module.exports = new Stream();
