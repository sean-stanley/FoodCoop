'use strict';
/*global angular, Date*/

/* Filters */

angular.module('co-op.filters', []).
  filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  }])
  
  .filter('blurb', function() {
	  return function(blurb) {
		  if (blurb) {
			if (blurb.length > 200) {
				return blurb.slice(0, 199);
			}
			else {
				return blurb;
			}
		  }
		  else {
			  return "No description has been written yet for this product.";
		  }
			  
	  };
  })
  .filter('forURL', function() {
	  return function(forURL) {
		  var URLready;
		  if (forURL) {
			  forURL.toString();
			  URLready = forURL.replace(/\s/g, "+");
			  return URLready;
		  }
	  };
  })
  .filter('shortDate', function() {
	return function(shortDate) {
		if (shortDate) {
			return Date.parse(shortDate).toString('d/M/yyyy');  
		}
	};
  })
  .filter('longDate', function() {
	  return function(longDate) {
		  if (longDate) {
		  	return Date.parse(longDate).toString('ddd d MMM yyyy');
		  }
	  };
  })
  ;
