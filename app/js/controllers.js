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
			$scope.loginManager = LoginManager;
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
			$location.path('/home');
		};
	}
])

.controller('loginCtrl', ['$scope', 'LoginManager',
	function($scope, $location, LoginManager) {
		$scope.showLogin = false;

		$scope.loginData = {
			email: '',
			password: '',
			rememberMe: false
		};

		$scope.submitForm = function() {
			LoginManager.login('local', $scope.loginData, function() {
				$location.path('/my-cart')
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
		var allUsers = Restangular.all('user');

		// This will query /accounts and return a promise.
		allUsers.getList().then(function(users) {
		  $scope.userLibrary = users;
		});
		
	  $scope.destroy = function() {
	    original.remove().then(function() {
	      $location.path('/user-rights');
	    });
	  };
	}
])

.controller('userEditingCtrl', ['$scope', 'Restangular', '$location',
	function($scope, Restangular, $location) {
		
		  $scope.destroy = function(idx) {
		    $scope.userLibrary[idx].remove().then(function() {
				$scope.userLibrary.splice(idx, 1);
		    });
		  };
		  

		  $scope.save = function(idx) {
		    $scope.userLibrary[idx].put().then(function() {
		      $location.path('/user-rights');
		    });
		  };
	}
])

.controller('userCtrl', ['$scope', 'UserManager', 'LoginManager', '$location',
	function($scope, UserManager, LoginManager, $location) {

		$scope.userData = {
			password: '',
			email: '',
			name: '',
			address: '',
			user_type: UserManager.userTypes[1]
		};

		$scope.$watch('wantsToBeProducer', function(newValue) {
			if ($scope.wantsToBeProducer) {
				$scope.userData.user_type = UserManager.userTypes[2];
			} else {
				$scope.userData.user_type = UserManager.userTypes[1];
			}
		});


		$scope.submitForm = function() {
			UserManager.createUser($scope.userData, function() {
				$location.path('/thankyou');
			});
		};
	}
])

.controller('signupInvoiceCtrl', ['$scope',
	function ($scope) {
		if ($scope.currentUser != null && $scope.currentUser.user_type.name === 'Customer') {
			$scope.cost = '$60';
			$scope.membership = 'ONE CUSTOMER MEMBERSHIP SHARE';
		}
		else if ($scope.currentUser != null && $scope.currentUser.user_type.name === 'Producer') {
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
		$scope.details = '';

	}
])

.controller('producerListCtrl', ['$scope', '$filter', '$modal', 'ProducerList',
	function($scope, $filter, $modal, ProducerList) {
		ProducerList.getData(function(result) {
			$scope.producerList = result;
		});


		$scope.predicate = 'dateJoined';

		$scope.max = 5;
		$scope.isReadonly = true;

		$scope.open = function(producer) {
			var modalInstance = $modal.open({
				templateUrl: 'partials/producer-modal.html',
				controller: 'modalInstanceCtrl',
				resolve: {
					data: function() {
						return producer;
					}
				}
			});


			modalInstance.result.then(function(selectedItem) {
				$scope.selected = selectedItem;
			}, function() {
				console.log('Modal dismissed at: ' + new Date());
			});
		};

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

.controller('productUpload', ['$scope', 'ProductManager', 'ProductHistory',
	function($scope, ProductManager, ProductHistory) {
		//	  $scope.theImage = ''; //sets empty variable to be populated if user uses the input[type=file] method to upload an image

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

		$scope.ingredients = false; //show or hide ingredients field

		$scope.$watch('productData.category', function(newValue, oldValue) {
			if (newValue) {
				$scope.availableUnits = newValue.availableUnits;
				$scope.ingredients = newValue.ingredients;
			}
		});
		$scope.productData = {};

		ProductManager.productCategories(function(results) {
			$scope.categories = results;
			$scope.category = results[0]; // set produce to default
			$scope.productData.dateUploaded = Date();
			$scope.productData.category = $scope.category.name;
			$scope.availableUnits = $scope.category.availableUnits;

		});

		ProductManager.certificationTypes(function(results) {
			$scope.certifications = results;
			$scope.productData.certification = results[0].name;
		});


		$scope.submitForm = function() {
			ProductManager.registerProduct($scope.productData);
		};
		
		//$scope.setImage = function(element) {
		//  $scope.$apply(function($scope) {
		//       $scope.theImage = element.files[0];
		//      });
		//    };


	}

])

.controller('producerCtrl', ['$scope', 'ProducerManager', '$location',
	function($scope, ProducerManager, $location) {

		$scope.producerData = {
			image: '',
			logo: '',
			companyName: '',
			description: '',
		};

		$scope.submitForm = function() {
			ProducerManager.setProducer($scope.producerData);
			$location.path('/product-upload');
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

.controller('storeCtrl', ['$scope', '$filter', '$modal', 'ProductManager',
	function($scope, $filter, $modal, ProductManager) {
		$scope.products = ProductManager.products();
		
		$scope.open = function(product) {
			console.log('$scope.open got called for' + product);
			var modalInstance = $modal.open({
				templateUrl: 'partials/store-modal.html',
				controller: 'modalInstanceCtrl',
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
		};

	}

])

.controller('calendarCtrl', ['$scope',
	function($scope) {
		var date = new Date();
		var d = date.getDate();
		var m = date.getMonth();
		var y = date.getFullYear();

		$scope.eventSources = [
		{
			url: "http://www.google.com/calendar/embed?src=sean%40maplekiwi.com&ctz=Pacific/Auckland",
			className: 'gcal-event', // an option!
			currentTimezone: 'Pacific/Auckland' // an option!
		},
		];

		/* config object */
		$scope.uiConfig = {
			calendar: {
				height: 450,
				editable: false,
				header: {
					left: 'title',
					center: '',
					right: 'today prev,next'
				},
				dayClick: $scope.alertEventOnClick,
				eventDrop: $scope.alertOnDrop,
				eventResize: $scope.alertOnResize
			}
		};
	}
]);
