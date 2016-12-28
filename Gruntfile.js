'use strict';

/*jslint nomen: true*/
//jscs:disable disallowDanglingUnderscores
/*eslint-disable no-underscore-dangle*/

module.exports = function (grunt) {
    var commons = require('js-project-commons');

    grunt.loadNpmTasks('grunt-shell');

    commons.grunt.config.initConfig(grunt, {
        buildConfig: {
            projectRoot: __dirname,
            nodeProject: true
        },
        apidoc2readme: {
            readme: {
                options: {
                    tags: {
                        'OracleDB+run': 'OracleDB+run',
                        'Pool+getConnection': 'Pool+getConnection',
                        'Pool+run': 'Pool+run',
                        'Pool+parallelQuery': 'Pool+parallelQuery',
                        'Pool+terminate': {
                            tag: 'Pool+terminate',
                            skipSignature: true
                        },
                        'Connection+query': 'Connection+query',
                        'Connection+insert': 'Connection+insert',
                        'Connection+update': 'Connection+update',
                        'Connection+queryJSON': 'Connection+queryJSON',
                        'Connection+batchInsert': 'Connection+batchInsert',
                        'Connection+batchUpdate': 'Connection+batchUpdate',
                        'Connection+transaction': 'Connection+transaction',
                        'Connection+run': 'Connection+run',
                        'Connection+executeFile': 'Connection+executeFile',
                        'Connection+release': {
                            tag: 'Connection+release',
                            skipSignature: true
                        },
                        'Connection+rollback': 'Connection+rollback',
                        'SimpleOracleDB+addExtension': 'SimpleOracleDB+addExtension'
                    },
                    modifySignature: function (line) {
                        return line.split('Pool.').join('pool.').split('Connection.').join('connection.').split('\'OracleDB.').join('\'oracledb.').split('Promise').join('[Promise]').split('ResultSetReadStream').join('[ResultSetReadStream]');
                    }
                }
            }
        }
    });
};
