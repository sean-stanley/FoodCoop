'use strict';
/*global angular*/

/* Controllers */

angular.module('co-op.controllers', []).
    controller('MyCtrl1', [
    	function() {

    	}
    ])
	
	.controller('navCtrl', ['$scope', '$location', 'LoginManager', 'CartRecords',
		function($scope, $location, LoginManager, CartRecords) {
			$scope.isActive = function(route) {
				return route === $location.path();
			};

			$scope.items = CartRecords.getCart().length;

		}
	])

.controller('logoutCtrl', ['$scope', '$location', 'LoginManager',
	function($scope, $location, LoginManager) {

		$scope.logOut = function() {
			LoginManager.logout();
		};
	}
])

.controller('loginCtrl', ['$scope', '$location', 'LoginManager',
	function($scope, $location, LoginManager) {
		$scope.showLogin = false;

		$scope.loginData = {
			email: '',
			password: '',
			rememberMe: false
		};

		$scope.submitForm = function() {
			LoginManager.login('local', $scope.loginData, function() {
				$location.path('/my-cart');
			});
		};
	}
])
	.controller('resetPwdCtrl', ['$scope', 'PwdResetManager',
		function($scope, PwdResetManager) {
			$scope.resetData = {
				email: '',
				dob: '',
				securityQuestion: '',
				securityAnswer: '',
				loginTries: $scope.loginAttemts,
			};
			$scope.submitForm = function() {
				PwdResetManager.pwdReset($scope.resetData);
			};
		}
	])

.controller('userAdminCtrl', ['$scope', 'Restangular', '$location',
	function($scope, Restangular, $location) {

		// First way of creating a Restangular object. Just saying the base URL
		var allUsers = Restangular.all('api/user');

		// This will query /user and return a promise.
		allUsers.getList().then(function(users) {
		  $scope.userLibrary = users;
		});
		
	}
])

.controller('userEditCtrl', ['$scope', 'Restangular', '$location', 'user',
	function($scope, Restangular, $location, user) {
		
		var original = user;
		  $scope.user = Restangular.copy(original);
  

		  $scope.isClean = function() {
		    return angular.equals(original, $scope.user);
		  };

		  $scope.destroy = function() {
		    original.remove().then(function() {
		      $location.path('/');
		    });
		  };

		  $scope.save = function() {
		    $scope.user.post($scope.user._id).then(function() {
		      $location.path('/');
		    });
		  };
	}
])

.controller('userCtrl', ['$scope', 'Restangular', 'LoginManager', '$location',
	function($scope, Restangular, LoginManager, $location) {

		$scope.userData = {
			password: '',
			email: '',
			name: '',
			address: '',
			user_type: {
				name 	: "Customer", 
				canBuy	: true, 
				canSell	: false
			}
		};

		$scope.$watch('userData.user_type.canSell', function(newValue) {
			if ($scope.userData.user_type.canSell) {
				$scope.userData.user_type.name = "Producer";
			} else {
				$scope.userData.user_type.name = "Customer";
			}
		});


		$scope.submitForm = function() {
			Restangular.all('api/user').post($scope.userData).then(function(user) {
			      LoginManager.login('local', user);
				  $location.path('/thankyou');
				  
			    });
		};
	}
])

.controller('signupInvoiceCtrl', ['$scope', '$rootScope',
	function ($scope, $rootScope) {
		if ($rootScope.currentUser !== null && $rootScope.currentUser.user_type.name === 'Customer') {
			$scope.cost = '$60';
			$scope.membership = 'ONE CUSTOMER MEMBERSHIP SHARE';
		}
		else if ($rootScope.currentUser !== null && $rootScope.currentUser.user_type.name === 'Producer') {
			$scope.cost = '$120';
			$scope.membership = 'ONE PRODUCER MEMBERSHIP SHARE';
		}
		else {
			$scope.cost = '';
			$scope.membership = 'Oops Sorry! Something went wrong and you are not signed in.';
		}
	}
])

