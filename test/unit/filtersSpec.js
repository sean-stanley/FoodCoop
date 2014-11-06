'use strict';

/* jasmine specs for filters go here */

describe('filter', function() {
  beforeEach(module('co-op.filters'));


  describe('interpolate', function() {
    beforeEach(module(function($provide) {
      $provide.value('version', 'TEST_VER');
    }));


    it('should replace VERSION', inject(function(interpolateFilter) {
      expect(interpolateFilter('before %VERSION% after')).toEqual('before TEST_VER after');
    }));
  });
	
	describe('forURL', function() {
		it('should replace spaces with +', inject(function(forURLFilter) {
			expect(forURLFilter('northland natural matt stanley')).toEqual('northland+natural+matt+stanley');
			expect(forURLFilter('test')).toEqual('test');
			expect(forURLFilter('test me')).not.toEqual('test me');
		}));
	});
	
});
