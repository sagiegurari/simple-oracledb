'use strict';

module.exports = function (grunt) {
    grunt.registerTask('cleanup', 'Cleanups', [
        'clean:target'
    ]);

    grunt.registerTask('test', 'Continues integration related tasks.', [
        'lint',
        'coverage-ci'
    ]);

    grunt.registerTask('docs', 'Generate docs.', [
        'gitdown:readme',
        'jsdoc2md:api'
    ]);

    grunt.registerTask('empty', 'Empty Task', []);

    return {};
};
