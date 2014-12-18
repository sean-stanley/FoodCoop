'use strict';
/*global angular, _, Date, oboe*/

/* Controllers */

angular.module('co-op.controllers', [])
	
.controller('navCtrl', ['$scope', '$location', 'flash',
	function($scope, $location, flash) {
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
				$scope.panelLeftDisplay = true;
			}
			
			if ($scope.searchObject.search) {
				$scope.search = $scope.searchObject.search;
			}
			
			// watches
			
			$scope.$watch('panelLeftDisplay', function(newValue) {
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
			});
			
			$scope.$on("$routeUpdate", function() {
				$scope.search = $location.search().search;
			});
			
			// events
			
			$scope.$on('PREDICTIVE_SEARCH', function(event, list) {
				$scope.predictiveSearch = list;
				console.log($scope.predictiveSearch);
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
					$rootScope.savedLocation = "";
				}
				else $location.path('me');
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

.controller('MessageBoardCtrl', ['$scope', 'socket', '$rootScope',
	function($scope, socket, $rootScope){
		$scope.messages = [];
		
		function update(event, msg) {
			var idx = _.findIndex($scope.messages, {_id: msg._id});
			$scope.messages[idx] = msg;
		}
		
		socket.forward('edit message');
		
		socket.on('connection', function(s) {
			console.log('successfully connected to server');
		});
		
		socket.on('message history', function(messages) {
			$scope.messages = messages;
		});
		
		socket.on('message', function(msg){
			$scope.messages.unshift(msg);
		});
		
		socket.on('edit message', update);
		
		$scope.$on('MESSAGE_EDIT_DONE', update);
		
		$scope.$on('socket:edit message', update);
		
		socket.on('remove message', function(m) {
			_.remove($scope.messages, m);
		});
		
		$scope.update = function(m) {
			$scope.$broadcast('EDIT_MESSAGE', m);
		};
		
		$scope.remove = function(m) {
			if (_.contains($scope.messages, m)) {
				_.remove($scope.messages, m);
				socket.emit('remove message', m);
			} else console.log("couldn't find m in messages");
			console.log(m);
		};
}])
.controller('CreateOrEditMessageCtrl', ['$scope', 'socket', '$rootScope',
	function($scope, socket, $rootScope){
		$scope.message = {};
		
		$scope.$on('EDIT_MESSAGE', function(event, message) {
			$scope.message = message;
		});
		
		$scope.send = function(isValid, message) {
			if (message.hasOwnProperty('_id')) $scope.update(isValid, message);
			else if (isValid && $rootScope.currentUser) {
				message.date = new Date();
				message.author = {
					_id: $rootScope.currentUser._id,
					name: $rootScope.currentUser.name
				};
				socket.emit('message', message);
				message.author.name = 'Me';
				$scope.messages.unshift(message);
				
				// reset message fields
				// $scope.message.img = undefined;
// 				$scope.message.title = undefined;
// 				$scope.message.body = undefined;
				delete $scope.message;
				
			} else $scope.submitted = true;
		};
		
		$scope.update = function(isValid, message) {
			if (isValid && $rootScope.currentUser) {
				message.update = new Date();
				$scope.$emit('MESSAGE_EDIT_DONE', message);
				socket.emit('edit message', message);
				delete $scope.message;
			} else $scope.submitted = true;
		};
		
	}])



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
			return data.producer_ID.hasOwnProperty('producerData') ? data.producer_ID.producerData.companyName : data.producer_ID.name;
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
		
		$scope.$on('CALENDAR-LOADED', function() {
			if (!$rootScope.canUpload && !$rootScope.canChange) {
				flash.setMessage({type: 'warning', message: 'Uploading is not allowed yet sorry. Please check the calendar for when uploading is open next.'});
			}
			else if ($rootScope.canChange && !$rootScope.canUpload) {
				flash.setMessage({type: 'warning', message: 'Uploading new products is not allowed right now. This month\'s products can have some properties edited though. Editable properties are enabled.'});
			}
		});
		
		$scope.newProduct = {
			refrigeration: 'none',
			img: null,
			priceWithMarkup: this.price * 1.2,
			price: undefined
		};
		
		$scope.reset = function() {
			var path = $location.path();
			// console.log(path);
			if (path !== '/product-upload') {
				$location.path('product-upload');
			}
			else $scope.productData = angular.copy($scope.newProduct);
		};
		
		$scope.productData = product || angular.copy($scope.newProduct);
		$scope.selectedImg = $scope.productData.img || null;
		$scope.productManager = ProductManager;
		$scope.ingredients = false;
		//$scope.productData.priceWithMarkup = $scope.productData.price * 1.2;
		
		$scope.$watch('productData.price', function(newValue) {
			$scope.productData.priceWithMarkup = newValue * 1.2;
		});
		
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
			// disable the save button if a product is new or an update of an old month
			if ($scope.productData._id === undefined || $rootScope.cycle !== $scope.productData.cycle ) {
				$scope.hideSave = true;
			}
			
			ProductManager.registerProduct($scope.productData, function(message) {
				$scope.$broadcast('REFRESHCURRENT');
				//$location.path('product-upload/'+id);
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
				var fileURL = URL.createObjectURL(selectedImg);
				$scope.selectedImg = $sce.trustAsResourceUrl(fileURL);
				var reader = new window.FileReader();
				reader.readAsDataURL(selectedImg);
				reader.onloadend = function() {
					console.log(reader.result);
					$scope.productData.img = reader.result;
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
			console.log('refresh');
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
					total += list[i].orderPrice ? list[i].orderPrice : list[i].product.price * list[i].quantity;
				}
				return total;
			};			
		});
		
		$scope.sortedOrders = unfullfilledOrders.getList().$object;
		
		ProductHistory.getRecentProducts(function(products) {
			$scope.recentProducts = products;
		});
		
		$scope.getCurrentProducts = function() {
			ProductHistory.getCurrentProducts(function(products) {
				$scope.currentProducts = products;
			});
		};
		
		$scope.getCurrentProducts();
				
		$scope.products = products.getList().$object; 
		
		$scope.delete = function(idx, id) {
			var itemToDelete = $scope.currentProducts[idx];
			$scope.currentProducts.splice(idx, 1);
			ProductManager.deleteProduct(id);
		};
		
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
	
		$scope.delete = function(idx, error) {
			var err = error || angular.noop;
			var itemToDelete = $scope.cart[idx];
			Cart.deleteItem($scope.cart[idx]._id).then(function() {
				$scope.cart.splice(idx, 1);
				var index = $scope.cartProduct_ids.indexOf(itemToDelete.product._id);
				if (index > -1) $scope.cartProduct_ids.splice(index, 1);

				// for the store page:
				$rootScope.$broadcast('CART_IDS', $scope.cartProduct_ids);
				$scope.cartTotal();
			}, err);
			
			
		};
		
		// only for the store.html page use of this controller
		function getIds() {
			$scope.cart.forEach(function(item) {
				$scope.cartProduct_ids.push(item.product._id);
			});
			$scope.cartProduct_ids = _.uniq($scope.cartProduct_ids, true);
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
		if (item.quantity === 0) {
			$scope.delete($scope.cart.indexOf(item), function() {
				$scope.$emit('FAILED_CART_UPDATE', $scope.lastQuantity, item._id);
			});
		}
		else if (item.quantity < 1) {
			flash.setMessage({type: 'warning', message: 'Please enter a valid quantity and try again.'});
			$scope.$emit('FAILED_CART_UPDATE', $scope.lastQuantity, item._id);
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
		
		var search = $location.search();
		
		$scope.mail.subject = search.hasOwnProperty('subject') ? search.subject : '';
		
				
		$scope.submitForm = function(message) {
			MailManager.mail($scope.mail);
			$location.path("/page");
		};
	}
])

.controller('storeCtrl', ['$scope', '$rootScope', '$location', '$routeParams', '$modal', 'LoginManager', 'flash', '$http', 'Cart',
	function($scope, $rootScope, $location, $routeParams, $modal, LoginManager, flash, $http, Cart) {
		var category, sort, reverse, productURL = 'api/product?cycle='+$rootScope.cycle;
		$rootScope.$broadcast('GET_CART');
		$scope.isProducts = true;
		
		$scope.searchObject = $location.search();
		
		$scope.predictiveSearch = [];
		$scope.category = $scope.searchObject.hasOwnProperty('category') ? $scope.searchObject.category : undefined;
		$scope.sort = $scope.searchObject.hasOwnProperty('sort') ? $scope.searchObject.sort : undefined;
		$scope.reverse = $scope.searchObject.hasOwnProperty('reverse') ? $scope.searchObject.reverse : undefined;
		
		
		var findCartItems = function() {
			if ($scope.cartProduct_ids && $scope.products) {
				$scope.products.forEach(function(product) {
					if ( _.contains($scope.cartProduct_ids, product._id) ) {
						product.AlreadyInCart = true;
					}
					else product.AlreadyInCart = false;
				});
			}
		};
		
		// initiate the real-time message container
		//$scope.message = {type: 'danger', closeMessage: function() {if (this.message) this.message = null;} };
		$scope.products = [];
		
		
		var productsStarted;
		
		function loadProducts(productURL) {
			oboe(productURL)
				.path('!.*', function(product) {
					if (product) $scope.isProducts = true;
					else $scope.isProducts = false;
				})
				.node('!.*', function( product ){
					// This callback will be called each time a new product is loaded
					$scope.products.push(product);
					console.log($scope.products.length);
					$scope.$apply();
					return oboe.drop;
				})
				.done(function() {
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
			
					$scope.predictiveSearch = _.map($scope.products, 'fullName');
					$rootScope.$broadcast('PREDICTIVE_SEARCH', $scope.predictiveSearch);
				
					return oboe.drop;
				});
		}
		
		if ($rootScope.cycle) {
			productURL = 'api/product?cycle='+$rootScope.cycle;
			loadProducts(productURL);
			productsStarted = true;
		}
		
		$rootScope.$watch('cycle', function(newValue){
			if ($rootScope.cycle && !productsStarted) {
				productURL = 'api/product?cycle='+$rootScope.cycle;
				loadProducts(productURL);
			}
		});
		
		
		// $http.get('api/product', {params: {cycle: $rootScope.cycle}}).success(function(products){
// 			console.log(products);
// 			$scope.products = products;
// 			console.log($scope.products);
//
// 			// deal with all hash and search on product successful load;
// 			(function() {
// 				var hashID, product, key, searchObject;
// 				// if we need to open a product modal
// 				if ($location.hash()) {
// 					hashID = $location.hash().split('&id=');
// 					hashID = hashID[1];
// 					product = _.findWhere($scope.products, {_id: hashID});
// 					$scope.open(product);
// 				}
// 			}());
//
//
// 			// this will do nothing if the products are loaded before the cart is ready
// 			// or no user is logged in
// 			findCartItems();
//
// 			$scope.predictiveSearch = _.map($scope.products, 'fullName');
// 			$rootScope.$broadcast('PREDICTIVE_SEARCH', $scope.predictiveSearch);
// 		});
		
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
			
			// modalInstance.opened.then(function() {
	//
	// 		});
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
				
		$scope.$watch('category', function(newValue) {
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
			if ($rootScope.canShop === false) {
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
		
		$scope.showHideDetails = function(bool) {$scope.detailsVisible = bool;};
		
		$scope.callCancelled = function() { $timeout.cancel(timer); };

		$scope.$on("$destroy", function(event) { $timeout.cancel(timer); });
	}
])

.controller('calendarCtrl', ['$scope', '$rootScope', '$http', 'Calendar',
	function($scope, $rootScope, $http, Calendar) {
		$scope.$on('CALENDAR-LOADED', function() {
			console.log('loaded!');
			$scope.countDown = Calendar.countDown;
			$scope.significantDays = Calendar.significantDays;
			$scope.nextMonth = Calendar.nextMonth;
			$scope.twoMonth = Calendar.twoMonth;
			$scope.daysBeforeOrderingStops = Calendar.daysBeforeOrderingStops;
			$scope.daysBeforeDeliveryDay = Calendar.daysBeforeDeliveryDay;
			//$scope.uploadingTime = $scope.inDateRange($scope.countDown[0].ProductUploadStart, $scope.countDown[0].ProductUploadStop);
			//$scope.shoppingTime = $scope.inDateRange($scope.countDown[0].ShoppingStart, $scope.countDown[0].ShoppingStop);
		});
		
		$scope.inDateRange = function (start, end) {
			var present, future, plural;
			if (start && start.hasOwnProperty('daysUntil') && start.hasOwnProperty('future') ) {
				plural = start.daysUntil != 1 ? 's' : '';
				future = start.future;
				if (future) return 'starts in '+ start.daysUntil + ' day'+ plural;
	
				else {
					present = end.future;
					plural = Math.abs(end.daysUntil) != 1 ? 's' : '';
					if (present) return 'closes in '+ end.daysUntil + ' day'+ plural;
					else return "is over for this month";//return 'was '+ Math.abs(end.daysUntil) + ' day'+ plural+ " ago";
				}
			}
			return ':-D';
		};
		
		$scope.countDown = Calendar.countDown;
		$scope.significantDays = Calendar.significantDays;
		$scope.nextMonth = Calendar.nextMonth;
		$scope.twoMonth = Calendar.twoMonth;
		$scope.daysBeforeOrderingStops = Calendar.daysBeforeOrderingStops;
		$scope.daysBeforeDeliveryDay = Calendar.daysBeforeDeliveryDay;
	//	$scope.uploadingTime = $scope.inDateRange($scope.countDown[0].ProductUploadStart, $scope.countDown[0].ProductUploadStop);
	//	$scope.shoppingTime = $scope.inDateRange($scope.countDown[0].ShoppingStart, $scope.countDown[0].ShoppingStop);
		
	}	
]);
