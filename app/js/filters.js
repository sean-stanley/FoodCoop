'use strict';
/*global angular*/

/* Filters */

angular.module('co-op.filters', []).
  filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  }])
  .filter('blurb', function() {
	  return function(blurb) {
		  if (blurb.length > 200) {
			  return blurb.slice(0, 199);
		  }
		  else {
			  return blurb;
		  }
	  };
  })
  
  ;
