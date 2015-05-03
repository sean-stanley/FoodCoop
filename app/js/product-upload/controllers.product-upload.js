'use strict';
/*global angular, _, Date, oboe*/

/* Controllers */

angular.module('co-op.product-upload')
// main controller for product upload page
.controller('productUploadCtrl', ['$scope', '$rootScope', '$sce', '$location', '$modal', 'ProductManager', 'Restangular', 'product', 'flash',
	function($scope, $rootScope, $sce, $location, $modal, ProductManager, Restangular, product, flash) {
		// init
		$rootScope.$broadcast("cropme:cancel");
		$scope.productManager = ProductManager;
		console.log($rootScope.cycle);
			
		$scope.newProduct = {
			refrigeration: 'none',
			img: null,
			priceWithMarkup: this.price * 1.1,
			price: undefined,
			producer_ID: $rootScope.currentUser._id
		};
		$scope.newProduct.cycle = $rootScope.canSell ? $rootScope.cycle : !!$rootScope.cycle ? $rootScope.cycle + 1 : undefined;
		
		$scope.reset = function() {
			$rootScope.$broadcast("cropme:cancel");
			var path = $location.path();
			$scope.productData = angular.copy($scope.newProduct);
			if (path !== '/product-upload') {
				$location.path('product-upload');
			}
		};
		
		$scope.productData = product || angular.copy($scope.newProduct);
		$scope.selectedImg = $scope.productData.img || null;
		
		/* -----------------------
		|  Set the product Cycle  |
		// ----------------------*/
		
		var originalCycle = (!!product && product.hasOwnProperty('cycle') ) ? product.cycle : undefined;
		
		if ($rootScope.cycle) { 
			//true if calendar-loaded already fired
			if ($scope.productData.cycle < $rootScope.cycle || $scope.productData.cycle === undefined) {
				// old product from a past cycle or new product
				$scope.productData.cycle = $rootScope.canSell ? $rootScope.cycle : $rootScope.cycle + 1;
			}
			// old product from distant future -- do nothing
		}
		
		$scope.$on('CALENDAR-LOADED', function() {
			if ($scope.productData.cycle < $rootScope.cycle || $scope.productData.cycle === undefined) {
				// old product from a past cycle or new product
				$scope.productData.cycle = $rootScope.canSell ? $rootScope.cycle : $rootScope.cycle + 1;
				// old product from distant future -- do nothing
			}
		});
		
		
		$scope.ingredients = false;
		
		$scope.selectAllCycles = function() {
			$scope.productData.cycle = [];
			for (var i = 0; i < ProductManager.cycles.length; i++) {
				$scope.productData.cycle.push(ProductManager.cycles[i]._id);
			}
		};
		
		$scope.$watch('multiCycle', function(newValue) {
			if (!newValue) {
				if ($rootScope.canShop) {
					$scope.productData.cycle = $scope.productData.hasOwnProperty('_id') ? originalCycle : $rootScope.cycle;
				} else $scope.productData.cycle = $scope.productData.hasOwnProperty('_id') ? originalCycle : $rootScope.cycle + 1;
			} else $scope.productData.cycle = [];
		});
		
		$scope.$watch('productData.price', function(newValue) {
			$scope.productData.priceWithMarkup = newValue * 1.1;
		});
		
		$scope.categoryError = true;
		
		$scope.$watch('productData.category', function(newValue) {
			if (newValue) {
				$scope.categoryError = false;
			}
		});

		var certifications = Restangular.all('api/certification');
		
		certifications.getList().then(function(certification) {
			for (var i = 0; i < certification.length; i++) {
				certification[i].plain();
			}
			$scope.certifications = certification;
			$scope.productData.certification = (product.hasOwnProperty('certification')) ? product.certification : $scope.certifications[0]._id;
			$scope.certificationImg = function(id) {
				var el = _.findWhere($scope.certifications, {_id: $scope.productData.certification});
				return el.img;
			};
		});

		$scope.save = function(isValid, categoryError) {
			if (isValid && !categoryError) {
				$scope.submitted = false;
				flash.setMessage({type: 'warning', message: 'Beginning upload of '+ $scope.productData.productName});
				
				if (_.isArray($scope.productData.cycle) ) {
					$scope.productData.cycle = _.compact($scope.productData.cycle); // removes false, null, 0 and other falsey values
					if ($scope.productData.cycle.length === 1) $scope.productData.cycle = $scope.productData.cycle[0];
				} else if ($scope.productData.cycle <= $rootScope.cycle || !$scope.productData.cycle) {
					$scope.productData.cycle = $rootScope.canShop ? $rootScope.cycle : $rootScope.cycle + 1; //next cycle;
				}
			
				ProductManager.registerProduct($scope.productData, function(product) {
					$scope.$broadcast('REFRESHCURRENT');
					$scope.productData = product;
				});
				
			} else $scope.submitted = true;
			if (categoryError) {
				flash.setMessage({type:'warning', message: 'Please select a category for your product'});
			}
		};
		
		$scope.update = function(isValid, categoryError) {
			if( _.isArray($scope.productData.cycle) ) {
				$scope.productData.cycle = _.compact($scope.productData.cycle);
				if ($scope.productData.cycle.length === 1) $scope.productData.cycle = $scope.productData.cycle[0];
				else flash.setMessage({type: 'danger', message: 'Sorry! Please select just one delivery date when trying to update a product. Use the "Save" button to upload a product for more than one date at a time.'});
			}
			
			if (isValid && !categoryError && !_.isArray($scope.productData.cycle) ) {
				
				$scope.submitted = false;
				flash.setMessage({type: 'warning', message: 'Beginning update of '+ $scope.productData.productName});
				
				$scope.productData.save().then(function(response) {
					flash.setMessage({type: 'success', 
					message: $scope.productData.variety + " " + $scope.productData.productName + ' successfully updated'
					});
					$scope.$broadcast('REFRESHCURRENT');
				}, function(err) {
					console.log(err);
					flash.setMessage({type:'danger', message: 'Oops! Something went wrong: ' + err});
				});
			} else $scope.submitted = true;
			if (categoryError) {
				flash.setMessage({type:'warning', message: 'Please select a category for this product'});
			}
		};
				
		$scope.crop = function() {
			$rootScope.$broadcast("cropme:ok");
		};

		$scope.cancel = function() {
			$rootScope.$broadcast("cropme:cancel");
		};

		$scope.$on("cropme:done", function(e, result, canvasEl) {
			console.log(result.croppedImage);
			var fileURL = URL.createObjectURL(result.croppedImage);
			$scope.selectedImg = $sce.trustAsResourceUrl(fileURL);
			var reader = new window.FileReader();
			reader.readAsDataURL(result.croppedImage);
			reader.onloadend = function() {
				console.log(reader.result);
				$scope.productData.img = reader.result;
			};
		});
		
		$scope.preview = function(product) {
			var modalInstance = $modal.open({
				templateUrl: 'partials/store/store-modal.html',
				controller: 'previewCtrl',
				size: 'lg',
				resolve: {
					data: function() {
						return product;
					}
				}
			});

			modalInstance.result.then(function(product) {
				$location.hash('');
				
			}, function() {
				$location.hash('');
				console.log('Modal dismissed at: ' + new Date());
			});
		};
	}
])

