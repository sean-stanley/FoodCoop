'use strict';
/*global module*/

var fs = require('fs');
var os = require('os');
var path = require('path');
var config = require('./server/config').Config;

var bower_components = [
	'app/lib/bower_components/angular/angular.js',
	'app/lib/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
	'app/lib/bower_components/angular-cropme/cropme.js',
	'app/lib/bower_components/angular-loading-bar/build/loading-bar.js',
	'app/lib/bower_components/angular-route/angular-route.js',
	'app/lib/bower_components/angular-sanitize/angular-sanitize.js',
	'app/lib/bower_components/angular-socket-io/socket.js',
	'app/lib/bower_components/angulartics/src/angulartics.js',
	'app/lib/bower_components/angulartics/src/angulartics-ga.js',
	'app/lib/bower_components/datejs/build/date-en-NZ.js',
	'app/lib/bower_components/momentjs/moment.js',
	'app/lib/bower_components/textAngular/dist/textAngular-rangy.min.js',
	'app/lib/bower_components/textAngular/dist/textAngular-sanitize.min.js',
	'app/lib/bower_components/textAngular/dist/textAngular.min.js',
	'app/lib/oboe-browser.min.js'
];

module.exports = function(grunt) {
        
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			browser: {
				files: {
					src: ['app/js/*.js', 'app/js/*/*.js']
				}
			},
			nodejs: {
				files: {
					src: ['*.js', 'server/*.js', 'server/*/*.js'],
				},
				options: {
					node: true,
					jasmine: true,
					globalstrict: false,
					browser: false
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
			unit: {
				configFile: 'karma.conf.js',
			},
		},
		shell: {
			chromeDebug: {
				command: 'open -a "Google Chrome" "http://127.0.0.1:8080/debug?port=5858"',
				options: {
					stdout: true
				}
			},
			encryptConfig: {
				command: 'openssl cast5-cbc -e -in config.js -out config.js.cast5',
				options: {
					stdout: true,
					execOptions: {
						cwd: path.join(__dirname, 'server')
					}
				}
			},
			decryptConfig: {
				command: 'openssl cast5-cbc -d -in config.js.cast5 -out config.js && chmod 600 config.js',
				options: {
					stdout: true,
					execOptions: {
						cwd: path.join(__dirname, 'server')
					}
				}
			},
			updateServer: {
				command: 'ssh ' + config.deploy.username + '@' + config.deploy.server + ' ' + path.join(config.deploy.path, 'update.sh'),
				options: {
					stdout: true
				}
			}
		},
		watch: {
			scripts: {
				files: ['*.js', 'app/js/*.js', 'app/js/*/*.js', 'test/unit/*.js', '!server/spec/*'],
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
			},
			build: {
				tasks: ['rsync:copy_build', 'jshint:browser'],
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
					cwd: 'server'
				}
			},
			opt: {
				script: 'web-server.js',
				options: {
					nodeArgs: ['--debug'],
					ignoredFiles: ['README.md', 'node_modules/**'],
					watchedExtensions: ['js', 'json', 'svg', 'png', 'zip', 'jpg', 'css', 'html'],
					//watchedFolders: ['.', '../common/ui'],
					delayTime: 1,
					legacyWatch: true,
					cwd: 'build/server'
				}
			}
		},
		'node-inspector': {
			dev: {}
		},
		rsync: {
			options: {
				args: ["--verbose"],
				exclude: [".git*","*.scss","node_modules", "app/upload"],
				recursive: true
			},
			linode: {
				options: {
					src: ["app", "server", "package.json"],
					dest: "Deploy/foodcoop.nz",
					syncDest: true,
					args: "-z",
					host: config.deploy.username + '@' + config.deploy.server
				}
			},
			linodeOpt: {
				options: {
					src: ["build/"],
					dest: "Deploy/foodcoop.nz",
					syncDest: false,
					args: "-z -v",
					host: config.deploy.username + '@' + config.deploy.server
				}
			},
			copy_build: {
				options: {
					src: ["app", "server", "package.json"],
					dest: "build"
				}
			},
                
		},
		clean: {
			annotations: {
				src: ['app/js/*.annotated.js', 'app/js/*/*.annotated.js']
			}
		},
		ngAnnotate: {
			options: {
				singleQuotes: true,
			},
			app: {
				files: [
					{
						expand: true,
						src: ['app/js/*.js', 'app/js/*/*.js'],
						ext: '.annotated.js', // Dest filepaths will have this extension.
						extDot: 'last'        // Extensions in filenames begin after the last dot
					},
				],
			}
		},
		uglify: {
			app: {
				options: {
					sourceMap: 'build/app/js/foodcoop-map.js'
				},
				files: {
					'build/app/js/foodcoop.min.js': ['app/js/app.annotated.js', 
					'app/js/services.annotated.js', 
					'app/js/controllers.annotated.js', 
					'app/js/filters.annotated.js', 
					'app/js/directives.annotated.js',
					'app/js/user/app.user.annotated.js',
					'app/js/user/controllers.user.annotated.js',
					'app/js/user/controllers.orders.annotated.js',
					'app/js/admin/app.admin.annotated.js',
					'app/js/admin/controllers.admin.annotated.js',
					'app/js/product-upload/app.product-upload.annotated.js',
					'app/js/product-upload/controllers.product-upload.annotated.js'
					]
				}
			},
			bowerServer: {
				options: {
					mangle: true,
				},
				files: {
					'build/app/lib/aggregated.min.js': bower_components
				}
			},
			bowerDev: {
				options: {
					beautify: true,
				},
				files: {
					'app/lib/aggregated.min.js': bower_components
				}
			},
			
		},
		replace: {
			dist: {
				options: {
					patterns: [
						{
							match: /<!-- food coop files -->/g,
							replacement: '<!-- food coop files -->\n\t<script src="js/foodcoop.min.js"></script>'
						},
						{
							match: /<script src="js\/.*"><\/script>/g,
							replacement: ''
						}
					]
				},
				files: [
					{
						expand: true, 
						flatten: true, 
						src: ['app/index.html'], 
						dest: 'build/app'
					}
				]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-csslint');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-karma');
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-nodemon');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-node-inspector');
	grunt.loadNpmTasks('grunt-rsync');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-replace');
	grunt.loadNpmTasks('grunt-ng-annotate');
	grunt.loadNpmTasks('grunt-contrib-clean');
    
	// Default task(s).
	grunt.registerTask('dev', ['uglify:bowerDev', 'concurrent:dev']);
	grunt.registerTask('build', ['concurrent:build', 'replace', 'clean:annotations', 'ngAnnotate', 'uglify:app', 'uglify:bowerServer']);
	grunt.registerTask('serve-opt', ['build', 'nodemon:opt']);
	grunt.registerTask('debug', ['concurrent:debug']);
	grunt.registerTask('deploy-debug', ['rsync:linode', 'shell:updateServer']);
	grunt.registerTask('deploy', ['build', 'rsync:linodeOpt', 'shell:updateServer']);
	grunt.registerTask('decrypt-config', ['shell:decryptConfig']);
	grunt.registerTask('encrypt-config', ['shell:encryptConfig']);
	  
	//Test task.
	grunt.registerTask('test', ['jshint:browser', 'karma:unit']);
	//	grunt.registerTask('test', ['concurrent:test']);
};
