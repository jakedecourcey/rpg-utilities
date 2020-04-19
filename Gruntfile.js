module.exports = function(grunt) {

    grunt.initConfig({
        watch: {
            scripts: {
                files: ['**/*'],
                tasks: ['exec', 'jshint']
            }
        },

        exec: {
            update_vagrant: {
                command: 'vagrant provision --provision-with rsync web',
                cwd: '/Users/jakedecourcey/aws-exercises/dev/'
            }
        },

        jshint: {
            files: ['**/*.js']
        }
    });

    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.registerTask('default', ['watch']);
};
