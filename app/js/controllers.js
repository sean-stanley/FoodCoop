'use strict';
/*global angular, _, Date*/

/* Controllers */

angular.module('co-op.controllers', []).
    controller('MyCtrl1', [
    	function() {

    	}
    ])
	
	.controller('navCtrl', ['$scope', '$location', '$position',
		function($scope, $location, $position) {
			// init
			$scope.predictiveSearch = [];
			
			
			// methods
			
			$scope.isActive = function(route) {
				return route === $location.path();
			};
			
			$scope.storePage = function() {
				if ($location.path() === '/store') {
					return true;
				}
				else return false;
			};
			
			// location logic
			
			$scope.searchObject = $location.search();
			
			if ($scope.searchObject.menu) {
				$scope.panelDisplay = true;
			}
			
			if ($scope.searchObject.search) {
				$scope.search = $scope.searchObject.search;
			}
			
			// watches
			
			$scope.$watch('panelDisplay', function(newValue) {
				if (newValue === true) {
					$location.search('menu', true);
				}
				else {
					$location.search('menu', null);
				}
			});
			
			$scope.$watch('search', function(newValue) {
			// if newValue is falsey
			if (!newValue) {
				$location.search('search', null);
			}
			else {
				$location.search('search' , newValue);
			}
			
			$scope.$on("$routeUpdate", function() {
				$scope.search = $location.search().search;
			});
			
			// events
			
			$scope.$on('PREDICTIVE_SEARCH', function(event, list) {
				$scope.predictiveSearch = list;
				console.log($scope.predictiveSearch);
			});
		});
			

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

.controller('userAdminCtrl', ['$scope', 'users', '$location',
	function($scope, users) {
		$scope.userLibrary = users.getList().$object;
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

// This is used on the store page
.controller('modalInstanceCtrl', ['$scope', '$location', '$modalInstance', 'data',
	function($scope, $location, $modalInstance, data) {
		
		$scope.data = data;
		
		function producer() {
			return data.producer_ID.producerData.companyName || data.producer_ID.name;
		}
		
		$location.hash(data.fullName + "+" + producer()+ "&id=" + data._id);
		
		$scope.addToCart = function(product) {
			$modalInstance.close($scope.data);
			
		};

		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}
])

.controller('productHistoryCtrl', ['$scope', '$http', 'ProductHistory',
	function($scope, $http, ProductHistory) {

		ProductHistory.getCurrentProducts(function(result) {
			$scope.currentProducts = result;
		});
		
		ProductHistory.getRecentProducts(function(result) {
			$scope.lastMonthProducts = result;
		});
		
		ProductHistory.getAllProducts(function(result) {
			$scope.allProducts = result;
		});

		$scope.predicate = 'dateUploaded';

		$scope.delete = function(idx) {
			var itemToDelete = $scope.currentProducts[idx];
			$scope.currentProducts.splice(idx, 1);
			$http({method: 'DELETE', url: 'api/product/', data: itemToDelete}).then(function(status) {
				console.log(status);
			});
		};
	}
])

.controller('productUploadCtrl', ['$scope', '$rootScope', '$modal', '$sce', 'ProductManager', 'Restangular', 'product',
	function($scope, $rootScope, $modal, $sce, ProductManager, Restangular, product) {
		// make ProductManager methods available in the template
		$scope.productData = product;
		$scope.productData.refrigeration = product.refrigeration || 'none';
		
		$scope.selectedImg = $scope.productData.img || null;
		
		$scope.productManager = ProductManager;
		
		$scope.ingredients = false;
		
		// pass product to $scope.productData for editing in the main form
		$scope.editProduct = function(product) {
			$scope.productData = product;
			console.log($scope.productData);
		};
		
		$scope.setCategory = function(category) {
			$scope.productData.category = category;
			return $scope.productData.category;
		};

		var certifications = Restangular.all('api/certification');
		
		certifications.getList().then(function(certification) {
			for (var i = 0; i < certification.length; i++) {
				certification[i].plain();
			}
			$scope.certifications = certification;
			$scope.productData.certification = product.certification || $scope.certifications[0]._id;
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
		};

	}
])

.controller('productOrderCtrl', ['$scope', 'myOrders', 'products', 'Calendar', 'ProductHistory', 
	function($scope, myOrders, products, Calendar, ProductHistory) {
		myOrders.getList().then(function(orders) {
			$scope.orders = orders.plain();
			
			Calendar.currentMonth(orders, 'datePlaced', function(result) {
				$scope.currentOrders = result;
			});
			
			Calendar.lastMonth(orders, 'datePlaced', function(result) {
				$scope.recentOrders = result;
			});
						
			$scope.orderTotal = function(list) {
				var total;
				for (var i = 0; i < list.length; i++) {
					total += list[i].orderPrice;
				}
				return total;
			};
			
			$scope.sortedOrders = [];
			
			var sort = function(order, idx, orders) {
				var allOneCustomersOrders, sortedObject, key;
				
				allOneCustomersOrders = _.where(orders, {customer: {_id: order.customer._id}});
				
				sortedObject = {
						customer: order.customer.name,
						_id : order.customer._id,
						orders : allOneCustomersOrders
				};
				
				for (key in $scope.sortedOrders) {
					if ($scope.sortedOrders.hasOwnProperty(key)) {
						if (key._id !== sortedObject._id) {
							
						}
					}
				}
				
				$scope.sortedOrders.push(sortedObject);
			};
			
			$scope.currentOrders.forEach(sort);
			console.log($scope.sortedOrders);
		});
		
		ProductHistory.getCurrentProducts(function(products) {
			$scope.currentProducts = products;
		});
		
		ProductHistory.getRecentProducts(function(products) {
			$scope.recentProducts = products;
		});
		
		$scope.products = products.getList().$object; 
				
		$scope.isOrdered = function(id) {
			var numOrdered;
			var ordersOfProduct = _.where($scope.orders, { product : {_id: id} });
			if (ordersOfProduct.hasOwnProperty('length') ) {
				for (var i = 0; i < ordersOfProduct.length; i++) {
					numOrdered += ordersOfProduct[i].quantity;
				}
			}
			return 0;
		};
		
		$scope.lastMonth = Date.today().add(-1).months().toString('MMMM');
		$scope.predicate = 'product';
	}
])

.controller('cartPageCtrl', ['$scope', '$rootScope', 'Cart',
	function($scope, $rootScope, Cart) {
		$scope.cart = [];
		
		Cart.getCurrentCart(function(cart) {
			$scope.cartProduct_ids = [];
			$scope.cart = cart;
			getIds();
			
			
		});
		
		$scope.cartTotal = function(cart) {
			$scope.total = 0;
			if (Object.prototype.toString.call( cart ) === '[object Array]') {
				for(var i=0; i < cart.length; i++) {
				$scope.total += (cart[i].unitPriceWithMarkup * cart[i].quantity); 
				}
			}
			return $scope.total;
		};
	
		$scope.delete = function(idx) {
			var itemToDelete = $scope.cart[idx];
			Cart.deleteItem($scope.cart[idx]._id);
			$scope.cart.splice(idx, 1);
			$scope.cartTotal();
			for (var i = 0; i < $scope.cartProduct_ids.length; i++) {
				if ($scope.cartProduct_ids[i] === itemToDelete.product._id) {
					$scope.cartProduct_ids.splice(i, 1);
				}
			}
			// for the store page:
			$rootScope.$broadcast('CART_IDS', $scope.cartProduct_ids);
		};
		
		// update the cart on valid quantity changes and reset it on invalid ones;
		$scope.$watchCollection(watchQuantity, function(newValue, oldValue) {
			
			if (oldValue.length >= 1 && newValue.length >= 1) {
				$scope.oldQuantities = oldValue;
			}
			else {
				$scope.oldQuantities = newValue;
			}
			
		});
		
		function watchQuantity () {
			if ($scope.cart) {
				return $scope.cart.map(function(item, idx) {
					return item.quantity;
				});
			}
		}
		
		$scope.quantityChange = function (idx) {
			var item, message, areYouSure;
			item = $scope.cart[idx];
			message = "Are you sure you want to change the amount of " + item.product.productName + " you are ordering to: " + item.quantity + "?";
			
			areYouSure = confirm(message);
			if (areYouSure) {
				Cart.updateItem(item, function(result) {
					if (result === "OK") {
						$scope.cartTotal();
					}
					else {
						// make a message on the store page
						$scope.$emit('CANNOT_UPDATE_CART', result);
						$scope.cart[idx].quantity = $scope.oldQuantities[idx];
					}
					
				});
			}
			else {
				$scope.cart[idx].quantity = $scope.oldQuantities[idx];
			}
		};
		
		
		
		
		// only for the store.html page use of this controller
		
		function getIds() {
			$scope.cart.forEach(function(item) {
				$scope.cartProduct_ids.push(item.product._id);
			});
			$rootScope.$broadcast('CART_IDS', $scope.cartProduct_ids);
		}
		
		$scope.$on('UPDATE_CART', function(event, item){
			console.log(item);
			$scope.cart.push(item);
			$scope.cartProduct_ids.push(item.product._id);
			$rootScope.$broadcast('CART_IDS', $scope.cartProduct_ids);
		});
		
		$scope.open = function(item) {
			$rootScope.$broadcast('OPEN_PRODUCT', item);
		};
		
		

	}
])
.controller('cartHistoryCtrl', ['$scope', 'Cart', function($scope, Cart) {
	Cart.getAllItems(function(items) {
		$scope.cartHistory = items;
	});
}])


.controller('contactCtrl', ['$scope', 'MailManager', '$route',
	function($scope, MailManager, $route) {		
		$scope.mail = {
			name: '',
			email: '',
			subject: '',
			message: ''
		};
		
		$scope.submitForm = function(mail) {
			MailManager.mail(mail, function() {
				$route.reload();
			});
			
		};


	}
])
.controller('producerContactCtrl', ['$scope', 'MailManager', '$location', 'member',
	function($scope, MailManager, $location, member) {				
		$scope.mail = {
			to: '',
			toName: '',
			name: '',
			email: '',
			subject: '',
			message: ''
		};
		
		$scope.member = member.plain();
		$scope.mail.to = $scope.member.email;
		$scope.mail.toName = $scope.member.name;
				
		$scope.submitForm = function(message) {
			MailManager.mail($scope.mail);
			$location.path("/page");
		};
	}
])

.controller('storeCtrl', ['$scope', '$rootScope', '$location', '$routeParams', '$modal', 'Restangular', 'Cart',
	function($scope, $rootScope, $location, $routeParams, $modal, Restangular, Cart) {
		$scope.searchObject = $location.search();
		console.log($routeParams);
		console.log($location.path());
		
		$scope.predictiveSearch = [];
		
		// initiate filter object
		$scope.filter = {};
		$scope.filter.category = {};
		$scope.filter.category.name = "";
		
		
		if ($scope.searchObject) {
			for (var key in $scope.searchObject) {
				if ($scope.searchObject.hasOwnProperty(key)) {
					switch (key) {
						case 'category':
							$scope.filter.category.name = $scope.searchObject[key];
							break;
						case 'sort':
							if ( $scope.searchObject[key] === 'producer') {
								$scope.sort = 'producer_ID.producerData.companyName';
							}
							else $scope.sort = $scope.searchObject[key];
							break;
						case 'reverse':
							$scope.reverse = $scope.searchObject[key];
							break;
						default:
							console.log("no match found for " + key);
							
					}
				}
			}
		}
		
		
		var findCartItems = function() {
			if ($scope.cartProduct_ids && $scope.products) {
				$scope.products.forEach(function(product, idx, collection) {
					if ( _.contains($scope.cartProduct_ids, product._id) ) {
						product.AlreadyInCart = true;
					}
					else product.AlreadyInCart = false;
				});
			}
		};
		
		// initiate the real-time message container
		$scope.message = {type: 'danger', closeMessage: function() {if (this.message) this.message = null;} };
		
		Restangular.all('api/product').getList().then(function(products){
			$scope.products = products.plain();
			
			// deal with all hash and search on product successful load;
			(function() {
				var hashID, product, key, searchObject;
				// if we need to open a product modal
				if ($location.hash()) {
					hashID = $location.hash().split('&id=');
					hashID = hashID[1];
					product = _.findWhere($scope.products, {_id: hashID});
					$scope.open(product);
				}
				
			}());
			
			
			// this will do nothing if the products are loaded before the cart is ready
			// or no user is logged in
			findCartItems();
			
			//create array of useful typeahead texts
			$scope.products.forEach(function(product) {
				$scope.predictiveSearch.push(product.fullName);
				$scope.predictiveSearch.push(product.variety);
				$scope.predictiveSearch.push(product.productName);
				$scope.predictiveSearch.push(product.category.name);
				$scope.predictiveSearch.push(product.certification.name);
				if ( product.hasOwnProperty('ingredients') && product.ingredients instanceof Array ) {
					product.ingredients.forEach(function(item) {
						$scope.predictiveSearch.push(item);
					});
				}
				$scope.predictiveSearch.push(product.producer_ID.producerData.companyName);
				$scope.predictiveSearch.push(product.producer_ID.name);
			});
			
			$rootScope.$broadcast('PREDICTIVE_SEARCH', $scope.predictiveSearch);
			
		});
				
		// open the modal
		$scope.open = function(product) {
			var modalInstance = $modal.open({
				templateUrl: 'partials/store/store-modal.html',
				controller: 'modalInstanceCtrl',
				size: 'lg',
				resolve: {
					data: function() {
						return product;
					}
				}
			});

			modalInstance.result.then(function(product) {
				$location.hash('');
				$scope.addToCart(product);
				
			}, function() {
				$location.hash('');
				console.log('Modal dismissed at: ' + new Date());
			});
		};
		
		$scope.$on('OPEN_PRODUCT', function(event, item) {
			if ($scope.products) {
				var product = _.find($scope.products, {_id: item.product._id});
				$scope.open(product);
			}
			else console.log("can't open product because it's undefined currently");
		});
		
		$scope.$on('NOT_IN_CART', function(event, id) {
			if ($scope.products) {
				findCartItems();
			}
		});
		
		$scope.$on('CANNOT_UPDATE_CART', function(event, message) {
			$scope.message.message = message;
		});
		
		// if the user has items in their cart that are also in the store
		// flag those items with the bool AlreadyInCart = true;
		$scope.$on('CART_IDS', function(event, cartProduct_ids) {
			$scope.cartProduct_ids = cartProduct_ids;
			// this will do nothing if the cart is loaded before the products are ready
			findCartItems();
		});
		
		// A very important function :-)
		$scope.addToCart = function(product) {
			if ($rootScope.currentUser) {
				var order = {
				product: product._id,
				customer: $rootScope.currentUser._id,
				supplier: product.producer_ID._id,
				quantity: 1
				};
				// This is where the magic really happens
				Cart.addToCart(order, function(cartOrder){
					if (cartOrder === "Sorry, you can't try to buy your own products") {
						$scope.message.message = cartOrder;
					}
					else {
						$rootScope.$broadcast('UPDATE_CART', cartOrder);
						Cart.getTally();
						$scope.panelDisplay = true;
					}
				});
			}
			else {
				var modalInstance = $modal.open({
				templateUrl: 'partials/store/not-a-member.html',
				size : 'sm'
				});
			}
			
		};
		
		// route params
				
		$scope.$watch('filter.category.name', function(newValue) {
			// if newValue is falsey
			if (!newValue) {
				$location.search('category', null);
			}
			else {
				$location.search('category' , newValue);
			}
		});
		
		$scope.$watch('sort', function(newValue) {
			// if newValue is falsey
			if (!newValue) {
				$location.search('sort', null);
			}
			else {
				if (newValue === 'producer_ID.producerData.companyName') {
					newValue = 'producer';
				}
				$location.search('sort' , newValue);
			}
		});
		
		$scope.$watch('reverse', function(newValue) {
			// if newValue is falsey
			if (!newValue) {
				$location.search('reverse', null);
			}
			else {
				$location.search('reverse' , true);
			}
		});

	}

])
.controller('calendarCtrl', ['$scope', 'Calendar',
	function($scope, Calendar) {
		$scope.daysLeftUntilDeliveryDay = Calendar.daysUntil(Calendar.deliveryDay());
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
