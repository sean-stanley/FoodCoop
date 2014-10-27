'use strict';
/*global angular, _, Date*/

/* Controllers */

angular.module('co-op.controllers', [])
	
.controller('navCtrl', ['$scope', '$location', 'flash', '$swipe',
	function($scope, $location, flash, $swipe) {
			// init			
			$scope.predictiveSearch = [];
			$scope.flash = flash;
			
			// Date info for use in the app
			$scope.today = Date.today().toString("ddd d MMM yyyy");
			$scope.month = Date.today().toString("MMMM");
			$scope.monthPlusOne = Date.today().addMonths(1).toString("MMMM");
			$scope.monthPlusTwo = Date.today().addMonths(2).toString("MMMM");
			
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
			
			$scope.href = function(path) {$location.path(path);};
			
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
.controller('faqCtrl', ['$scope', '$location', '$sce', function($scope, $location, $sce){
	$scope.hash = $location.hash();
	$scope.hashFunction = function(hash) {
		$scope.hash = $scope.hash === hash ? $scope.hash = false : $scope.hash = hash;
	};
	
	var mapURL = 'http://maps.google.com/?q=2+Woods+Rd+Whangarei+New+Zealand&output=embed';
	$scope.map = $sce.trustAsResourceUrl(mapURL);
}])

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
.controller('forgotCtrl', ['$scope', 'flash', 'Restangular',
	function($scope, flash, Restangular) {
		$scope.passwordReset = function() {
			Restangular.all('api/forgot').post({email: $scope.email}).then(function(result) {
				flash.setMessage({type:'success', message: result});
			}, function(error) {
				flash.setMessage({type:'danger', message: error.message || error.data || error});
			});
		};
	}
])

.controller('userAdminCtrl', ['$scope', 'users', '$location',
	function($scope, users) {
		$scope.userLibrary = users.getList().$object;
	}
])

.controller('adminUserEditCtrl', ['$scope', '$rootScope', 'LoginManager', 'flash', 'Restangular', '$location', 'user',
	function($scope, $rootScope, LoginManager, flash, Restangular, $location, user) {
		
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
					flash.setMessage('User successfully Deleted');
					$location.path('/admin');
				});
			}
		};
		
		// sends a request for a password reset email to be sent to this user's email.
		$scope.passwordReset = function() {
			Restangular.all('api/forgot').post({email: original.email});
		};
		
		$scope.save = function() {
			if (!$scope.isClean()) {
				$scope.user.customPUT($scope.user, $scope.user._id).then(function(response) {
					// success!
					flash.setMessage({type: 'success', message: 'Changes saved successfully'});
				});
			}
			else {
				flash.setMessage({type: 'warning', message: 'No changes detected so no changes saved'});
			}
			
		};
	}
])