.controller('geoCtrl', ['$scope',
	function($scope) {

		$scope.addressOptions = {
			country: 'nz',
		};
		$scope.details = {};

	}
])

.controller('producerListCtrl', ['$scope', '$filter', 'ProducerList',
	function($scope, $filter, ProducerList) {
		ProducerList.getData(function(result) {
			$scope.producerList = result;
		});

		$scope.predicate = 'dateJoined';

	}
])

.controller('modalInstanceCtrl', ['$scope', '$modalInstance', 'data',
	function($scope, $modalInstance, data) {

		$scope.data = data;

		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}
])

.controller('productUpload', ['$scope', '$rootScope', '$modal', 'ProductManager', 'ProductHistory', 'Restangular',
	function($scope, $rootScope, $modal, ProductManager, ProductHistory, Restangular) {
		$scope.productManager = ProductManager;
		
		$scope.ingredients = false; //show or hide ingredients field
		$scope.onSelect = function ($item, $model, $label) {
		    $scope.$item = $item;
		    $scope.$model = $model;
		    $scope.$label = $label;
		};
		$scope.categoryPromise = $scope.productManager.productCategoryPromise;
		
		
		
		
		//$scope.availableUnits = ["kg","g","10kg","L","750ml","jar","bottle","unit"];
		
        
		ProductHistory.getData(function(result) {
			$scope.data = result;
		});

		$scope.predicate = 'dateUploaded';

		$scope.delete = function(idx) {
			var itemToDelete = $scope.data[idx];
			$scope.data.splice(idx, 1);
		};

		$scope.editProduct = function(product) {
			$scope.productData = product;
			console.log($scope.productData);
			// pass product to productUpload controller $scope.productData
		};
		
		
		$scope.producerName = function() {
			var el = "";
			if ($rootScope.currentUser.hasOwnProperty('name')) {
				el = $rootScope.currentUser.name;
			}
			else {
				el = "No Producer details saved";
			}
			return el;
		};
		
		$scope.producerCompany = function() {
			var el = "";
			if ($rootScope.currentUser.producerData.hasOwnProperty('companyName')) {
				el = $rootScope.currentUser.producerData.companyName;
			}
			else {
				el = "No Producer Company saved";
			}
			return el;
		};
		
		
		$scope.setCategory = function(category) {
			$scope.productData.category = category;
			return $scope.productData.category;
		};
		
		$scope.productData = {
			producerName: $scope.producerName(),
			producerCompany: $scope.producerCompany(),
			producer_ID: $rootScope.currentUser._id,
			refrigeration: 'none'
		};

		var certifications = Restangular.all('api/certification');
		
		certifications.getList().then(function(certification) {
			$scope.certifications = certification;
			$scope.productData.certification = $scope.certifications[0].name;
		});

		$scope.submitForm = function() {
			ProductManager.registerProduct($scope.productData);
		};
		
		$scope.imageChoices = ['image1', 'image2', 'image3'];
		
		$scope.open = function() {
			var modalInstance = $modal.open({
				templateUrl: 'partials/cropme-modal.html',
				controller: 'imageModalEditorCtrl',
				size: 'md',
				resolve: {
					data: function() {
						return $scope.imageChoices;
					}
				}
			});
			
			modalInstance.result.then(function (selectedImg) {
				$scope.productData.img = selectedImg;
			}, function () {
				console.log('Modal dismissed at: ' + new Date());
			});
		};
		
	}

])

.controller('imageModalEditorCtrl', ['$scope', '$sce', '$modalInstance', 'data', '$rootScope',
	function($scope, $sce, $modalInstance, data, $rootScope) {
		$scope.imageChoices = data;

		$scope.selected = {
			image: $scope.imageChoices[0]
		};

		$scope.ok = function() {
			$rootScope.$broadcast("cropme:ok");
			// $modalInstance.close($scope.selected.image);
		};

		$scope.cancel = function() {
			$rootScope.$broadcast("cropme:cancel");
			$modalInstance.dismiss('never mind');
		};

		$scope.$on("cropme:done", function(e, blob, canvasEl) {
			console.log(blob);
			var fileURL = URL.createObjectURL(blob);
			$scope.selected.image = $sce.trustAsResourceUrl(fileURL);
            $modalInstance.close($scope.selected.image);
		});
	}
])


