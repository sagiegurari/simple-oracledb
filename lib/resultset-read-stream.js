'use strict';

const util = require('util');
const stream = require('stream');
const Readable = stream.Readable;

/**
 * A node.js read stream for resultsets.
 *
 * @author Sagie Gur-Ari
 * @class ResultSetReadStream
 * @public
 */
function ResultSetReadStream() {
    const self = this;

    Readable.call(self, {
        objectMode: true
    });

    Object.defineProperty(self, 'nextRow', {
        /**
         * Sets the nextRow value.
         *
         * @function
         * @memberof! ResultSetReadStream
         * @alias ResultSetReadStream.nextRow.set
         * @private
         * @param {function} nextRow - The next row callback function
         */
        set(nextRow) {
            self.next = nextRow;

            if (self.inRead) {
                /*jslint nomen: true */
                /*eslint-disable no-underscore-dangle*/
                //jscs:disable disallowDanglingUnderscores
                self._read();
                //jscs:enable disallowDanglingUnderscores
                /*eslint-enable no-underscore-dangle*/
                /*jslint nomen: false */
            }
        }
    });
}

util.inherits(ResultSetReadStream, Readable);

/*jslint nomen: true */
/*eslint-disable no-underscore-dangle*/
//jscs:disable disallowDanglingUnderscores
/**
 * The stream _read implementation which fetches the next row from the resultset.
 *
 * @function
 * @memberof! ResultSetReadStream
 * @private
 */
ResultSetReadStream.prototype._read = function () {
    const self = this;

    self.inRead = false;

    if (self.metaData) {
        self.emit('metadata', self.metaData);
        delete self.metaData;
    }

    if (self.next) {
        self.next(function onNextRowRead(error, data) {
            /*istanbul ignore else*/
            if (!self.closed) {
                if (error) {
                    self.closed = true;
                    self.emit('error', error);
                } else if (data) {
                    self.push(data);
                } else {
                    self.closed = true;
                    self.push(null);
                }
            }
        });
    } else {
        self.inRead = true;
    }
};
//jscs:enable disallowDanglingUnderscores
/*eslint-enable no-underscore-dangle*/
/*jslint nomen: false */

/**
 * Closes the stream and prevent any more data events from being invoked.<br>
 * It will also free the connection to enable using it to invoke more operations.
 *
 * @function
 * @memberof! ResultSetReadStream
 * @public
 */
ResultSetReadStream.prototype.close = function () {
    const self = this;

    /*istanbul ignore else*/
    if (!self.closed) {
        self.closed = true;

        process.nextTick(function emitEnd() {
            self.push(null);
        });
    }
};

module.exports = ResultSetReadStream;
