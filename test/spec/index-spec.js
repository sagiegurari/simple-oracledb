'use strict';

var chai = require('chai');
var assert = chai.assert;
var simpleOracleDB = require('../../');

describe('Index Tests', function () {
    it('extend test', function () {
        var oracledb = require('../helpers/test-oracledb').create();
        simpleOracleDB.extend(oracledb);
        assert.isTrue(oracledb.simplified);
    });
});
