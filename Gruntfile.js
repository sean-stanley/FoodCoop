'use strict';
/*global module*/

var fs = require('fs');
var os = require('os'); 
var path = require('path');

module.exports = function(grunt) {
        
    // Project configuration.
    grunt.initConfig({
            pkg: grunt.file.readJSON('package.json'),
            jshint: {
                browser: {
                    files: {
                        src: ['app/js/*.js']
                    }
                },
                nodejs: {
                    files: {
                        src: ['*.js']
                    },
                    options: {
                        node: true
                    }
                },
                options: {
                    reporter: "./jshint_cpp_style.js",
                    globalstrict: true,
                    devel: true,
                    browser: true,
                    laxcomma: true
                }
            },
            karma: {
                continuous: {
                    configFile: 'config/karma.conf.js',
                    singleRun: true,
                    browsers: ['PhantomJS']
                },
            },
            shell: {
                chromeDebug: {
                    command: 'open -a "Google Chrome" "http://127.0.0.1:8080/debug?port=5858"',
                    options: {
                        stdout: true
                    }
                }
            },
            watch: {
                scripts: {
                  files: ['*.js', 'app/js/*.js', 'test/unit/*.js'],
                  tasks: ['concurrent:continuous'],
                  options: {
                    spawn: false,
                  },
                }
            },
            concurrent: {
                dev: {
                    tasks: ['nodemon', 'watch:scripts'],
                    options: {
                        logConcurrentOutput: true
                    }
                },
                debug: {
                    tasks: ['nodemon', 'watch', 'node-inspector', 'shell:chromeDebug'],
                    options: {
                        logConcurrentOutput: true
                    }
                },
                continuous: {
                    tasks: ['jshint:nodejs', 'jshint:browser'],
                    options: {
                        logConcurrentOutput: true
                    }
                }
            },
            nodemon: {
                dev: {
                    script: 'web-server.js',
                    options: {
                        nodeArgs: ['--debug'],
                        ignoredFiles: ['README.md', 'node_modules/**'],
                        watchedExtensions: ['js', 'json', 'svg', 'png', 'zip', 'jpg', 'css', 'html'],
                        //watchedFolders: ['.', '../common/ui'],
                        delayTime: 1,
                        legacyWatch: true,
                        cwd: 'app'
                    }
                }
            },
            'node-inspector': {
              dev: {}
            }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-node-inspector');
    
    // Default task(s).
    grunt.registerTask('dev', ['concurrent:dev']);
    grunt.registerTask('debug', ['concurrent:debug']);
    
};