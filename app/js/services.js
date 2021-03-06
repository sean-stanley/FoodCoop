'use strict';
/*global angular, _, Date, Session, moment*/

/* Services */

angular.module('co-op.services', [])
	
	
// Creates a Session Object that is a promise for connecting to the server and
// for Authentication
	.factory('Session', [ 'Restangular', function (Restangular) {
		return Restangular.all('auth/session');
	}])
	
	.factory('socket', function (socketFactory) {
	  return socketFactory();
	})
	
// Allows flash messages to be displayed on a page. Once a message is set though
// it's generally not seen until the next route change. Primarily used for login
// attempts and successful writes to the database.	
	.factory("flash", ['$rootScope', function($rootScope) {
		// next page message for logging out
		// current page message for server requests
		$rootScope.queue = [];
		var temp;
		var currentMessage = {message: '', type: ''};

		$rootScope.$on("$routeChangeStart", function() {
			// get only the messages that are meant to persist to a new view
			temp = _.filter($rootScope.queue, 'next' );
			//empty the queue
			$rootScope.queue = [];
			// make the new queue of the next messages but remove their 'next' properties they won't persist forever.
			// if it was necessary to show more methods a simple counter could be implemented.
			$rootScope.queue = _.map(temp, function(m) {delete m.next; return m;});
		});

		return {
			setMessage: function(message) {
				if (message.hasOwnProperty('type') ) {
					$rootScope.queue.push(message);
				}
			},
			setNextMessage: function(message) {
				if (message.hasOwnProperty('type') ) {
					message.next = true;
					$rootScope.queue.push(message);
				}
			},
			closeMessage: function(idx) {
				$rootScope.queue.splice(idx, 1);
			}
			
		};
	}])