.controller('PermanentProductUploadController', ['$scope', '$rootScope', '$sce', '$location', '$modal', 'ProductManager', 'ButcheryForms', 'Restangular', 'product', 'category', 'flash',
	function($scope, $rootScope, $sce, $location, $modal, ProductManager, ButcheryForms, Restangular, product, category, flash) {
		$rootScope.$broadcast("cropme:cancel");
		$scope.productManager = ProductManager;
		
		var markup = 1.1;
		if (category.data[0].name === 'Meat') {
			markup = 1.05;
		}
		
		$scope.productData = {
			permanent: true,
			price: 0,
			units: 'kg',
			refrigeration: 'frozen',
			producer_ID: $rootScope.currentUser._id,
			category: '5421e9192ba620071b4cb2a9', // Meat,
			butcheryForm: '/butchery/sheep',
			markup: markup
		};
		
		if (product) $scope.productData = product;
		
		$scope.$watch('productData.price', function(newValue) {
			$scope.productData.priceWithMarkup = newValue * markup;
		});
		
		$scope.$watch('productData.fixedPrice', function(newValue) {
			if (newValue > 0) {
				var match = $scope.productData.description.match(/<p id="fixedPrice">.*?<\/p>/),
				newStr = '<p id="fixedPrice">Please note there is a $' + newValue + ' processing fee on all orders.</p>';
				if (match) {
					$scope.productData.description = $scope.productData.description.replace(/<p id="fixedPrice">.*?<\/p>/, newStr);
				} else $scope.productData.description += newStr;
			} else {
				$scope.productData.description = $scope.productData.description.replace(/<p id="fixedPrice">.*?<\/p>/, '');
			}
			
		});
		
		$scope.butcheryForms = ButcheryForms;
		
		ProductManager.certificationPromise.getList().then(function(certifications) {
			$scope.certifications = certifications;
			$scope.productData.certification = (product.hasOwnProperty('certification')) ? product.certification : $scope.certifications[0]._id;
			$scope.certificationImg = function(id) {
				var el = _.findWhere($scope.certifications, {_id: $scope.productData.certification});
				return el.img;
			};
		});
		
		$scope.saveOrUpdate = function(isValid) {
			if (isValid) {
				if ($scope.productData.hasOwnProperty('_id') ) {
					update();
				} else save();
			} else $scope.submitted = true;
		};
				
		function save(isValid) {
			$scope.submitted = false;
			flash.setMessage({type: 'warning', message: 'Beginning upload of '+ $scope.productData.productName});
			
			ProductManager.registerProduct($scope.productData, function(product) {
				$scope.$broadcast('REFRESHCURRENT');
				$scope.productData = product;
			});
		}
		
		function update(isValid) {
			$scope.submitted = false;
			flash.setMessage({type: 'warning', message: 'Beginning upload of '+ $scope.productData.productName});
			
			$scope.productData.save().then(function(response) {
				flash.setMessage({type: 'success', 
				message: $scope.productData.productName + ' successfully updated'
				});
				$scope.$broadcast('REFRESHCURRENT');
			}, function(err) {
				console.log(err);
				flash.setMessage({type:'danger', message: 'Oops! Something went wrong: ' + err});
			});
		}
		
		$scope.crop = function() {
			$rootScope.$broadcast("cropme:ok");
		};

		$scope.cancel = function() {
			$rootScope.$broadcast("cropme:cancel");
		};

		$scope.$on("cropme:done", function(e, result, canvasEl) {
			console.log(result.croppedImage);
			var fileURL = URL.createObjectURL(result.croppedImage);
			$scope.selectedImg = $sce.trustAsResourceUrl(fileURL);
			var reader = new window.FileReader();
			reader.readAsDataURL(result.croppedImage);
			reader.onloadend = function() {
				console.log(reader.result);
				$scope.productData.img = reader.result;
			};
		});
		
		$scope.preview = function(product) {
			var modalInstance = $modal.open({
				templateUrl: 'partials/store/store-modal.html',
				controller: 'previewCtrl',
				size: 'lg',
				resolve: {
					data: function() {
						return product;
					}
				}
			});

			modalInstance.result.then(function(product) {
				$location.hash('');
				
			}, function() {
				$location.hash('');
				console.log('Modal dismissed at: ' + new Date());
			});
		};
	}
])


