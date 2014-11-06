'use strict';

/* jasmine specs for services go here */

describe('service', function() {
  beforeEach(module('co-op.services'));

	/*
	describe('alerts', function() {
			it('should initialize empty queue', inject(function(flash){
				expect(flash)
			}));
		});*/
	

  describe('version', function() {
    it('should return current version', inject(function(version) {
      expect(version).toEqual('0.1');
    }));
  });
});