// Is a collection of methods for logging a user in, checking if a user is
// logged in and logging out.	
	.factory('LoginManager', ['$location', '$rootScope', '$q', 'Session', 'Restangular', 'flash',
	 function ($location, $rootScope, $q, Session, Restangular, flash){
		$rootScope.failedAttempts = 0;
		
		function getTally(callback) {
			var done = callback || angular.noop;
			Restangular.one('api/cart', $rootScope.currentUser._id)
			.customGET('length').then(function(count) {
				$rootScope.cartTally = count;
				done();
			});
		}
		
		function noSession(error) {
			console.log(error);
			return false;
		}
		
		function authenticate(user) {
			$rootScope.currentUser = user;
			$rootScope.currentUser.route = 'api/user/' + $rootScope.currentUser._id;
			getTally(function() {return true;});
		}
		
		return {
			getTally : function() {
				getTally();
			},
			login : function(provider, form, callback) {
				var cb = callback || angular.noop;
				if ($rootScope.failedAttempts <= 10) {
					Session.post({
						provider: 'local',
						email: form.email,
						password: form.password,
						rememberMe: form.rememberMe
						})
					.then(function(user) {
						authenticate(user);
						cb();
						$rootScope.$broadcast('GET_CART');
						flash.setNextMessage({type: 'success', message: 'Welcome back ' + $rootScope.currentUser.name + '. Please click on \'member tools\' on the left side of the top tool bar to get started.\n Mobile and tablet users tap the top left grey arrow.'});
					}, function(error) {
						// incorrect login attempt
						var remainingAttempts;
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
						var type = remaining > 5 ? 'warning' : 'danger';
						flash.setNextMessage({
							type: type,
							message: 'Login failed! Please check your username and password and try again. You have ' + remaining +' attempts remaining'
						});
						$location.path('/login-failed'+'/attempts='+$rootScope.failedAttempts);						
					});
				}
				
			},
			// a promise that resolves true if the user is logged in, or false if not.
			isLoggedIn : function(params) {
				var result = $q.defer();
				var isLoggedIn;
				
				// check if the user is logged in with the app.
				if ($rootScope.currentUser && $rootScope.currentUser.hasOwnProperty('email')) {
					isLoggedIn = true;
					result.resolve(isLoggedIn);
				}
				
				// attempt to get the user from the app
				else {
					if (!params) {
						Session.customGET().then(function(user) {
							isLoggedIn = authenticate(user);
							result.resolve( isLoggedIn );
						}, function(error) {
							noSession(error);
							result.reject("Session is expired");
						}
					);
					}
					else {
						Session.get(params).then(function(user) {
							if (user !== "No session saved") {
								isLoggedIn = authenticate(user);
								result.resolve(isLoggedIn);
							}
							else result.reject(user);
						
						}, function(error) {
							noSession(error);
							result.reject("No Session Data");
						});
					}
				}
				return result.promise;
			},
			
			logout : function() {
				$location.path('/home');
				Session.remove();
				delete $rootScope.currentUser;
			}
		};
	}])

	// called for creating new users as well as has a promise for getting all the users. Editing a
	// user though is handled by the userEditCtrl Controller. 
	.factory('UserManager', ['$rootScope', 'Restangular', '$q', 'flash', function($rootScope, Restangular, $q, flash) {
		return {
			createUser: function(userinfo) {
				var result = $q.defer();
				Restangular.all('api/user').post(userinfo).then(function(user){
					$rootScope.currentUser = user;
					$rootScope.currentUser.route = 'api/user/' + $rootScope.currentUser._id;
					result.resolve();
				}, function(error){
					var message = {type: 'danger', message: 'Drat! Failed to create a new user. '+ error.data.name + ': ' + error.data.message};
					console.log(error);
					result.reject(message);
				});
			return result.promise;
			},
			save: function() {
				$rootScope.currentUser.save().then(function(response) {
					flash.setMessage({type: 'success', message: 'Details saved successfully'});
				}, function(error) {
					console.log(error);
					flash.setMessage({type: 'danger', message: 'Oops! Failed to save data. ' + error.statusText + ': ' + error.data});
				});
			},
			delCurrentUser: function(callback) {
				var cb = callback || angular.noop;
				$rootScope.currentUser.remove().then(function() {
					cb();
				});
			},
			
			
			// this is a promise. Call users.getList() to get the array of users. 
			users: Restangular.all('api/user')
			  
		};
	}])
	
	// collects and maps category id's with their names. 
	.factory('ProductManager', ['$http', 'Restangular', '$rootScope', 'flash', function($http, Restangular, $rootScope, flash) {
		var module, productCategoryPromise,
		categoryIdMapping = {}, 
		categoryNameMapping = {}, 
		certificationNameMapping = {},
		certificationIdMapping = {},
		unitSuggestions = [];
		
		productCategoryPromise = Restangular.all("api/category");
		
		// When the categories are all loaded, cache a mapping from 
		// the id and the name to the object
		productCategoryPromise.getList().then(function (categories) {
			var i, category, unit;
			categories = categories.plain();
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
		
		var certificationPromise = Restangular.all("api/certification");
		
		certificationPromise.getList().then(function(certifications){
			var i;
			certifications = certifications.plain();
			certificationNameMapping = _.indexBy(certifications, 'name');
			certificationIdMapping = _.indexBy(certifications, '_id');
		});
		
		function failedToUpload(error) {
			console.log(error.data);
			var messageData =  'Oops! Sorry ' + $rootScope.currentUser.name + ', your product didn\'t get uploaded. ' + error.status + ": ";
			if (error.data) {
				if (error.data.hasOwnProperty('errors')) {
					for (var key in error.data.errors) {
						if (error.data.errors.hasOwnProperty(key)) {
							messageData += error.data.errors[key].name + " " + error.data.errors[key].message;
						}
					}
				}
				else if (error.data.message) {
					messageData += error.data.name + ' ' + error.data.message;
				}
				else messageData += error.data;
			}
			else messageData += error.toString();
			flash.setMessage({type: 'danger', 
			message: messageData
			});
		}
        
		module = {
			registerProduct : function(productData, callback) {
				var cb = callback || angular.noop, message;
				
				Restangular.all('api/product').post(productData).then(function(response) {
					
					message = 'Congratulations ' + $rootScope.currentUser.name + '! Your ' + productData.variety + " " + productData.productName + ' are now added to the store.';
					flash.setMessage({type: 'success', 
					message: message
					});
					//var r = JSON.parse(result);
					cb(response);
				}, failedToUpload);
			},
			deleteProduct : function(id) {
				Restangular.one('api/product', id).remove().then(function() {
					flash.setMessage({type: 'success', message: 'Poof! Product successfully deleted'});
				}, function(error) {
					console.log(error);
					flash.setMessage({type: 'danger', message: 'Drat! Could not delete that product.'});
				});
			},
      
      publishProduct : function(id) {
        Restangular.one('api/product/publish', id).put().then(function() {
					flash.setMessage({type: 'success', message: 'Poof! Product successfully published'});
				}, function(error) {
					console.log(error);
					flash.setMessage({type: 'danger', message: 'Drat! Could not publish that product.'});
				});
      },
			
			cycles: Restangular.all('api/admin/cycle/future').getList().$object,
			
			unitSuggestions : unitSuggestions,
			
			productCategoryPromise : productCategoryPromise,
			
			productCategories : productCategoryPromise.getList().$object,
			
			certificationPromise: certificationPromise,
			
			getUserProducts: function(callback){
				$http.get("api/product?producer_ID=:currentUser._id");
			},
			
			categoryByID: function (id) {
				return categoryIdMapping[id];
			},
			
			categoryByName: function (name) {
				return categoryNameMapping[name];
			},
			
			certificationByID: function (id) {
				return certificationIdMapping[id];
			},
			
			certificationByName: function (name) {
				return certificationNameMapping[name];
			},
		};

		return module;
	}])
	
	.factory('ProducerManager', ['Restangular', '$rootScope', 'flash', function(Restangular, $rootScope, flash) {
		return {
			saveProducer : function(callback) {
				var cb = callback || angular.noop;
								
				$rootScope.currentUser.customPUT($rootScope.currentUser.plain(), 'producer')
				.then(function(result) {flash.setMessage({type: 'success', message: 'Profile Updated Successfully.'});},
					function(error){
						console.log(error);
						flash.setMessage({type: 'danger', message: 'Drat! Failed to update your profile.'});
					});
			}
		};
	}])
	
	// Client side date managment. This job is shared by the client and server.
	.factory('Calendar', ['$rootScope', '$http', function($rootScope, $http) {
    
    function getDeliveryDay() {
      var nearestDeliveryDay = moment().day(2).startOf('day');
      var shoppingStopDay = moment().day(5).startOf('day');
      if (moment().startOf('day').isAfter(shoppingStopDay) ) {
        return nearestDeliveryDay.add(1, 'weeks').format();
      } else return nearestDeliveryDay.format();
    }
		
		
		var module = {
			getDeliveryDay : getDeliveryDay,
			// This method filters an array to only contain stuff from the 
			// current cycle. @group must be an array of objects with a property called
			// cycle. used for orders mainly
			currentCycle : function(group, callback) {
				var cb = callback || angular.noop;
				var list = _.filter(group, function(item) {
					if (item.hasOwnProperty('cycle') && item.cycle === $rootScope.cycle) {
						return item;
					}
				});
				cb(list);
				return list;
			},
			// This method filters an array to only contain stuff from the 
			// previous cycle. @group must be an array of objects with a property called
			// cycle. used for orders mainly
			lastCycle : function(group, callback) {
				var cb = callback || angular.noop;
				var list = _.filter(group, function(item) {
					if (item.hasOwnProperty('cycle') && item.cycle === $rootScope.cycle - 1) {
						return item;
					}
				});
				cb(list);
				return list;
			}
		};
		return module;
	}])
	
	.factory('MailManager', ['flash', '$http', function(flash, $http) {
		return {
			mail : function(mail, callback) {
				var cb = callback || angular.noop, recipient;
				if (mail.hasOwnProperty('to')) {
					recipient = mail.toName;
				}
				else recipient = "the NNFC";
				
				$http.post('/api/mail', mail).success(function(response) {
					flash.setMessage({
						type: 'success', 
						message: 'message sent successfully to ' + recipient
					});
					cb();
				});
			}
		};
	}])
	
.factory('Cart', ['$rootScope','Restangular', '$http', 'LoginManager', 'flash', '$q',
	function($rootScope, Restangular, $http, LoginManager, flash, $q){
		return {
			getAllItems : function(callback) {
				LoginManager.isLoggedIn().then(function() {
					Restangular.one('api/cart', $rootScope.currentUser._id)
					.get().then(callback);
				});
			},
			getMeatItems : function(success, error) {
				$http.get('/api/meat-order/cart').then(success, error);
			},
			// optional @callback function will have @list which holds the cart items of
			// the current month
			getCurrentCart : function(callback) {
				var currentCart, cb = callback || angular.noop;
				
				LoginManager.isLoggedIn().then(function() {
					Restangular.one('api/cart', $rootScope.currentUser._id)
					.get({cycle: $rootScope.cycle}).then(callback);
				});
			},
			addToCart : function(order, callback) {
				Restangular.all("api/order").post(order).then(function(result){
					flash.setMessage({type: 'success', message: 'Poof! Successfully added to order'});
					LoginManager.getTally();
					callback(null, result);
				}, function(error){
					console.log(error);
					flash.setMessage({type: 'danger', message: 'Drat! Failed to add that to your cart. ' + error.data});
					callback(error);
				});
			},
			
			updateItem : function(item, callback) {
				var cb = callback || angular.noop;
				Restangular.all('api/cart').post(item).then(function(result) {
					flash.setMessage({
						type: 'success',
						message: "You're cart was successfully updated"
					});
					cb(null, result);
				}, function(error) {
					flash.setMessage({
						type: 'danger',
						message: error.data
					});
					cb(error, null);
				});
			},
			deleteItem : function(id) {
				var result = $q.defer();
				Restangular.all('api/cart')
				.customDELETE(id)
				.then(function() {
					result.resolve();
					$rootScope.cartTally --;
					flash.setMessage({
						type: 'success',
						message: "Poof! Got rid of that cart item for you."
					});
				}, function(error) {
					result.reject();
					flash.setMessage({
						type: 'danger',
						message: error.data
					});
				});
				
				return result.promise;
				
			}
		};
	}
])
	.factory('ButcheryForms', [function() {
		return {
			beef: {
				name: 'Beef Form',
				route: '/butchery/beef',
			},
			sheep: {
				name: 'Lamb, Sheep and Goat Form',
				route: '/butchery/sheep'
			},
			pig: {
				name: 'Pig Form',
				route: '/butchery/pig'
			}
		};
	}])
	
	.factory('ProductHistory', ['$rootScope', '$http', function($rootScope, $http) {
		var module = {
			getCurrentProducts : function(callback) {
				return $http.get("/api/product-list/current").success(callback);
			},
			getPastProducts : function(callback) {
				return $http.get("/api/product-list/past").success(callback);
			},
			getAllProducts : function(callback) {
				return $http.get("/api/product-list").success(callback);
			},
			getMeatProducts : function(callback) {
				return $http.get("/api/product-list", {
					query: {
						category: '5421e9192ba620071b4cb2a9',
						permanent: true
					}
				})
				.success(callback);
			},
			getMilkProducts : function(callback) {
				return $http.get("/api/product-list", {
					query: {
						category: '5421e9192ba620071b4cb2a9',
						permanent: true
					}
				})
				.success(callback);
			},
			
		};
		return module;
	}])
	
	.factory('ProducerList', ['$http', function($http) {
		var module = {
						
			getData : function(callback) {
				$http.get("/api/user/producer-list").success(callback);
			},
			
		};
		
		return module;
	}]);
