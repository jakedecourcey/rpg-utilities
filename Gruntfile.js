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
                command: 'vagrant provision --provision-with rsync',
                cwd: '/Users/jakedecourcey/aws-exercises/dev/'
            }
        },

        jshint: {
            files: ['server.js'],
            options: {
                esversion: 8
            }
        }
    });

    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.registerTask('default', ['watch']);
};
