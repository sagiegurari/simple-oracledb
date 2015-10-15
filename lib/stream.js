'use strict';

/**
 * Stream helper functions.
 *
 * @author Sagie Gur-Ari
 * @namespace Stream
 */
module.exports = {
    /**
     * Reads all data from the provided stream.<br>
     * The stream data is expected to be UTF-8 string.
     *
     * @function
     * @memberof! Stream
     * @public
     * @param {object} readableStream - The readable stream
     * @param {boolean} binary - True for binary stream, else character stream
     * @param {AsyncCallback} callback - called when the stream is fully read.
     */
    readFully: function readFully(readableStream, binary, callback) {
        if (!binary) {
            readableStream.setEncoding('utf8');
        }

        var callbackCalled = false;
        var singleCallback = function (error, data) {
            if (!callbackCalled) {
                callbackCalled = true;

                process.nextTick(function () {
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
        listeners.push(function () {
            readableStream.removeListener('data', onData);
        });
        readableStream.once('end', onEnd);
        listeners.push(function () {
            readableStream.removeListener('end', onEnd);
        });
        readableStream.once('error', onError);
        listeners.push(function () {
            readableStream.removeListener('error', onError);
        });
    }
};
