'use strict';
/*global angular, _, Date, Session*/

/* Services */

angular.module('co-op.services', [])
	
	
// Creates a Session Object that is a promise for connecting to the server and
// for Authentication
	.factory('Session', function (Restangular) {
		return Restangular.all('auth/session');
		
	})
	
// Allows flash messages to be displayed on a page. Once a message is set though
// it's generally not seen until the next route change. Primarily used for login
// attempts and successful writes to the database.	
	.factory("flash", function($rootScope) {
		var queue = [];
		var currentMessage ={message: '', type: ''};

		$rootScope.$on("$routeChangeSuccess", function() {
			currentMessage = queue.shift() || {message: '', type: ''};
		});

		return {
			setMessage: function(message) {
				if (message.hasOwnProperty('type') ) {
					queue.push(message);
				}
			},
			getMessage: function() {
				return currentMessage.message;
			},
			getType: function() {
				return currentMessage.type;
				},
			closeMessage: function() {
				currentMessage = queue.shift() || "";
			},
			
		};
	})

// Is a collection of methods for logging a user in, checking if a user is
// logged in and logging out.	
	.factory('LoginManager', function ($location, $rootScope, $cookieStore, Session, Restangular, Cart){
		$rootScope.failedAttempts = 0;
		
		return {
			login : function(provider, form, callback) {
				var cb = callback || angular.noop;
				Session.post({
					provider: 'local',
					email: form.email,
					password: form.password,
					rememberMe: form.rememberMe
					})
				.then(function (user) {
					var remainingAttempts;
					if (typeof user === 'object') {
						if (user.hasOwnProperty('plain') ){
							user = user.plain();
						}
										
						$rootScope.currentUser = user;
						Cart.getTally();
					}
					// incorrect login attempt
					else {
						$rootScope.failedAttempts++;
						remainingAttempts = function(maxAttempts) {
							if (maxAttempts > 0 && maxAttempts - $rootScope.failedAttempts > 0) {
								return maxAttempts - $rootScope.failedAttempts;
							}
							else {
								return 0;
							}
						};
						var remaining = remainingAttempts(9);
						$rootScope.flash.setMessage({
							type: 'danger',
							message: 'Login failed! Please check your username and password and try again. You have ' + remaining +' remaining attempts left'
						});
						$location.path('/login-failed'+'/attempts='+$rootScope.failedAttempts);						
					}
					return cb();
				}, 
					function(err) {
						console.log(err.data);
						return cb();
					}
				
				);
			},
			
			isLoggedIn : function(callback) {
				var loggedInUser, isLoggedIn;
				var cb = callback || angular.noop;
				// check if the user is logged in with the app.
				
				if ($rootScope.currentUser && $rootScope.currentUser.hasOwnProperty('email')) {
					isLoggedIn = true;
				}
				
				// attempt to get the user from the app
				else {
					Session.customGET().then(function(user) {
						if (user === 'Not logged in') {
							console.log(user);
							isLoggedIn = false;
						}
						else if (typeof user === 'object' && user.hasOwnProperty('email')) {
							loggedInUser = user.plain();
							console.log(loggedInUser);
							// if the user is already authenticated, save the data for the app to use.
							$rootScope.currentUser = loggedInUser;
							isLoggedIn = true;
							Cart.getTally();
						}
						else {isLoggedIn = false;}
						cb(isLoggedIn);
					});
				}
			},
			
			logout : function() {
				Session.remove();
				$rootScope.currentUser = null;
				$rootScope.flash.setMessage({type: 'success', message: 'Successfully logged out!'});
				$location.path('/home');
			}
		};
	})

	// called for creating new users as well as has a promise for getting all the users. Editing a
	// user though is handled by the userEditCtrl Controller. 
	.factory('UserManager', function($rootScope, Restangular, $location) {
		return {
			createUser: function(userinfo, callback) {
				var cb = callback || angular.noop;
				Restangular.all('api/user').post(userinfo).then(function(user){
					console.log(user);
					$rootScope.currentUser = user;
					$location.path('/welcome');
					cb();
				});
			},
			// this is a promise. Call users.getList() to get the array of users. 
			users: Restangular.all('api/user')
			  
		};
	})
	
	// collects and maps category id's with their names. 
	.factory('ProductManager', ['$http', 'Restangular', '$rootScope', '$route', function($http, Restangular, $rootScope, $route) {
        var module, productCategoryPromise, categoryIdMapping = {}, categoryNameMapping = {}, unitSuggestions = [];
        
        productCategoryPromise = Restangular.all("api/category");
        
        // When the categories are all loaded, cache a mapping from 
        // the id and the name to the object
        productCategoryPromise.getList().then(function (categories) {
            var i, category, unit;
            for (i in categories) {
                if (categories.hasOwnProperty(i)) {
                    category = categories[i];
                    if (category) {
                        categoryIdMapping[category._id] = category;
                        categoryNameMapping[category.name] = category;
						for (unit in category.availableUnits) {
							if (category.availableUnits.hasOwnProperty(unit)) {
								unitSuggestions.push(category.availableUnits[unit]);
							}
						}
                    }
                }
            }
        });
        
		module = {
			registerProduct : function(productData) {
				//$http.post("api/product", productData);
				Restangular.all('api/product').post(productData).then(function() {
					$rootScope.flash.setMessage({type: 'success', 
					message: 'Congratulations ' + $rootScope.currentUser.name + '! Your product ' + productData.variety + " " + productData.productName + ' was successfully added to the store.'
					});
					$route.reload();
				});
			},
			
			unitSuggestions : unitSuggestions,
			
			productCategoryPromise : productCategoryPromise,
			
			productCategories : productCategoryPromise.getList().$object,
			
			certificationTypes: Restangular.all("api/certification").getList().$object,
			
			getUserProducts: function(callback){
				$http.get("api/product?producer_ID=:currentUser._id");
			},
            
            categoryByID: function (id) {
                return categoryIdMapping[id];
            },
            
            categoryByName: function (name) {
                return categoryNameMapping[name];
            }
		};
        
        return module;
	}])
	
	.factory('ProducerManager', ['$http', 'Restangular', '$rootScope', '$route', function($http, Restangular, $rootScope, $route) {
		return {
			saveProducer : function(callback) {
				var cb = callback || angular.noop;				
				console.log($rootScope.currentUser);
				Restangular.one('api/user', $rootScope.currentUser._id).customPOST($rootScope.currentUser, 'producer/edit').then(function(result) {
					if (result.hasOwnProperty('_id')) {
						$rootScope.flash.setMessage('Profile Updated Successfully');
						$route.reload();
					}
				});
			}
		};
	}])
	
	// Client side date managment. This job is shared by the client and server.
	.factory('Calendar', ['$http', function($http) {
		var monthStart, lastMonthStart, deliveryDay;
		monthStart = Date.today().moveToFirstDayOfMonth();
		lastMonthStart = Date.today().addMonths(-1).moveToFirstDayOfMonth();
		deliveryDay = Date.today().final().wednesday();
						
		return {
			// return this month's delivery day
			deliveryDay: function() {
				return deliveryDay;
			},
			// counts how many days until @date. Returns @INTEGER or NaN
			// a negative result means that @date is in the past
			daysUntil: function(date) {				
				var result, a, b;
				
				a = new Date(date);
				
				b = new Date();
				
				result = Math.floor( 
					(Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) -
					Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) ) /
					(1000 * 60 * 60 * 24) );
				return result;
			},
			// This method filters an array to only contain stuff from the 
			// current month. An example is products and orders. 
			// @group is the array to be reduced
			// @dateProperty is a string of the key containing a date in @group
			// example: orders is an array of all orders and has the (key, value)
			// of (datePlaced: date) so use currentMonth(orders, 'datePlaced');
			// to return an array of orders created in the current month.
			currentMonth : function(group, dateProperty, callback) {
				var cb = callback || angular.noop;
				var list = _.filter(group, function(item) {
					if ( Date.parse(item[dateProperty]).between( monthStart, Date.today().add(1).days() ) )
					return item;
				});
				cb(list);
				return list;
			},
			// This method filters an array to only contain stuff from one 
			// month ago. An example is products and orders. 
			// @group is the array to be reduced
			// @dateProperty is a string of the key containing a date in @group
			// example: orders is an array of all orders and has the (key, value)
			// of (datePlaced: date) so use currentMonth(orders, 'datePlaced');
			// to return an array of orders created during the last month.
			lastMonth : function(group, dateProperty, callback) {
				var cb = callback || angular.noop;
				var list = _.filter(group, function(item) {
					if (Date.parse(item[dateProperty]).between(lastMonthStart, monthStart)) {
						return item;
					}
				});
				cb(list);
				return list;
			}
		};
	}])
	
	.factory('MailManager', ['$rootScope', '$http', function($rootScope, $http) {
		return {
			mail : function(mail, callback) {
				var cb = callback || angular.noop, recipient;
				if (mail.hasOwnProperty('to')) {
					recipient = mail.toName;
				}
				else recipient = "the NNFC";
				
				$http.post('/api/mail', mail).success(function(response) {
					$rootScope.setMessage({
						type: 'success', 
						message: 'message sent successfully to ' + recipient
					});
					cb();
				});
			}
		};
	}])
	
