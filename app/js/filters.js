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
			  URLready = forURL.replace(/[ ]/g, "+");
			  return URLready;
		  }
	  };
  })
  .filter('shortDate', function() {
	  return function(shortDate) {
		  var y, m, d;
		  if (shortDate && Object.prototype.toString.call(shortDate) === "[object Date]") {
			  y = shortDate.getFullYear();
			  m = shortDate.getMonth();
			  d = shortDate.getDate();
			  return [d, m, y].join('/');
		  }
		  
		  else if (shortDate && Object.prototype.toString.call(shortDate) == '[object String]') {
			  y = shortDate.slice(1-1, 4);
			  m = shortDate.slice(6-1, 7);
			  d = shortDate.slice(9-1, 10);
			  return [d, m, y].join('/');
		  }
		  
		  
		  
		  else {
			  return shortDate;
		  }
	  };
  })
  ;
