'use strict';

/*jslint debug: true */
/**
 * Stream helper functions.
 *
 * @author Sagie Gur-Ari
 * @class Stream
 * @public
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
 * @param {object} readableStream - The readable stream
 * @param {boolean} binary - True for binary stream, else character stream
 * @param {AsyncCallback} callback - called when the stream is fully read.
 */
Stream.prototype.read = function (readableStream, binary, callback) {
    if (!binary) {
        readableStream.setEncoding('utf8');
    }

    var callbackCalled = false;
    var singleCallback = function (error, data) {
        if (!callbackCalled) {
            callbackCalled = true;

            process.nextTick(function invokeCallback() {
                callback(error, data);
            });
        }
    };

    var data = [];
    var errorFound = false;
    var listeners = [];
    var cleanup = function cleanup() {
        var unlisten;
        while (listeners.length) {
            unlisten = listeners.pop();
            if (unlisten) {
                unlisten();
            }
        }
    };
    var onData = function onData(partialData) {
        if (partialData) {
            data.push(partialData);
        }
    };
    var onEnd = function onEnd() {
        cleanup();

        if (!errorFound) {
            if (binary) {
                data = Buffer.concat(data);
            } else {
                data = data.join('');
            }

            singleCallback(null, data);
        }
    };
    var onError = function onError(error) {
        errorFound = true;
        cleanup();

        singleCallback(error);
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
 * @param {object} writableStream - The writable stream
 * @param {Buffer|string} data - The text of binary data to write
 * @param {AsyncCallback} callback - called when the data is fully written to the provided stream
 */
Stream.prototype.write = function (writableStream, data, callback) {
    if (writableStream && data) {
        var errorDetected = false;
        var onError = function onError(error) {
            errorDetected = true;

            callback(error);
        };

        writableStream.once('error', onError);

        var onWrite = function onWrite() {
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
