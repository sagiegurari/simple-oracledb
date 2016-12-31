'use strict';

/**
 * Returns the parallel limit used by this library when running async operations in parallel.
 *
 * @function
 * @memberof! Constants
 * @private
 * @returns {Number} The parallel limit
 */
function calculateParallelLimit() {
    var threadPoolSize = process.env.UV_THREADPOOL_SIZE || 4;
    if (typeof threadPoolSize === 'string') {
        threadPoolSize = parseInt(threadPoolSize, 10);

        if (isNaN(threadPoolSize)) {
            threadPoolSize = 4;
        }
    }

    var floor = Math.floor(threadPoolSize / 2) || 1;

    return Math.max(floor, 1);
}

/**
 * Library constants.
 *
 * @author Sagie Gur-Ari
 * @namespace Constants
 * @private
 */
module.exports = {
    /**
     * Returns the parallel limit used by this library when running async operations in parallel.
     *
     * @function
     * @memberof! Constants
     * @private
     * @returns {Number} The parallel limit
     */
    getParallelLimit: calculateParallelLimit,
    /**
     * Holds the parallel limit calculated based on the current node.js thread pool size.
     *
     * @member {Number}
     * @alias Constants.parallelLimit
     * @memberof! Constants
     * @public
     */
    parallelLimit: calculateParallelLimit(),
    /**
     * Holds the CLOB type.
     *
     * @member {Number}
     * @alias Constants.clobType
     * @memberof! Constants
     * @public
     */
    clobType: 2006,
    /**
     * Holds the BLOB type.
     *
     * @member {Number}
     * @alias Constants.blobType
     * @memberof! Constants
     * @public
     */
    blobType: 2007,
    /**
     * Holds the BIND_OUT value.
     *
     * @member {Number}
     * @alias Constants.bindOut
     * @memberof! Constants
     * @public
     */
    bindOut: 3003
};