.controller('previewCtrl', ['$scope', '$modalInstance', 'data', 'ProductManager', 
function($scope, $modalInstance, data, ProductManager) {
	
	$scope.data = angular.copy(data);
	$scope.data.fullName = data.variety + ' ' + data.productName;
	
	if ($scope.data.hasOwnProperty('certification')) {
		$scope.data.certification = ProductManager.certificationByID($scope.data.certification);
	}
	
	if (typeof $scope.data.ingredients === 'string' && $scope.data.ingredients.length > 0) {
		console.log('converting string to array');
		$scope.data.ingredients = $scope.data.ingredients.split(/,\s*/);
	}
	
	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};
	
}])

// left-column of product-upload page
.controller('productHistoryCtrl', ['$scope', '$http', 'ProductHistory', 'ProductManager',
	function($scope, $http, ProductHistory, ProductManager) {

		$scope.$on('REFRESHCURRENT', function() {
			ProductHistory.getCurrentProducts(function(result) {
				$scope.currentProducts = result;
			});
		});
		
		ProductHistory.getCurrentProducts(function(result) {
			$scope.currentProducts = result;
		});
		
		ProductHistory.getPastProducts(function(result) {
			$scope.pastProducts = result;
		});

		$scope.predicate = 'cycle';

		$scope.delete = function(idx, id) {
			var itemToDelete = $scope.currentProducts[idx];
			ProductManager.deleteProduct(id);
			$scope.currentProducts.splice(idx, 1);
		};
	}
])

.controller('meatHistoryCtrl', ['$scope', '$http', 'ProductHistory', 'ProductManager',
	function($scope, $http, ProductHistory, ProductManager) {
		$scope.$on('REFRESHCURRENT', function() {
			ProductHistory.getMeatProducts(function(result) {
				$scope.currentMeat = result;
			});
		});
		
		ProductHistory.getMeatProducts(function(result) {
			$scope.currentMeat = result;
		});
		
		$scope.delete = function(idx, id) {
			var itemToDelete = $scope.currentMeat[idx];
			ProductManager.deleteProduct(id);
			$scope.currentMeat.splice(idx, 1);
		};
	}
])

;