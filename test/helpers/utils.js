'use strict';

module.exports = {
    createBuffer(value) {
        if ((typeof value === 'string') && Buffer.from) {
            return Buffer.from(value, 'utf8');
        } else if ((typeof value === 'number') && Buffer.alloc) {
            return Buffer.alloc(value);
        }

        /*eslint-disable no-buffer-constructor*/
        return new Buffer(value);
        /*eslint-enable no-buffer-constructor*/
    }
};
