'use strict';
/*global angular, User, Session*/

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
			getType: currentMessage.type,
			closeMessage: function() {
				currentMessage = queue.shift() || "";
			},
			
		};
	})

// Is a collection of methods for logging a user in, checking if a user is
// logged in and logging out.	
	.factory('LoginManager', function ($location, $rootScope, $cookieStore, Session, Restangular){
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
					var properties, User = {}, remainingAttempts;
					if (typeof user === 'object') {
						if (user.hasOwnProperty('plain') ){
							user = user.plain();
						}
						console.log(user);
						properties = Object.getOwnPropertyNames(user);
						properties.forEach(function (key) {
							User[key] = user[key];
						});
										
						$rootScope.currentUser = User;
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
					message: 'Congratulations ' + $rootScope.currentUser.name + '! Your product ' + productData.variety + productData.productName + ' was successfully added to the store.'
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
	
	.factory('MailManager', ['$http', function($http) {
		return {
			mail : function(mail) {
				console.log('email message: ',  mail);
				$http.post('/api/mail', mail).success(function(response) {
					console.log('email message successfully sent');
					return response;
				});
			}
		};
	}])
	.service('OrderRecords', ['$http', function($http) {
		
		this.getOrders = function() {
			return orders;
		};
		
		this.addOrder = function(orderData) {
			orders.push(orderData);
		};
		
		this.sumSales = function() {
		 var total = 0;
		 for(var i=0; i < orders.length; i++) {
		 	console.log(i, ' order items = ', orders[i].price);
		 	total += orders[i].price; 
		 }
		 return total;
	  };

		
		var orders = [
			{product: 'Granny Smith Apples', quantity: 30, price: 2*30, customer: 'Sean Stanley'},
            {product: 'Spray-Free Oranges', quantity: 12, price: 2.5*12, customer: 'Matt Stanley'},
            {product: 'Romaine Lettuce', quantity: 27, price: 4*27, customer: 'Myles Green'},
            {product: 'Organic Basil', quantity: 7, price: 1.5*7, customer: 'Rowan Clements'},
            {product: 'Dozen Eggs', quantity: 4, price: 8*4, customer: 'Lisa Taylor'}
		];
	}])
	.service('CartRecords', ['$http', function($http) {
		
		this.getCart = function() {
			return cartItems;
		};
		
		this.addItem = function(productData) {
			cartItems.push(productData);
		};
		
		this.removeItem = function(i) {
			cartItems.splice(i, 1);
		};
		
		this.sumPrice = function() {
		 var total = 0;
		 for(var i=0; i < cartItems.length; i++) {
		 	total += cartItems[i].price; 
		 }
		 return total;
	  };

		
		var cartItems = [
			{product: 'Organic Blue-Veined Cheese', quantity: 1, price: 10, producer: 'Hiki Dairy Farm'},
            {product: 'Spray-Free Oranges', quantity: 2, price: 2.5*2, producer: 'Northland Naturals'},
            {product: 'Romaine Lettuce', quantity: 6, price: 4*6, producer: 'EcoBikes'},
            {product: 'Rosemary bunches', quantity: 4, price: 1*4, producer: 'Rowan Clements'},
            {product: 'Loafs of Gluten Free Bread', quantity: 3, price: 3.2*4, producer: 'Lisa Taylor'},
            {product: 'Organic Garlic and Basil Sausages', quantity: 2, price: 8.50*2, producer: 'Lisa Taylor'}
		];
	}])
	
	.factory('ProductHistory', ['$http', function($http) {
		var module = {
						
			getData : function(callback) {
				this.products = $http.get("/api/product").success(callback);
	        },
			addProduct : function(newData) {
				module.data.push(newData);
				console.log(module.data);
				return module.data;
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
	
