'use strict';
/*global angular, google, $, AddressFinder*/

/* Directives */


angular.module('co-op.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])
	
  
  /**
   * A directive for adding google places autocomplete to a text box
   * google places autocomplete info: https://developers.google.com/maps/documentation/javascript/places
   *
   * Simple Usage:
   *
   * <input type="text" ng-autocomplete="result"/>
   *
   * creates the autocomplete text box and gives you access to the result
   *
   *   + `ng-autocomplete="result"`: specifies the directive, $scope.result will hold the textbox result
   *
   *
   * Advanced Usage:
   *
   * <input type="text" ng-autocomplete="result" details="details" options="options"/>
   *
   *   + `ng-autocomplete="result"`: specifies the directive, $scope.result will hold the textbox autocomplete result
   *
   *   + `details="details"`: $scope.details will hold the autocomplete's more detailed result; latlng. address components, etc.
   *
   *   + `options="options"`: options provided by the user that filter the autocomplete results
   *
   *      + options = {
   *           types: type,        string, values can be 'geocode', 'establishment', '(regions)', or '(cities)'
   *           bounds: bounds,     google maps LatLngBounds Object
   *           country: country    string, ISO 3166-1 Alpha-2 compatible country code. examples; 'ca', 'us', 'gb'
   *         }
   *
   *
   */
  .directive('ngAutocomplete', function($parse) {
      return {

        scope: {
          details: '=',
          ngAutocomplete: '=',
          options: '='
        },

        link: function(scope, element, attrs, model) {

          //options for autocomplete
          var opts;

          //convert options provided to opts
          var initOpts = function() {
            opts = {};
            if (scope.options) {
              if (scope.options.types) {
                opts.types = [];
                opts.types.push(scope.options.types);
              }
              if (scope.options.bounds) {
                opts.bounds = scope.options.bounds;
              }
              if (scope.options.country) {
                opts.componentRestrictions = {
                  country: scope.options.country
                };
              }
            }
          };
          initOpts();

          //create new autocomplete
          //reinitializes on every change of the options provided
          var newAutocomplete = function() {
            scope.gPlace = new google.maps.places.Autocomplete(element[0], opts);
            google.maps.event.addListener(scope.gPlace, 'place_changed', function() {
              scope.$apply(function() {
  //              if (scope.details) {
                  scope.details = scope.gPlace.getPlace();
  //              }
                scope.ngAutocomplete = element.val();
              });
            });
          };
          newAutocomplete();

          //watch options provided to directive
          scope.watchOptions = function () {
            return scope.options;
          };
          scope.$watch(scope.watchOptions, function () {
            initOpts();
            newAutocomplete();
            element[0].value = '';
            scope.ngAutocomplete = element.val();
          }, true);
        }
      };
    })
	/*
	.directive("nnfcScroll", function ($window, $document) {
		    return function(scope, element, attrs) {
		        var originalHeight = element[0].offsetHeight;
				
				var pageOffset = function(offset) {
					var num;
					console.log(offset);
						if (offset < 0) num = element[0].offsetHeight - 2* (offset + 51);
						num = element[0].offsetHeight - offset + 51;				 
		   	            return (num < originalHeight) ? num + 'px': originalHeight + 'px';
						//else return originalHeight + 'px';
					
		        };
				
				angular.element($window).bind("scroll", function() {
					element.css({'height' : pageOffset(this.pageYOffset)});
					scope.$apply();
				});
			};
		})*/
	/*
	FOR SAFE KEEPING
		angular.module("template/carousel/carousel.html", []).run(["$templateCache", function($templateCache) {
		  $templateCache.put("template/carousel/carousel.html", //ng-mouseenter=\"pause()\" ng-mouseleave=\"play()\" was removed from template
		    "<div class=\"carousel\" ng-swipe-right=\"prev()\" ng-swipe-left=\"next()\">\n" +
		    "    <ol class=\"carousel-indicators\" ng-show=\"slides.length > 1\">\n" +
		    "        <li ng-repeat=\"slide in slides track by $index\" ng-class=\"{active: isActive(slide)}\" ng-click=\"select(slide)\"></li>\n" +
		    "    </ol>\n" +
		    "    <div class=\"carousel-inner\" ng-transclude set-ng-animate='false'></div>\n" +
		    "    <a class=\"left carousel-control\" ng-click=\"prev()\" ng-show=\"slides.length > 1\"><span class=\"glyphicon glyphicon-chevron-left\"></span></a>\n" +
		    "    <a class=\"right carousel-control\" ng-click=\"next()\" ng-show=\"slides.length > 1\"><span class=\"glyphicon glyphicon-chevron-right\"></span></a>\n" +
		    "</div>\n" +
		    "");
		}]);*/
	
  
	.directive("fullHero", function ($window, $document, $timeout) {
	    return function(scope, element, attrs) {
        
			var timer;
			
			var resizeBG = function () {
			            var bgwidth = element[0].offsetWidth;
			            var bgheight = element[0].offsetHeight;

			            var winwidth = $window.innerWidth;
			            var winheight = $window.innerHeight;

			            var widthratio = winwidth / bgwidth;
			            var heightratio = winheight / bgheight;

			            var widthdiff = heightratio * bgwidth;
			            var heightdiff = widthratio * bgheight;

			            if (heightdiff > winheight) {
			                element.css({
			                    width: winwidth + 'px',
			                    height: heightdiff + 'px'
			                });
			            } else {
			                element.css({
			                    width: widthdiff + 'px',
			                    height: winheight + 'px'
			                });
			            }
						scope.$apply();
			        };
						
			function fullSize() {
				
				/*
				if (timer) $timeout.cancel(timer);
								else {
									timer = $timeout(function(){
										timer = undefined;
										element.css({'height' : $window.innerHeight + 'px'});
										rect = element[0].getBoundingClientRect();
										scope.$apply();
									}, 100);
								}*/
				
				element.css({'height' : $window.innerHeight + 'px'});
				scope.$apply();
				
			}
			
			var rect = element[0].getBoundingClientRect();
			
	        angular.element($document).ready(function() {
	        	fullSize();
				angular.element($window).bind("resize", fullSize);
	        });
	    };
	})

	.directive('setNgAnimate', ['$animate', function ($animate) {
	    return {
	        link: function ($scope, $element, $attrs) { 
          
	            $scope.$watch( function() { 
	                    return $scope.$eval($attrs.setNgAnimate, $scope); 
	                }, function(valnew, valold){
	                    $animate.enabled(!!valnew, $element);
	            });  
            
            
	        }
	    };
	}])
	

  
.directive("fileread", [function () {
    return {
        restrict: 'A',
		scope: {
            fileread: "="
        },
        link: function (scope, element, attrs) {
            var checkSize;
            checkSize = function(size) {
                var _ref;
                if (((_ref = attrs.maxFileSize) === (void 0) || _ref === '') || (size / 1024) / 1024 < attrs.maxFileSize) {
                    return true;
                } else {
                    alert("File must be smaller than " + attrs.maxFileSize + " MB");
                    return false;
                }
            };
			element.bind("change", function (changeEvent) {
                var file, name, size, type;
				var reader = new FileReader();
                reader.onload = function (loadEvent) {
					if (checkSize(size)) {
					    scope.$apply(function () {
	                        scope.fileread = loadEvent.target.result;
	                    });
					}
				    
                };
				//file = event.originalEvent.dataTransfer.files[0];
				file = changeEvent.target.files[0];
				size = file.size;
                reader.readAsDataURL(changeEvent.target.files[0]);
            });
        }
    };
}])
  .directive('fileDropzone', function() {
      return {
          restrict: 'A',
          scope: {
              file: '=',
              fileName: '='
          },
          link: function(scope, element, attrs) {
              var checkSize, isTypeValid, processDragOverOrEnter, validMimeTypes;
              processDragOverOrEnter = function(event) {
                  if (event !== null) {
                      event.preventDefault();
                  }
                  event.originalEvent.dataTransfer.effectAllowed = 'copy';
                  return false;
              };
              validMimeTypes = attrs.fileDropzone;
              checkSize = function(size) {
                  var _ref;
                  if (((_ref = attrs.maxFileSize) === (void 0) || _ref === '') || (size / 1024) / 1024 < attrs.maxFileSize) {
                      return true;
                  } else {
                      alert("File must be smaller than " + attrs.maxFileSize + " MB");
                      return false;
                  }
              };
              isTypeValid = function(type) {
                  if ((validMimeTypes === (void 0) || validMimeTypes === '') || validMimeTypes.indexOf(type) > -1) {
                      return true;
                  } else {
                      alert("Invalid file type.  File must be one of following types " + validMimeTypes);
                      return false;
                  }
              };
              element.bind('dragover', processDragOverOrEnter);
              element.bind('dragenter', processDragOverOrEnter);
              return element.bind('drop', function(event) {
                  var file, name, reader, size, type;
                  if (event !== null) {
                      event.preventDefault();
                  }
                  reader = new FileReader();
                  reader.onload = function(evt) {
                      if (checkSize(size) && isTypeValid(type)) {
                          return scope.$apply(function() {
                              scope.file = evt.target.result;
                              if (angular.isString(scope.fileName)) {
                                  scope.fileName = name;
                                  return name;
                              }
                          });
                      }
                  };
                  file = event.originalEvent.dataTransfer.files[0];
                  name = file.name;
                  type = file.type;
                  size = file.size;
                  reader.readAsDataURL(file);
                  return false;
              });
          }
      };
  });  