.factory('Cart', ['$rootScope','Restangular', 'Calendar', 
	function($rootScope, Restangular, Calendar){
				
		return {
			getTally : function() {
				Restangular.one('api/cart', $rootScope.currentUser._id)
				.customGET('length').then(function(count) {
					$rootScope.cartTally = count;
				});
			},
			getAllItems : function(callback) {
				Restangular.one('api/cart', $rootScope.currentUser._id)
				.get().then(callback);
			},
			// optional @callback function will have @list which holds the cart items of
			// the current month
			getCurrentCart : function(callback) {
				var currentCart;
				Restangular.one('api/cart', $rootScope.currentUser._id)
				.get().then(function(cart) {
					currentCart = Calendar.currentMonth(cart, 'datePlaced', callback);
					return currentCart;					
				});
			},
			addToCart : function(order, callback) {
				Restangular.all("api/order").post(order).then(callback);
			},
			
			updateItem : function(item, callback) {
				var cb = callback || angular.noop;
				Restangular.all('api/cart').post(item).then(function(result) {
					console.log(result);
					if (result === "OK") {
						$rootScope.flash.setMessage({
							type: 'success',
							message: "You're cart was successfully updated"
						});
					}
					else {
						$rootScope.flash.setMessage({
							type: 'danger',
							message: result
						});
					}
					cb(result);
				});
			},
			deleteItem : function(id) {
				Restangular.all('api/cart')
				.customDELETE(id)
				.then(function() {
					$rootScope.cartTally --;
				});
			}
		};
	}
])

	
	.factory('ProductHistory', ['$http', function($http) {
		var module = {
			getCurrentProducts : function(callback) {
				this.currentProducts = $http.get("/api/product-list/current").success(callback);
			},
			getAllProducts : function(callback) {
				this.recentProducts = $http.get("/api/product-list").success(callback);
			},
			getRecentProducts : function(callback) {
				this.allProducts = $http.get("/api/product-list/recent").success(callback);								
			}
		};
		return module;
	}])
	
	.factory('ProducerList', ['$http', function($http) {
		var module = {
						
			getData : function(callback) {
	            $http.get("/api/user?user_type.name=Producer").success(callback);
	        },
			
			addProducer : function(newData) {
				module.data.push(newData);
				return module.data;

			},
			
		};
		
		return module;
	}]);

	
	/*
	.service('LocationService',  ['$http', function($http) {
	        var data;
			
	        this.getLocations = function(callback) {
				$http.get("/api/location").success(callback);
		    };
	
	        this.addLocation = function(locationData) {
	            data.push(locationData);
				$http.post("/api/location", locationData);
	        };
			
	
	    }]);   ------- Waiting to be deleted as no longer needed ---------*/ 
	
