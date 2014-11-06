exports.config = {
  allScriptsTimeout: 11000,
	seleniumAddress: 'http://localhost:4444/wd/hub',
	rootElement: '.angular-app',
	baseUrl: 'http://localhost:4001/signup',

  specs: [
    '*.js'
  ],

  capabilities: {
    'browserName': 'chrome'
  },

  //baseUrl: 'http://localhost:4001/',

  framework: 'jasmine',

  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000
  }
};