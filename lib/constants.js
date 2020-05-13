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
    let threadPoolSize = process.env.UV_THREADPOOL_SIZE || 4;
    if (typeof threadPoolSize === 'string') {
        threadPoolSize = parseInt(threadPoolSize, 10);

        if (isNaN(threadPoolSize)) {
            threadPoolSize = 4;
        }
    }

    const floor = Math.floor(threadPoolSize / 2) || 1;

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
     * Holds constious internal feature flags.
     *
     * @function
     * @memberof! Constants
     * @private
     * @returns {Object} Feature flags
     */
    features: {
        /**
         * True to enable executeMany support for batch operations.
         *
         * @function
         * @memberof! Constants.features
         * @private
         * @returns {Boolean} True to enable executeMany support for batch operations
         */
        executeManySupport: true
    },
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
     * Holds the string max size for bind definitions.
     *
     * @member {Number}
     * @alias Constants.stringMaxSize
     * @memberof! Constants
     * @public
     */
    stringMaxSize: parseInt(process.env.SIMPLE_ORACLEDB_MAX_STRING_SIZE || 100000, 10),
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
     * Holds the date type.
     *
     * @member {Number}
     * @alias Constants.dateType
     * @memberof! Constants
     * @public
     */
    dateType: 2003,
    /**
     * Holds the number type.
     *
     * @member {Number}
     * @alias Constants.numberType
     * @memberof! Constants
     * @public
     */
    numberType: 2002,
    /**
     * Holds the string type.
     *
     * @member {Number}
     * @alias Constants.stringType
     * @memberof! Constants
     * @public
     */
    stringType: 2001,
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
