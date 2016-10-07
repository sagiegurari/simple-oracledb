'use strict';

/*jslint nomen: true*/
//jscs:disable disallowDanglingUnderscores
/*eslint-disable no-underscore-dangle*/

module.exports = function (grunt) {
    var commons = require('js-project-commons');

    commons.grunt.config.initConfig(grunt, {
        buildConfig: {
            projectRoot: __dirname,
            nodeProject: true
        },
        apidoc2readme: {
            readme: {
                options: {
                    tags: {
                        'usage-oracledb-run': 'OracleDB+run',
                        'usage-getconnection': 'Pool+getConnection',
                        'usage-pool-run': 'Pool+run',
                        'usage-terminate': {
                            tag: 'Pool+terminate',
                            skipSignature: true
                        },
                        'usage-query': 'Connection+query',
                        'usage-insert': 'Connection+insert',
                        'usage-update': 'Connection+update',
                        'usage-queryJSON': 'Connection+queryJSON',
                        'usage-batchInsert': 'Connection+batchInsert',
                        'usage-batchUpdate': 'Connection+batchUpdate',
                        'usage-transaction': 'Connection+transaction',
                        'usage-connection-run': 'Connection+run',
                        'usage-release': {
                            tag: 'Connection+release',
                            skipSignature: true
                        },
                        'usage-rollback': 'Connection+rollback',
                        'usage-extensions': 'SimpleOracleDB+addExtension'
                    },
                    modifySignature: function (line) {
                        return line.split('Pool.').join('pool.').split('Connection.').join('connection.');
                    }
                }
            }
        }
    });
};
