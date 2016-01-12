'use strict';

var util = require('util');
var stream = require('stream');
var Readable = stream.Readable;

/**
 * A node.js read stream for resultsets.
 *
 * @author Sagie Gur-Ari
 * @class ResultSetReadStream
 * @public
 */
function ResultSetReadStream() {
    var self = this;

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
        set: function (nextRow) {
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
    var self = this;

    self.inRead = false;

    if (self.next) {
        self.next(function onNextRowRead(error, data) {
            if (error) {
                self.emit('error', error);
            } else if (data && (data.length === 1)) {
                self.push(data[0]);
            } else if (data && (data.length > 1)) {
                self.emit('error', new Error('Expected 1 row, actual: ' + data.length));
            } else {
                self.push(null);
            }
        });
    } else {
        self.inRead = true;
    }
};
//jscs:enable disallowDanglingUnderscores
/*eslint-enable no-underscore-dangle*/
/*jslint nomen: false */

module.exports = ResultSetReadStream;