'use strict';
/*global angular, _*/

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

.controller('loginCtrl', ['$scope', '$rootScope', '$location', 'LoginManager',
	function($scope, $rootScope, $location, LoginManager) {		
		$scope.showLogin = false;

		$scope.loginData = {
			email: '',
			password: '',
			rememberMe: false
		};

		$scope.submitForm = function(message) {
			LoginManager.login('local', $scope.loginData, function() {
				if ($rootScope.savedLocation) {
					$location.path($rootScope.savedLocation);
				}
			});
		};
	}
])

// Used by Forgot page for requesting a password reset for a user
.controller('forgotCtrl', ['$scope', '$location', 'Restangular',
	function($scope, $location, Restangular) {
		$scope.passwordReset = function() {
			Restangular.all('api/forgot').post({email: $scope.email});
		};
	}
])

.controller('userAdminCtrl', ['$scope', 'UserManager', '$location',
	function($scope, UserManager, $location) {
		$scope.userLibrary = UserManager.users.getlist().$object;
	}
])

.controller('userEditCtrl', ['$scope', '$rootScope', 'LoginManager', 'Restangular', '$route', 'user',
	function($scope, $rootScope, LoginManager, Restangular, $route, user) {
		
		var original = user;
		
		$scope.user = Restangular.copy(original);
  
  		$scope.$watch('user.user_type.canSell', function(newValue) {
  			if ($scope.user.user_type.canSell) {
  				$scope.user.user_type.name = "Producer";
  			} else {
  				$scope.user.user_type.name = "Customer";
  			}
  		});
		  
		$scope.isClean = function() {
			return angular.equals(original, $scope.user);
		};

		$scope.destroy = function() {
			var lastChance = confirm('Are you sure you want to delete the profile of ' + user.name +'?');
			if (lastChance) {
				if ($scope.user._id === $rootScope.currentUser._id) {
					LoginManager.logout();
				}
				original.customDELETE(original._id).then(function() {
					$rootScope.flash.setMessage('User successfully Deleted');
					$route.reload();
				});
			}
		};
		
		// sends a request for a password reset email to be sent to this user's email.
		$scope.passwordReset = function() {
			Restangular.all('api/forgot').post({email: original.email});
		};
		
		$scope.save = function() {
			if (!$scope.isClean()) {
				$scope.user.post($scope.user._id).then(function(response) {
					// success!
					$rootScope.flash.setMessage('Details saved successfully');
				});
			}
			else {
				return;
			}
			
		};
	}
])

.controller('resetCtrl', ['$scope', 'Restangular', '$location', 'user', 'LoginManager', 
	function($scope, Restangular, $location, user, LoginManager){
		$scope.user = Restangular.copy(user);
				
		$scope.save = function() {
			Restangular.one('reset', $scope.user.resetPasswordToken).customPOST({password: $scope.user.password}).then(function(result) {
				LoginManager.login('local', {
					email: result.email,
					password: $scope.user.password,
					rememeberMe: false
				});
			});
		};
}])

.controller('invoiceCtrl', ['$scope', '$rootScope', 'Restangular', 
	function($scope, $rootScope, Restangular){
		$scope.now = new Date();
		
		$scope.soon = $scope.now.setDate($scope.now.getDate() - 7);
		
		// the array of invoices for use in the template
		$scope.invoices = Restangular.all('api/invoice').getList().$object;
		
		// update the invoice
		$scope.invoiceSave = function (invoice) {
			invoice.put().then(function(result) {
				if (result === "Accepted") {
					invoice.alert = {
						message: "Invoice Successfully updated",
						type: "success"
					};
					$scope.unPaid();
					$scope.overdue();
				}
				else {
					invoice.alert = {
						message: "Sorry! Failed to update the invoice for some reason",
						type: "danger"
					};
				}
				
			});
		};
		
		$scope.unPaid = function() {
			var match;
			match = _.where($scope.invoices, {status: 'un-paid'});
			return match.length;
		};
		
		$scope.overdue = function() {
			var match;
			match = _.where($scope.invoices, {status: 'OVERDUE'});
			return match.length;
		};
		
}])


