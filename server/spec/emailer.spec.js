/* jshint -W079 */ 
'use strict';

var emailer = require('../emailer');

describe('jasmine-node-flat', function(){
  it('should pass', function(done){
    expect(1+2).toEqual(3);
		done();
  });
});

/*
describe('email attachments', function() {
	it('should have one attachment', function(){
		
	});
});*/
