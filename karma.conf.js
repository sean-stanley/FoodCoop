"use strict";

module.exports = function(config){
  config.set({

    basePath : './',

    files : [
      'app/lib/bower_components/angular/angular.js',
      'app/lib/bower_components/angular-route/angular-route.js',
			'app/lib/bower_components/angular-animate/angular-animate.js',
      'app/lib/bower_components/angular-mocks/angular-mocks.js',
			'app/lib/bower_components/angular-sanitize/angular-sanitize.js',
			'app/lib/bower_components/angular-touch/angular-touch.js',
			'app/js/*.spec.js',
			'test/unit/*.js',
     // 'app/components/**/*.js',
     // 'app/view*/**/*.js'
    ],

    frameworks: ['jasmine'],
		
		reporters: ['progress', 'coverage'],
		
    // coverage
    preprocessors: {
      // source files that you want to generate coverage for
      // do not include tests or libraries
      // (these files will be instrumented by Istanbul)
      'app/js/*.js': ['coverage'],
    },
		
		// coverage
    coverageReporter: {
      type: 'html',
      dir: 'test/coverage/'
    },
		
    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,
		
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    browsers : ['PhantomJS'],
		
    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,
		
    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true,

    // plugins : [
//             'karma-chrome-launcher',
//             'karma-phantomjs-launcher',
//             'karma-jasmine',
//             'karma-junit-reporter'
//             ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};