.controller('producerCtrl', ['$scope', '$rootScope', '$sce', 'ProducerManager', '$location', '$modal',
	function($scope, $rootScope, $sce, ProducerManager, $location, $modal) {
		
		if ($rootScope.currentUser.producerData.logo === true) {
			ProducerManager.getProducerLogo(true);
		}
		
		$scope.submitForm = function() {
			ProducerManager.saveProducer();
			//$location.path('/product-upload');
		};

	}
])

.controller('orderTableCtrl', ['$scope', '$filter', 'OrderRecords',
	function($scope, $filter, OrderRecords) {
		$scope.orders = OrderRecords.getOrders();

		$scope.predicate = 'product';

		$scope.total = OrderRecords.sumSales();

	}
])

.controller('cartTableCtrl', ['$scope', '$filter', 'CartRecords',
	function($scope, $filter, CartRecords) {
		$scope.cart = CartRecords.getCart();

		$scope.$watch('$scope.cart.quantity', function(newValue) {
			$scope.total = CartRecords.sumPrice($scope.cart);
		});

		$scope.total = CartRecords.sumPrice($scope.cart);

		$scope.delete = function(idx) {
			var itemToDelete = $scope.cart[idx];
			$scope.cart.splice(idx, 1);
			$scope.total = CartRecords.sumPrice($scope.cart);
		};


		//  API.DeleteItem({ id: itemToDelete.id}, function (success) {
		//	  $scope.cart.splice(idx, 1);
		//  })

	}
])

.controller('contactCtrl', ['$scope', 'MailManager',
	function($scope, MailManager) {

		$scope.mail = {
			name: '',
			email: '',
			subject: '',
			message: '',
		};

		$scope.submitForm = function() {
			MailManager.sendMail($scope.mail);
		};


	}
])

.controller('storeCtrl', ['$scope', '$filter', '$modal', 'Restangular', 'ProductManager',
	function($scope, $filter, $modal, Restangular, ProductManager) {
		$scope.products = Restangular.all('api/product').getList().$object;
        $scope.productManager = ProductManager;
		$scope.sort="alphabetical";
		
		$scope.blurb = function(string, length, link) {
			if (string.length < length) {
				return string.splice(0, length) + '<button class="btn btn-link" ng-click="open('+link+')"> more...</button>';
			}
			else {
				return string;
			}
		};
		
		for (var i = $scope.products.length - 1; i >= 0; i--) {
			var product = $scope.products[i];
			$scope.products[i].shortDescription = $scope.blurb($scope.products[i].description, 200, product);
		}
		
		$scope.addToCart = function(product) {
			console.log("user added an item to the cart");
		};
		
		$scope.open = function(product) {
			console.log('$scope.open got called for' + product);
			var modalInstance = $modal.open({
				templateUrl: 'partials/store-modal.html',
				controller: 'modalInstanceCtrl',
				size: 'lg',
				resolve: {
					data: function() {
						return product;
					}
				}
			});

			modalInstance.result.then(function(selectedItem) {
				$scope.selected = selectedItem;
			}, function() {
				console.log('Modal dismissed at: ' + new Date());
			});
			
			$scope.addToCart = function(product) {
				console.log("user added an item to the cart from the modal");
			};
		};

	}

])
.controller('calendarCtrl', ['$scope',
	function($scope) {
		
	}
])

.controller('productUICtrl', ['$scope', '$timeout',
	function($scope, $timeout) {
		var timer;

		$scope.callDelayed= function () {
			if(timer){
				$timeout.cancel(timer);
			}
			timer = $timeout(function(){
				$scope.detailsVisible = true;// run code
                timer = undefined;
			}, 1000);
		};

		$scope.callCancelled = function() {
			$timeout.cancel(timer);
		};

		$scope.$on("$destroy", function(event) {
			$timeout.cancel(timer);
		});
	}
]);