.controller('userEditCtrl', ['$scope', '$rootScope', 'Restangular', 'LoginManager', 'flash', 'UserManager',
	function($scope, $rootScope, Restangular, LoginManager, flash, UserManager) {

		$scope.destroy = function() {
			var lastChance = confirm('Are you sure you want to delete the profile of ' + $rootScope.currentUser.name +'?');
			if (lastChance) {
				UserManager.delCurrentUser(function() {
					LoginManager.logout();
					flash.setMessage('Account successfully Deleted');
				});
			}
		};
		
		$scope.$watch('currentUser.user_type.name', function(newValue) {
			console.log(newValue);
			if (newValue === 'Customer') {
				$rootScope.currentUser.user_type.canSell = false;
			}
		});
		
		// sends a request for a password reset email to be sent to this user's email.
		$scope.passwordReset = function() {
			Restangular.all('api/forgot').post({email: $rootScope.currentUser.email});
		};
		
		$scope.save = function() {
			UserManager.save();
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

.controller('invoiceCtrl', ['$scope', '$rootScope', 'Restangular', 'flash',
	function($scope, $rootScope, Restangular, flash) {
		$scope.now = Date();
		
		$scope.soon = function(invoice) {
			if (invoice.status === 'un-paid') {
				if ( Date.parse(invoice.dueDate).between( Date.today(), Date.today().addWeeks(1) ) ) {
					return true;
					}
			}
			
			return false;
		};
		
		// the array of invoices for use in the template
		$scope.invoices = Restangular.all('api/invoice').getList().$object;
		
		// update the invoice
		$scope.invoiceSave = function (invoice) {
			invoice.put().then(
			function(result) {
				flash.setMessage({
					message: "Invoice Successfully updated",
					type: "success"
				});
				$scope.unPaid();
				$scope.overdue();
				}, 
			function(error) {
				flash.setMessage({
					message: "Sorry! Failed to update the invoice for some reason",
					type: "danger"
				});
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
		
	}
])

.controller('userInvoiceCtrl', ['$scope', 'Restangular', '$rootScope', function($scope, Restangular, $rootScope){
	$scope.now = Date();
	$scope.invoices = Restangular.all('api/invoice').getList({invoicee : $rootScope.currentUser._id}).$object;
	$scope.soon = function(invoice) {
		if (invoice.status === 'un-paid') {
			if ( Date.parse(invoice.dueDate).between( Date.today(), Date.today().addWeeks(1) ) ) {
				return true;
				}
		}
		
		return false;
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

.controller('userCtrl', ['$scope', '$modal', '$location', 
	function($scope, $modal, $location) {
		$scope.open = function(application_type) {
			var modalInstance = $modal.open({
				templateUrl: 'partials/signup-form.html',
				controller: 'userModalCtrl',
				size: 'md',
				resolve: {
					data: function() {
						return application_type;
					}
				}
			});
			
			modalInstance.result.then(function (nextRoute) {
				console.log(nextRoute);
				$location.path(nextRoute);	
				
			}, function () {
				console.log('Modal dismissed at: ' + new Date());
			});
		};
	}
])

// signup form control
.controller('userModalCtrl', ['$scope', 'UserManager', '$modalInstance', 'data',
	function($scope, UserManager, $modalInstance, data) {
		
		$scope.data = data;
		
		$scope.userData = {
			password: '',
			email: '',
			name: '',
			address: '',
			user_type: {
				name 	: $scope.data, 
				canBuy	: true, 
				canSell	: false
			}
		};
		
		$scope.nextRoute = ($scope.data === "Producer") ? "/apply" : "/welcome";
		console.log($scope.nextRoute);
		
		$scope.submitForm = function() {
			UserManager.createUser($scope.userData).then(function() {
				$modalInstance.close($scope.nextRoute);
			}, function(error) {
				$scope.message = error;
			});
			
		};
		
		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}
])
// used on the sign up page for address finding.
.controller('geoCtrl', ['$scope',
	function($scope) {
		$scope.addressOptions = {
			country: 'nz',
		};
		$scope.details = {};
	}
])

.controller('producerApplicationCtrl', ['$scope', 'flash','certifications', '$http', "$location",
	function ($scope, flash, certifications, $http, $location) {
		certifications.getList().then(function(result) {
			$scope.certifications = result;
			$scope.producerApplication = {
				certification : $scope.certifications[0].name, // none
			};
		});
		
		$scope.submitForm = function(form) {
			$http.post('/api/producer-applicaiton', $scope.producerApplication).success(function(result) {
				flash.setMessage({type: 'success', message: 'Thank you for your application. We\'ll be in touch shortly.'});
				$location.path("welcome");
			}).error(function(error) {
				flash.setMessage({type: 'danger', message: "Error: " + (error.status || "") + " " + (error.message || error)});
			});
		};
		
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

.controller('producerPageCtrl', ['$scope', '$sce', 'Restangular', 'producer',
	function($scope, $sce, Restangular, producer) {
		$scope.producer = producer.plain();
		var mapURL = 'http://maps.google.com/?q=' + producer.address + '&output=embed';
		$scope.map = $sce.trustAsResourceUrl(mapURL);
		$scope.mapDirections = $sce.trustAsResourceUrl(mapURL);
	}
])

.controller('deliveryCtrl', ['$scope', '$rootScope', 'UserManager', 'routeManagerList',
	function($scope, $rootScope, UserManager, routeManagerList) {
		$scope.routeManagerList = routeManagerList;
		
		$scope.join = function(title) {
			$rootScope.currentUser.routeTitle = title;
			UserManager.save();
		};
	}
])

// This is used on the store page
.controller('modalInstanceCtrl', ['$scope', '$location', '$modalInstance', 'data',
	function($scope, $location, $modalInstance, data) {
		
		/*
		// facebook sdk setup
				(function(d, s, id) {
				var js, fjs = d.getElementsByTagName(s)[0];
					if (d.getElementById(id)) return;
					js = d.createElement(s);
					js.id = id;
					js.src = "//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.0";
					fjs.parentNode.insertBefore(js, fjs);
				}(document, 'script', 'facebook-jssdk'));
		
				// google+ setup
				(function() {
					var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
					po.src = 'https://apis.google.com/js/platform.js';
					var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
				})();
				
				// twitter setup
				(function(d,s,id){
					var js, fjs = d.getElementsByTagName('script')[0];
					if(!d.getElementById(id)){
						js=d.createElement(s);
						js.id=id;
						js.src="https://platform.twitter.com/widgets.js";
						fjs.parentNode.insertBefore(js,fjs);
					}
				})(document,"script","twitter-wjs");*/
		
		
		
		/*
		var twitterRenderedAttribute = function(bool){
					document.body.dataset.twttrRendered = bool;
					};
						
				twitterRenderedAttribute(true);*/
		
		
		$scope.data = data;
		
		function producer() {
			return data.producer_ID.producerData.companyName || data.producer_ID.name;
		}
		
		if (typeof $scope.data.ingredients === 'string') {
			console.log('converting string to array');
			$scope.data.ingredients = $scope.data.ingredients.split(/,\s*/);
		}
		
		if (data.hasOwnProperty('fullName') ) $location.hash(data.fullName + "+" + producer()+ "&id=" + data._id);
		
		$scope.addToCart = function(product) {
			//twitterRenderedAttribute(false);
			$modalInstance.close($scope.data);
			
		};

		$scope.cancel = function() {
			//twitterRenderedAttribute(false);
			$modalInstance.dismiss('cancel');
		};
	}
])


// main controller for product upload page
.controller('productUploadCtrl', ['$scope', '$rootScope', '$modal', '$sce', '$location', 'ProductManager', 'Restangular', 'product', 'flash',
	function($scope, $rootScope, $modal, $sce, $location, ProductManager, Restangular, product, flash) {
		// init
		if (!$rootScope.canUpload && !$rootScope.canChange) {
			flash.setMessage({type: 'warning', message: 'Uploading is not allowed yet sorry. Please check the calendar for when uploading is open next.'});
		}
		else if ($rootScope.canChange && !$rootScope.canUpload) {
			flash.setMessage({type: 'warning', message: 'Uploading new products is not allowed right now. This month\'s products can have some properties edited though. Editable properties are enabled.'});
		}
		
		$scope.productData = product || {};
		$scope.productData.refrigeration = product.refrigeration || 'none';
		$scope.selectedImg = $scope.productData.img || null;
		$scope.productManager = ProductManager;
		$scope.ingredients = false;
		$scope.productData.priceWithMarkup = $scope.productData.price * 1.2;
		
		$scope.$watch('productData.price', function(newValue) {
			$scope.productData.priceWithMarkup = newValue * 1.2;
		});
		
		
		// pass product to $scope.productData for editing in the main form
/* No longer used
		$scope.editProduct = function(product) {
			$scope.productData = product;
			console.log($scope.productData);
		};*/
		
		$scope.setCategory = function(categoryId) {
			$scope.productData.category = categoryId;
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
			ProductManager.registerProduct($scope.productData, function() {
				$scope.$broadcast('REFRESHCURRENT');
			});
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
				console.log(selectedImg);
				var reader = new window.FileReader();
				reader.readAsDataURL(selectedImg);
				reader.onloadend = function() {
					console.log(reader.result);
					$scope.productData.img = reader.result;
					var fileURL = URL.createObjectURL(selectedImg);
					$scope.selectedImg = $sce.trustAsResourceUrl(fileURL);
				};				
				
			}, function () {
				console.log('Modal dismissed at: ' + new Date());
			});
		};
		
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

		$scope.$on("cropme:done", function(e, result, canvasEl) {
            $modalInstance.close(result.croppedImage);
		});
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
		
		ProductHistory.getRecentProducts(function(result) {
			$scope.lastMonthProducts = result;
		});
		
		ProductHistory.getAllProducts(function(result) {
			$scope.allProducts = result;
		});

		$scope.predicate = 'dateUploaded';

		$scope.delete = function(idx, id) {
			var itemToDelete = $scope.currentProducts[idx];
			$scope.currentProducts.splice(idx, 1);
			ProductManager.deleteProduct(id);
		};
	}
])

.controller('producerCtrl', ['$scope', '$rootScope', 'ProducerManager', '$location',
	function($scope, $rootScope, ProducerManager, $location) {
		$scope.submitForm = function() {
			ProducerManager.saveProducer();
		};
	}
])

.controller('productOrderCtrl', ['$scope', 'myOrders', 'products', 'unfullfilledOrders', 'Calendar', 'ProductHistory', 'ProductManager',
	function($scope, myOrders, products, unfullfilledOrders, Calendar, ProductHistory, ProductManager) {
		myOrders.getList().then(function(orders) {
			$scope.orders = orders.plain();
			
			Calendar.currentMonth($scope.orders, function(result) {
				$scope.currentOrders = result;
			});
			
			Calendar.lastMonth($scope.orders, function(result) {
				$scope.recentOrders = result;
			});
						
			$scope.orderTotal = function(list) {
				var total = 0;
				for (var i = 0; i < list.length; i++) {
					total += list[i].orderPrice;
				}
				return total;
			};			
		});
		
		$scope.sortedOrders = unfullfilledOrders.getList().$object;
		
		ProductHistory.getCurrentProducts(function(products) {
			$scope.currentProducts = products;
		});
		
		ProductHistory.getRecentProducts(function(products) {
			$scope.recentProducts = products;
		});
		
		$scope.products = products.getList().$object; 
		
		$scope.delete = function(idx, id) {
			var itemToDelete = $scope.currentProducts[idx];
			$scope.currentProducts.splice(idx, 1);
			ProductManager.deleteProduct(id);
		};
		
		// @id is _id of product and @list is which month list to search for purchases		
		/*
		$scope.isOrdered = function(id, list) {
					var numOrdered = 0;
					var ordersOfProduct = _.where(list, { product : {_id: id} });
					if (ordersOfProduct !== [] ) {
						for (var i = 0; i < ordersOfProduct.length; i++) {
							numOrdered += ordersOfProduct[i].quantity;
						}
						return numOrdered;
					}
					else return 0;
				};*/
		
		
		$scope.lastMonth = Date.today().add(-1).months().toString('MMMM');
		$scope.predicate = 'product';
	}
])

.controller('cartPageCtrl', ['$scope', '$rootScope', '$location', 'Cart', 'flash',
	function($scope, $rootScope, $location, Cart, flash) {
		$scope.cart = [];
		$scope.cartProduct_ids = [];
		
		if ($rootScope.cycle) {
			Cart.getCurrentCart(function(cart) {
				$scope.cart = cart;
				getIds();
			});
		}
		
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
			var index = $scope.cartProduct_ids.indexOf(itemToDelete.product._id);
			if (index > -1) $scope.cartProduct_ids.splice(index, 1);

			// for the store page:
			$rootScope.$broadcast('CART_IDS', $scope.cartProduct_ids);
			$scope.cartTotal();
		};
		
		// only for the store.html page use of this controller
		function getIds() {
			$scope.cart.forEach(function(item) {
				$scope.cartProduct_ids.push(item.product._id);
			});
			$rootScope.$broadcast('CART_IDS', $scope.cartProduct_ids);
		}
		
		$scope.$on('GET_CART', function() {
			Cart.getCurrentCart(function(cart) {
				$scope.cart = cart;
				getIds();
			});
		});
		
		$scope.$on('UPDATE_CART', function(event, item){
			console.log(item);
			$scope.cart.push(item);
			$scope.cartProduct_ids.push(item.product._id);
			$rootScope.$broadcast('CART_IDS', $scope.cartProduct_ids);
		});
		
		$scope.$on('FAILED_CART_UPDATE', function(event, quantity, id) {
			var idx = _.findIndex($scope.cart, {_id : id});
			$scope.cart[idx].quantity = quantity;
		});
		
		$scope.open = function(item) {
			var path = $location.path();
			if (path === "/store") {
				$rootScope.$broadcast('OPEN_PRODUCT', item);
			}
			else {
				$location.path("/store");
			}
		};
	}
])
.controller('updateCartCtrl', ['$scope', '$rootScope', '$location', 'Cart', 'flash', function($scope, $rootScope, $location, Cart, flash) {
	//$scope.lastQuantity = undefined;
	
	$scope.saveNewQuantity = function(item) {
		if (item.quantity <= 0) {
			flash.setMessage({type: 'warning', message: 'Please use a valid quantity and try again.'});
		}
		else {
			Cart.updateItem(item, function(error) {
				if (error) {
					$scope.$emit('FAILED_CART_UPDATE', $scope.lastQuantity, item._id);
					console.log($scope.lastQuantity);
				}
				// success!
				else {
					$scope.lastQuantity = item.quantity;
					$scope.cartTotal();
					console.log('new lastQuantity is ' + $scope.lastQuantity);
					var path = $location.path();
					if (path === "/my-cart") {
						$rootScope.$broadcast('GET_CART');
					}
				}
			});
		}
	};
}])
.controller('cartHistoryCtrl', ['$scope', 'Cart', function($scope, Cart) {
	Cart.getAllItems(function(items) {
		$scope.cartHistory = items;
	});
}])

.controller('contactCtrl', ['$scope', 'MailManager', '$location',
	function($scope, MailManager, $location) {		
		$scope.mail = {
			name: '',
			email: '',
			message: ''
		};
		var search = $location.search();
		
		$scope.mail.subject = search.hasOwnProperty('subject') ? search.subject : '';
		
		$scope.submitForm = function(mail) {
			MailManager.mail(mail);
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

.controller('storeCtrl', ['$scope', '$rootScope', '$location', '$routeParams', '$modal', 'LoginManager', 'flash', 'Restangular', 'Cart',
	function($scope, $rootScope, $location, $routeParams, $modal, LoginManager, flash, Restangular, Cart) {
		$scope.searchObject = $location.search();
		
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
		//$scope.message = {type: 'danger', closeMessage: function() {if (this.message) this.message = null;} };
		
		Restangular.all('api/product').getList({cycle: $rootScope.cycle}).then(function(products){
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
		
		$scope.searchFor = function(term) {
			$location.search('search', term);
		};
				
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
			
			modalInstance.opened.then(function() {
				
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
				// an error returns an empty callback
				Cart.addToCart(order, function(cartOrder){
					if (cartOrder) {
						$rootScope.$broadcast('UPDATE_CART', cartOrder);
						LoginManager.getTally();
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
		
		$rootScope.$watch('canShop', function() {
			if (!$rootScope.canShop) {
				flash.setMessage({type: 'warning', message: 'Shopping is not allowed yet sorry. Please check the calendar for when shopping is open next.'});
			}
		});

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
			}, 1200);
		};
		
		$scope.$watch('detailsVisible', function() {
			console.log($scope.detailsVisible);
		});
		
		$scope.showHideDetails = function(bool) {$scope.detailsVisible = bool;};
		
		$scope.callCancelled = function() { $timeout.cancel(timer); };

		$scope.$on("$destroy", function(event) { $timeout.cancel(timer); });
	}
])

.controller('calendarCtrl', ['$scope', '$rootScope', '$http', 'Calendar',
	function($scope, $rootScope, $http, Calendar) {
		$scope.countDown = [];
		
		$http.get('/api/calendar').success(function(result) {
			$scope.significantDays = result[0];
			$scope.nextMonth = result[1];
			$scope.twoMonth = result[2];
			$rootScope.cycle = result[3];
			$rootScope.canUpload = result[4];
			$rootScope.canShop = result[5];
			$rootScope.canChange = result[6];
			
			$scope.daysBeforeOrderingStops = Calendar.daysUntil($scope.significantDays.ProductUploadStop);
			$scope.daysBeforeDeliveryDay = Calendar.daysUntil($scope.significantDays.DeliveryDay);
			
			$rootScope.$broadcast('GET_CART');
			
			var key;
			
			for (var i=0; i < 3; i ++) {
				$scope.countDown[i] = [];
				for(key in result[i]) {
					if (result[i].hasOwnProperty(key)) {
						$scope.countDown[i][key] = {
							string: key.replace(/(?=[A-Z])/g, " $&"),
							date: Date.parse(result[i][key]).toString("ddd d MMM yyyy"),
							daysUntil: Calendar.daysUntil(result[i][key]),
							future: Date.today().compareTo(Date.parse(result[i][key])) == -1 
						};
					}
				}
			}
			
			// @start, @end are objects from the $scope.countDown[i] object. i = 0 for the current month.
			$scope.inDateRange = function(start, end) {
				var present, future, plural;
				plural = start.daysUntil != 1 ? 's' : '';
				future = start.future;
				if (future) return 'starts in '+ start.daysUntil + ' day'+ plural;
			
				else {
					present = end.future;
					plural = Math.abs(end.daysUntil) != 1 ? 's' : '';
					if (present) return 'is open for '+ end.daysUntil + ' more day'+ plural;
					else return "is over for this month";//return 'was '+ Math.abs(end.daysUntil) + ' day'+ plural+ " ago";
				}
			};
			
		});
	}	
]);