.controller('userCtrl', ['$scope', 'Restangular', 'UserManager', '$location',
	function($scope, Restangular, UserManager, $location) {

		$scope.userData = {
			cost: 60,
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
				$scope.userData.cost = 120;
			} else {
				$scope.userData.user_type.name = "Customer";
				$scope.userData.cost = 60;
			}
		});


		$scope.submitForm = function() {
			UserManager.createUser($scope.userData);
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

.controller('producerPageCtrl', ['$scope', 'Restangular', 'producer',
	function($scope, Restangular, producer) {
		$scope.producer = producer.plain();
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

.controller('productUpload', ['$scope', '$rootScope', '$modal', '$sce', 'ProductManager', 'ProductHistory', 'Restangular',
	function($scope, $rootScope, $modal, $sce, ProductManager, ProductHistory, Restangular) {
		// make ProductManager methods available in the template
		$scope.productManager = ProductManager;
		
		$scope.ingredients = false;
		$scope.onSelect = function ($item, $model, $label) {
		    $scope.$item = $item;
		    $scope.$model = $model;
		    $scope.$label = $label;
		};
        
		ProductHistory.getData(function(result) {
			$scope.data = result;
		});

		$scope.predicate = 'dateUploaded';

		$scope.delete = function(idx) {
			var itemToDelete = $scope.data[idx];
			$scope.data.splice(idx, 1);
		};
		
		// pass product to $scope.productData for editing in the main form
		$scope.editProduct = function(product) {
			$scope.productData = product;
			console.log($scope.productData);
			
		};
		
		$scope.setCategory = function(category) {
			$scope.productData.category = category;
			return $scope.productData.category;
		};
		
		$scope.productData = {};
		
		$scope.productData.producer_ID = $rootScope.currentUser._id;		
		$scope.productData.refrigeration = 'none';

		var certifications = Restangular.all('api/certification');
		
		certifications.getList().then(function(certification) {
			for (var i = 0; i < certification.length; i++) {
				certification[i].plain();
			}
			$scope.certifications = certification;
			$scope.productData.certification = $scope.certifications[0]._id;
			$scope.certificationImg = function(id) {
				var el = _.findWhere($scope.certifications, {_id: $scope.productData.certification});
				return el.img;
			};
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
				var reader = new window.FileReader();
				reader.readAsDataURL(selectedImg);
				reader.onloadend = function() {
					$scope.productData.img = reader.result;
					var fileURL = URL.createObjectURL(selectedImg);
					$scope.selectedImg = $sce.trustAsResourceUrl(fileURL);
				};				
				
			}, function () {
				console.log('Modal dismissed at: ' + new Date());
			});
		};
		
	}

])

.controller('imageModalEditorCtrl', ['$scope', '$modalInstance', 'data', '$rootScope',
	function($scope, $modalInstance, data, $rootScope) {
		$scope.imageChoices = data;

		$scope.selected = {
			image: $scope.imageChoices[0]
		};

		$scope.ok = function() {
			$rootScope.$broadcast("cropme:ok");
		};

		$scope.cancel = function() {
			$rootScope.$broadcast("cropme:cancel");
			$modalInstance.dismiss('never mind');
		};

		$scope.$on("cropme:done", function(e, blob, canvasEl) {
            $modalInstance.close(blob);
		});
	}
])


.controller('producerCtrl', ['$scope', '$rootScope', 'ProducerManager', '$location',
	function($scope, $rootScope, ProducerManager, $location) {
		
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
.controller('contactCtrl', ['$scope', 'MailManager', '$location',
	function($scope, MailManager, $location) {		
		$scope.mail = {
			name: '',
			email: '',
			subject: '',
			message: ''
		};
		
		$scope.submitForm = function(message) {
			MailManager.mail($scope.mail);
			$location.path("/page");
		};


	}
])
.controller('producerContactCtrl', ['$scope', 'MailManager', '$location', 'producer',
	function($scope, MailManager, $location, producer) {		
		$scope.mail = {
			to: '',
			name: '',
			email: '',
			subject: '',
			message: ''
		};
		
		$scope.producer = producer.plain();
		$scope.mail.to = $scope.producer.email;
		$scope.mail.toName = $scope.producer.name;
		console.log('mail is to be sent to: ' + $scope.mail.toName + " " + $scope.mail.to);
		
		
		
		$scope.submitForm = function(message) {
			MailManager.mail($scope.mail);
			$location.path("/page");
		};


	}
])

.controller('storeCtrl', ['$scope', '$filter', '$modal', '$sce', 'Restangular', 'ProductManager',
	function($scope, $filter, $modal, $sce, Restangular, ProductManager) {
		$scope.products = Restangular.all('api/product').getList().$object;
        $scope.productManager = ProductManager;
		$scope.sort="alphabetical";
		
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
