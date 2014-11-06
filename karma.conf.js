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
			'app/js/*.js',
			'test/unit/*.js'
     // 'app/components/**/*.js',
     // 'app/view*/**/*.js'
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Chrome'],

    plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-junit-reporter'
            ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};
