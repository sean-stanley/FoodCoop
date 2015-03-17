'use strict';
/*global angular, _, Date, oboe, moment*/

/* Controllers */

angular.module('co-op.controllers', [])
	
.controller('navCtrl', ['$scope', '$location', 'flash',
	function($scope, $location, flash) {
			// init			
			$scope.predictiveSearch = [];
			$scope.flash = flash;
			
			$scope.cartPanel = {open: false};
			
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
	
	var mapURL = 'https://maps.google.com/?q=2+Woods+Rd+Whangarei+New+Zealand&output=embed';
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

.controller('MessageBoardCtrl', ['$scope', 'socket', '$rootScope', 'messageHistory',
	function($scope, socket, $rootScope, messageHistory){
		$scope.messages = messageHistory;
		
		$scope.openRight = function() {
			$scope.panelRightDisplay = true;
		};
		
		function update(event, msg) {
			var idx = _.findIndex($scope.messages, {_id: msg._id});
			$scope.messages[idx] = msg;
		}
		
		socket.forward('edit message');
		
		socket.on('connection', function(s) {
			console.log('successfully connected to server');
		});
		
		// socket.on('message history', function(messages) {
// 			$scope.messages = messages;
// 		});
		
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
		var mapURL = 'https://maps.google.com/?q=' + producer.address + '&output=embed';
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
.controller('productUploadCtrl', ['$scope', '$rootScope', '$sce', '$location', '$modal', 'ProductManager', 'Restangular', 'product', 'flash',
	function($scope, $rootScope, $sce, $location, $modal, ProductManager, Restangular, product, flash) {
		// init
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
		
		ProductHistory.getAllProducts(function(result) {
			$scope.allProducts = result;
		});

		$scope.predicate = 'cycle';

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
.controller('calendarPopupCtrl', ['$scope', function ($scope) {
	$scope.format = 'dd/MM/yyyy';
	
	$scope.open = function($event) {
		$event.preventDefault();
		$event.stopPropagation();
		$scope.opened = true;
	};
}])
.controller('productOrderCtrl', ['$scope', '$rootScope', 'myOrders', 'products', 'unfullfilledOrders', 'Calendar', 'ProductHistory', 'ProductManager',
	function($scope, $rootScope, myOrders, products, unfullfilledOrders, Calendar, ProductHistory, ProductManager) {
		$scope.dateParams = {start: null, end: null};
		$scope.stats = {};
		
		myOrders.getList().then(function(orders) {
			$scope.orders = orders.plain();
			$scope.currentOrders = _.filter($scope.orders, {cycle: $rootScope.cycle});
			$scope.sortedOrders = unfullfilledOrders.getList().$object;
			getStats();
		});
		
		$scope.orderTotal = function(list) {
			if (angular.isArray(list) ) {
				return _.reduce(list, function(sum, order) {
					return sum + order.product.price * order.quantity;
				}, 0);
			} return 0;
		};
		
		$scope.sortedOrderTotal = function(list) {
			if (angular.isArray(list)) {
				return _.reduce(list, function(sum, customer) {
					var total = _.reduce(customer.orders, function(sum, order) {
						return sum + order.product.price * order.quantity;
					}, 0);
					return sum + total;
				}, 0);
			} return 0;
		};
		
		$scope.getCurrentProducts = function() {
			ProductHistory.getCurrentProducts(function(products) {
				$scope.currentProducts = products;
			});
		};
		
		$scope.getCurrentProducts();
		
		products.getList().then(function(result) {
			 $scope.products = result;
			 $scope.futureProducts = _.filter($scope.products, function(product) {
				 return moment($rootScope.deliveryDay).isBefore( moment(product.cycle.deliveryDay) );
			 });
			 
			 $scope.stats.futureAmount = $scope.futureProducts.length;
			 
			 $scope.pastProducts = _.filter($scope.products, function(product) {
			 	return product.cycle === null || moment($rootScope.deliveryDay).isAfter( moment(product.cycle.deliveryDay) ); 
			 });
			 
			 $scope.stats.pastAmount = $scope.pastProducts.length;
			 getStats();
			 
		});
		
		$scope.delete = function(idx, id) {
			var itemToDelete = $scope.currentProducts[idx];
			$scope.currentProducts.splice(idx, 1);
			ProductManager.deleteProduct(id);
		};
		
		$scope.lastMonth = Date.today().add(-1).months().toString('MMMM');
		$scope.predicate = 'product';
		
		function getProductStat(array) {
			if (_.isArray(array) ) {
				$scope.stats.currentAmount = _.sum( _.map(array, 'amountSold') );

				console.log(_.map(array, 'amountSold'));
				
				$scope.stats.bestSeller =  _.max(array, 'amountSold' );
			
				$scope.stats.topEarner = _.max(array, function(product) {
					return product.amountSold * product.price;
				});
			
				var cycleChain = _.chain(array)
				.groupBy(function(p) {
					var cycle = moment(p.dateUploaded).format('MMMM D YYYY');
					if (p.cycle.deliveryDay) cycle = moment(p.cycle.deliveryDay).format('MMMM D YYYY');
					return cycle;
				})
				.mapValues(function(product) {
					return _.reduce(product, function(sum, p) {
						var total = p.amountSold*p.price;
						return sum + total;
					}, 0);
				});
			
				var topCycle = cycleChain.max().value();
				$scope.stats.bestSellingCycle = cycleChain.invert().result(topCycle).value();
			}
		}
		
		function getOrderStat(array) {
			if (angular.isArray(array)) {
				$scope.stats.saleAmount = array.length;
			
				$scope.stats.orderTotal = _.reduce(array, function(sum, order) {
					return sum + order.product.price * order.quantity;
				}, 0);
				
				var customerFrequencyChain = _.chain(array)
				.countBy(function(order) {
					return order.customer.name;
				});

				var maxCustomer = customerFrequencyChain.max().value();
				$scope.stats.frequentCustomer = customerFrequencyChain.invert().result(maxCustomer).value();

				var customerValueChain = _.chain(array)
				.groupBy(function(k) {
					return k.customer.name;
				})
				.mapValues(function(customer) {
					return _.reduce(customer, function(total, order) {
						return total + order.product.price * order.quantity;
					}, 0);
				});

				$scope.stats.maxAmount = customerValueChain.max().value();
				$scope.stats.valueCustomer = customerValueChain.invert().result($scope.stats.maxAmount).value();
			}
		}
	
		function getStats(start, end) {
			if (!start && ! end) {
				getProductStat($scope.products);
				getOrderStat($scope.orders);
			} else {
				var filteredProducts = $scope.products;
				var filteredOrders = $scope.orders;
				if (start) {
					filteredProducts = _.filter(filteredProducts, function(product) {
						var date = moment(product.dateUploaded);
						if (product.cycle) date = moment(product.cycle.deliveryDay);
						return moment(start).isBefore( date );
					});
					filteredOrders = _.filter(filteredOrders, function(order) {
						return moment(start).isBefore( moment(order.datePlaced) );
					});
				}
				if (end) {
					filteredProducts = _.filter(filteredProducts, function(product) {
						var date = moment(product.dateUploaded);
						if (product.cycle) date = moment(product.cycle.deliveryDay);
						return moment(end).isAfter( date );
					});
					
					filteredOrders = _.filter(filteredOrders, function(order) {
						return moment(end).isAfter( moment(order.datePlaced) );
					});
				}
				getOrderStat(filteredOrders);
				getProductStat(filteredProducts);
			}
		}
	
		$scope.$watch('dateParams.start', function(n) {
			getStats(n, $scope.dateParams.end);
		});
		$scope.$watch('dateParams.end', function(n) {
			getStats($scope.dateParams.start, n);
		});
		
		
		
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
				$scope.cartTotal($scope.cart);
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
			$location.path("/store");
		};
	}
])

.controller('storeCtrl', ['$scope', '$rootScope', '$location', '$routeParams', '$modal', 'LoginManager', 'flash', '$http', 'Cart',
	function($scope, $rootScope, $location, $routeParams, $modal, LoginManager, flash, $http, Cart) {
		var category, sort, reverse, productURL;
		
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
			if (!$rootScope.canShop) {
				productURL = 'api/product?cycle='+ ($rootScope.cycle + 1);
			} else productURL = 'api/product?cycle='+$rootScope.cycle;			
			loadProducts(productURL);
			productsStarted = true;
		}
		
		$rootScope.$watch('cycle', function(newValue){
			if ($rootScope.cycle && !productsStarted) {
				if (!$rootScope.canShop) {
					productURL = 'api/product?cycle='+ ($rootScope.cycle + 1);
				} else productURL = 'api/product?cycle='+$rootScope.cycle;
				loadProducts(productURL);
			}
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
		
		// $rootScope.$watch('canShop', function() {
// 			if ($rootScope.canShop === false) {
// 				flash.setMessage({type: 'warning', message: 'Shopping is not allowed yet sorry. Please check the calendar for when shopping is open next.'});
// 			}
// 		});
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
			console.log('Calendar loaded!');
			// $scope.countDown = Calendar.countDown;
			$scope.calendar = Calendar.calendar;
			
			$scope.significantDays = Calendar.cycle;
			$scope.nextCycle = Calendar.nextCycle;
			// $scope.twoMonth = Calendar.twoMonth;
			$scope.daysBeforeOrderingStops = Calendar.daysBeforeOrderingStops;
			$scope.daysBeforeDeliveryDay = Calendar.daysBeforeDeliveryDay;
			
			$scope.deliveryDayFromNow = moment(Calendar.cycle.deliveryDay).fromNow();
			
			$scope.shoppingTime = function() {
				// if now is before start then print days until start happens
				// if now is after start then print days until end happens
				// if now is after end then print shopping start of next cycle?
				if ( moment().isBefore(Calendar.cycle.shoppingStart) ) return 'is ' + moment(Calendar.cycle.shoppingStart).fromNow();
				if ( moment().isBefore(Calendar.cycle.shoppingStop) ) return 'ends ' + moment(Calendar.cycle.shoppingStop).fromNow();
				if ( moment().isAfter(Calendar.cycle.shoppingStop) ) return 'is ' + moment(Calendar.nextCycle.shoppingStart).fromNow();
			};
			
		});
		
		if (Calendar.cycle) {
			$scope.deliveryDayFromNow = moment(Calendar.cycle.deliveryDay).fromNow();
			$scope.shoppingTime = function() {
				// if now is before start then print days until start happens
				// if now is after start then print days until end happens
				// if now is after end then print shopping start of next cycle?
				if ( moment().isBefore(Calendar.cycle.shoppingStart) ) return 'is ' + moment(Calendar.cycle.shoppingStart).fromNow();
				if ( moment().isBefore(Calendar.cycle.shoppingStop) ) return 'ends ' + moment(Calendar.cycle.shoppingStop).fromNow();
				if ( moment().isAfter(Calendar.cycle.shoppingStop) ) return 'is ' + moment(Calendar.nextCycle.shoppingStart).fromNow();
			};
		}
		
		$scope.calendar = Calendar.calendar;
		$scope.significantDays = Calendar.cycle;
		$scope.nextCycle = Calendar.nextCycle;
		$scope.daysBeforeOrderingStops = Calendar.daysBeforeOrderingStops;
		$scope.daysBeforeDeliveryDay = Calendar.daysBeforeDeliveryDay;
		
	}	
]);
