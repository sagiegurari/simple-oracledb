'use strict';

module.exports = function (grunt) {
    grunt.registerTask('cleanup', 'Cleanups', [
        'clean:target'
    ]);

    grunt.registerTask('test', 'Continues integration related tasks.', [
        'lint',
        'mochaTest:full',
        'force:coverage-ci'
    ]);

    grunt.registerTask('docs', 'Generate docs.', [
        'jsdoc2md:api'
    ]);

    return {};
};
