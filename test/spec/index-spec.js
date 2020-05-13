'use strict';

const chai = require('chai');
const assert = chai.assert;
const simpleOracleDB = require('../../');

describe('Index Tests', function () {
    it('extend test', function () {
        const oracledb = require('../helpers/test-oracledb').create();
        simpleOracleDB.extend(oracledb);
        assert.isTrue(oracledb.simplified);
    });
});
