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
  
  
	.directive("scroll", function ($window) {
	    return function(scope, element, attrs) {
        
	         var pageOffset = function(offset) {
	             var num = 389 - offset;
	             return (num > 0) ? num + 'px': 0;
	        };
        
	        angular.element($window).bind("scroll", function() {
	            element.css({'height' : pageOffset(this.pageYOffset)});
	            scope.$apply();
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
  })  
  
  .directive('categoryChooser', ['ProductManager', function(ProductManager) {
      return {
          restrict: 'E',
          replace: true,
          scope: {
              modelVar: '='
          },
          template: '<select ng-model="selectValue" ng-options="name for name in categoryNames"></select>',
		  //template: '<div class="btn-group center-block"><label ng-repeat="category in categories" class="btn btn-primary" ng-model="productData.category" btn-radio="category._id">{{category.name}}</label></div>',
          link: function(scope, element, attrs, ctrl) {
              var categoryIdToNameMapping = {}, categoryNameToIdMapping = {};
              
              scope.test = '';
			  scope.placeholderName = '';
			  scope.placeholderVariety = '';
			  scope.availableUnits = [];
              
              scope.categories = ProductManager.productCategories;
              
			  scope.$watch('categories', function (newValue) {
                  scope.categoryNames = ['--- Select a Category ---'];
                  categoryIdToNameMapping = {};
                  categoryNameToIdMapping = {};
                  newValue.forEach(function (category) {
                      if (category.name) {
                          scope.categoryNames.push(category.name);
                          categoryIdToNameMapping[category.name] = category._id;
                          categoryNameToIdMapping[category._id] = category.name;
						  scope.placeholderName = category.placeholderName;
						  scope.placeholderVariety = category.placeholderVariety;
                      }
                  });
              }, true);
              
              scope.$watch('modelVar', function (newValue) {
                  if (!newValue) {
                      scope.selectValue = '--- Select a Category ---';
                  } else {
                      scope.selectValue = categoryNameToIdMapping[newValue];
                  }
              });
              
              scope.$watch('selectValue', function (newValue) {
                  scope.modelVar = categoryIdToNameMapping[newValue];
              });
          }
      };
  }]);  

