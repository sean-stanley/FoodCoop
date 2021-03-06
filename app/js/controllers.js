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
			var loginPaths = ['/login-page', '/must-login', '/login-failed'];
			LoginManager.login('local', $scope.loginData, function() {
				var path;
				if ($rootScope.savedLocation) {
					$location.path($rootScope.savedLocation);
					$rootScope.savedLocation = "";
				}
				path = $location.path();
				if (_.contains(loginPaths, path) ) {
					$location.path('me');
				}
				// else $location.path('me');
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


.controller('producerCtrl',
	function($scope, $rootScope, ProducerManager, $location, $http, flash) {
		$scope.submitForm = function() {
			ProducerManager.saveProducer();
		};

		$scope.crop = function(obj) {
			obj.dimensions = {x:450, y:450};
			$http.post('/api/crop', obj).then(function(img) {
				$rootScope.currentUser.producerData.logo = img.data;
			}, function(err) {
				flash.setMessage({type:'danger', message: err.data});
			});
		};

	}
)
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
				 if (product.cycle) {
					 return moment($rootScope.deliveryDay).isBefore( moment(product.cycle.deliveryDay) );
				 } else if (product.permanent) return true;

			 });

			 $scope.stats.futureAmount = $scope.futureProducts.length;

			 $scope.pastProducts = _.filter($scope.products, function(product) {
				if (product.cycle) {
					return moment($rootScope.deliveryDay).isAfter( moment(product.cycle.deliveryDay) );
				} else if (product.permanent) return true;
			 });

			 $scope.stats.pastAmount = $scope.pastProducts.length;
			 getStats();

		});

		$scope.delete = function(idx, id) {
			var itemToDelete = $scope.currentProducts[idx];
			$scope.currentProducts.splice(idx, 1);
			ProductManager.deleteProduct(id);
      $scope.pastProducts.push(itemToDelete);
		};
    
    $scope.publish = publish;
    
    function publish (idx, id) {
      var itemToPublish = _.find($scope.pastProducts, {_id: id});
      _.remove($scope.pastProducts, {_id: id});
      ProductManager.publishProduct(id);
      $scope.currentProducts.push(itemToPublish);
    }

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
					if (p.cycle && p.cycle.deliveryDay) cycle = moment(p.cycle.deliveryDay).format('MMMM D YYYY');
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
		$scope.backward = true;
		$scope.ordering = 'datePlaced';

		if ($rootScope.cycle) {
			Cart.getCurrentCart(function(cart) {
				$scope.cart = cart;
				getIds();
			});
		}

		Cart.getMeatItems(function(items) {
			$scope.meatHistory = items.data;
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

		$scope.$on('GET_CART', function() {
			Cart.getCurrentCart(function(cart) {
				$scope.cart = cart;
				getIds();
			});
		});

		$scope.$on('UPDATE_CART', function(event, item){
			console.log(item);

			$scope.cart.push(item);

			if (_.isArray(item)) {
				$scope.cart = _.flatten($scope.cart);
				angular.forEach(item, function(i) {
					$scope.cartProduct_ids.push(i.product._id);
				});
			} else {
				$scope.cartProduct_ids.push(item.product._id);
			}

			$rootScope.$broadcast('CART_IDS', $scope.cartProduct_ids);
		});

		$scope.$on('FAILED_CART_UPDATE', function(event, quantity, id) {
			var idx = _.findIndex($scope.cart, {_id : id});
			$scope.cart[idx].quantity = quantity;
		});

		$scope.open = openProduct; 
    
    
    function openProduct (item) {
			var path = $location.path();
			if (path === "/store") {
				$rootScope.$broadcast('OPEN_PRODUCT', item);
			}
			else {
				$location.path("/store");
			}
		}
    
		// only for the store.html page use of this controller
		function getIds() {
			$scope.cart.forEach(function(item) {
				$scope.cartProduct_ids.push(item.product._id);
			});
			$scope.cartProduct_ids = _.uniq($scope.cartProduct_ids, true);
			$rootScope.$broadcast('CART_IDS', $scope.cartProduct_ids);
		}
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
			item.oldQty = $scope.lastQuantity;
			Cart.updateItem(item, function(error, result) {
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

		$scope.submitForm = function(valid, mail) {
			if (valid) MailManager.mail(mail);
			else $scope.submitted = true;
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


		$scope.submitForm = function(valid, message) {
			if (valid) {
				MailManager.mail($scope.mail);
				$location.path("/store");
			} else $scope.submitted = true;
		};
	}
])

.controller('storeCtrl', ['$scope', '$rootScope', '$location', '$routeParams', '$modal', 'LoginManager', 'categories', 'flash', '$http', 'Cart',
	function($scope, $rootScope, $location, $routeParams, $modal, LoginManager, categories, flash, $http, Cart) {
		var category, sort, reverse, productURL, cartProductIds;

		productURL = 'api/product?';
		loadProducts(productURL);
		
		$scope.isProducts = true;

		$scope.categories = categories.data;

		$scope.searchObject = $location.search();

		$scope.predictiveSearch = [];
		$scope.category = $scope.searchObject.hasOwnProperty('category') ? $scope.searchObject.category : null;
		$scope.sort = $scope.searchObject.hasOwnProperty('sort') ? $scope.searchObject.sort : undefined;
		$scope.reverse = $scope.searchObject.hasOwnProperty('reverse') ? $scope.searchObject.reverse : undefined;

		// initiate the real-time message container
		//$scope.message = {type: 'danger', closeMessage: function() {if (this.message) this.message = null;} };
		$scope.products = [];

		var productsStarted;

		$scope.searchFor = function(term) {
			$location.search('search', term);
		};

		// open the modal
		$scope.open = openProduct;

		$scope.$on('OPEN_PRODUCT', function(event, item) {
			if ($scope.products) {
				var product = _.find($scope.products, {_id: item.product._id});
				$scope.open(product);
			}
			else console.log("can't open product because it's undefined currently");
		});

		$scope.$on('NOT_IN_CART', findCartItems);

		// if the user has items in their cart that are also in the store
		// flag those items with the bool AlreadyInCart = true;
		$scope.$on('CART_IDS', findCartItems);

		// A very important function :-)
		$scope.addToCart = addToCart;

		// route param $watches

		$scope.$watch('category', function(newValue) {
			$scope.filterCategory = _.result(_.find($scope.categories, {name: newValue}), '_id');
			$location.search('category', newValue);
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

		$scope.$watch('filterCategory', function(newValue) {
			$scope.category = _.result(_.find($scope.categories, {_id: newValue}), 'name');
		});
    
    // functions 
    
		function addToCart(product) {
			var order, modalInstance;
			if ($rootScope.currentUser) {
				
				order = {
					unitPrice: product.price,
					product: product._id,
					customer: $rootScope.currentUser._id,
					supplier: product.producer_ID._id,
					quantity: product.minOrder || 1
				};

				Cart.addToCart(order, function(err, cartOrder){
					if (err) {
						console.log(err);
					} else {
						LoginManager.getTally();
						$rootScope.$broadcast('UPDATE_CART', cartOrder);
					}
				});
				// This is where the magic really happens
				// an error returns an empty callback
			}
			else {
				modalInstance = $modal.open({
					templateUrl: 'partials/store/not-a-member.html',
					size : 'sm'
				});
			}
		}
    
		function findCartItems(event, cartProduct_ids) {
			if (cartProduct_ids) cartProductIds = cartProduct_ids;
			$scope.products.forEach(function(product) {
				if ( _.contains(cartProductIds, product._id) ) {
					product.AlreadyInCart = true;
				}
				else product.AlreadyInCart = 0;
			});
		}
    
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
					findCartItems();
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
          // findCartItems();

					$scope.predictiveSearch = _.map($scope.products, 'fullName');
					$rootScope.$broadcast('PREDICTIVE_SEARCH', $scope.predictiveSearch);

					return oboe.drop;
				});
		}
    
		function openProduct(product) {
			var template = 'partials/store/store-modal.html',
			controller = 'modalInstanceCtrl';
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
		}

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
			$scope.nextDeliveryDay = Calendar.getDeliveryDay();
			
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
