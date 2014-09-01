'use strict';
/*global angular*/

// Declare app level module which depends on filters, and services
angular.module('co-op', [ 
	'ngRoute', 
	'ngResource', 
	'ngCookies', 
	'ngSanitize',
	'ngTouch',
	'superswipe',
	'co-op.filters', 
	'co-op.services', 
	'co-op.directives', 
	'co-op.controllers',
	'angular-loading-bar', 
	'ngAnimate', 
	'ui.bootstrap',
	'cropme',
	'restangular'])

  .config(['$routeProvider', 'RestangularProvider', function($routeProvider, RestangularProvider) {
    $routeProvider
		.when('/', {templateUrl: 'partials/index-content.html', controller: 'MyCtrl1', reloadOnSearch: false})
		.when('/calendar', {templateUrl: 'partials/calendar.html', controller: 'calendarCtrl', reloadOnSearch: false})
		.when('/signup', {templateUrl: 'partials/signup.html', controller: 'userCtrl', reloadOnSearch: false})
		.when('/welcome', {templateUrl: 'partials/thankyou.html', loggedInOnly: true, reloadOnSearch: false})
		.when('/apply', {
			templateUrl: 'partials/producer-application.html', 
			controller: 'producerApplicationCtrl', 
			reloadOnSearch: false,
			loggedInOnly: true,
			resolve: {
				certifications: function(Restangular, $route) {
					return Restangular.all('api/certification');
				}
			}
		})
		.when('/terms-cons', {templateUrl: 'partials/legal/terms-cons.html', reloadOnSearch: false})
		.when('/priv-pol', {templateUrl: 'partials/legal/priv-pol.html', reloadOnSearch: false})
		.when('/users-rights', {
			templateUrl: 'partials/admin/users-rights.html', 
			controller: 'userAdminCtrl', 
			adminOnly: true, reloadOnSearch: false,
			resolve: {
				users: function(Restangular) {
					return Restangular.all('api/user');
				}
			}
		})
		.when('/user/:userId', {
			controller: 'userEditCtrl', 
			templateUrl:'partials/admin/details.html',
			adminOnly: true, reloadOnSearch: false,
			resolve: {
				user: function(Restangular, $route){
					return Restangular.one('api/user', $route.current.params.userId).get();
				}
			}
		})
		.when('/admin/invoices', { controller: 'invoiceCtrl', templateUrl: 'partials/admin/invoices.html', adminOnly: true, reloadOnSearch: false })
		
		.when('/forgot', {templateUrl: 'partials/forgot-password.html', controller: 'forgotCtrl', reloadOnSearch: false})
		.when('/reset/:token', {
			controller: 'resetCtrl',
			templateUrl:'partials/reset-password.html', reloadOnSearch: false,
			resolve: {
				user: function(Restangular, $route) {
					return Restangular.one('api/reset', $route.current.params.token).get();
				}
			}
		})
		.when('/about', {templateUrl: 'partials/about.html', reloadOnSearch: false})
		.when('/calendar', {templateUrl: 'partials/calendar.html', controller:'calendarCtrl', reloadOnSearch: false})
		.when('/producer-list', {templateUrl: 'partials/producer-list.html', controller: 'producerListCtrl', reloadOnSearch: false})
		.when('/producer/:companyName-:userName', {
			controller: 'producerPageCtrl',
	 		templateUrl:'partials/producer-page.html', reloadOnSearch: false,
	 		resolve: {
	 			producer: function(Restangular, $route){
					return Restangular.one('api/user/producer', $route.current.params.userName).get();
	 			}
	 		}
	 	})
	
		.when('/faq', {templateUrl: 'partials/faq.html', controller: 'faqCtrl'})
    
		.when('/product-upload', {
			templateUrl: 'partials/loggedIn/product-upload.html', 
			controller: 'productUploadCtrl', 
			loggedInOnly: true, reloadOnSearch: false,
			resolve: { product: function() { return {}; } }
		})
		.when('/product-upload/:productId', {
			controller: 'productUploadCtrl',
			templateUrl: 'partials/loggedIn/product-upload.html',
			loggedInOnly: true, reloadOnSearch: false,
			resolve: {
				product: function(Restangular, $route) {
					return Restangular.one('api/product', $route.current.params.productId).get();
				}
			}
		})
		.when('/producer-profile', {templateUrl: 'partials/loggedIn/edit-producer-profile.html', controller: 'producerCtrl', loggedInOnly: true, reloadOnSearch: false})
		.when('/my-cart', {templateUrl: 'partials/loggedIn/my-cart.html', controller: 'cartPageCtrl', loggedInOnly: true, reloadOnSearch: false})
    	.when('/product-manager', {
			templateUrl: 'partials/loggedIn/order-manager.html', 
			controller: 'productOrderCtrl',
			loggedInOnly: true, reloadOnSearch: false,
			resolve: {
				products: function(Restangular, $route) {
					return Restangular.all('api/product-list');
				},
				myOrders: function(Restangular, $route) {
					return Restangular.all('api/order/me');
				},
				unfullfilledOrders: function(Restangular, $route) {
					return Restangular.all('api/order/cycle');
				}
			}
		})
		.when('/my-invoices', {
			controller: 'userInvoiceCtrl',
			templateUrl:'partials/loggedIn/invoices.html',
			loggedInOnly: true, reloadOnSearch: false
		})
		.when('/me/:userId', {
			controller: 'userEditCtrl',
			templateUrl:'partials/loggedIn/edit-me.html',
			loggedInOnly: true, reloadOnSearch: false,
			resolve: {
				user: function(Restangular, $route){
					return Restangular.one('api/user', $route.current.params.userId).get();
				}
			}
		})

		.when('/contact', {templateUrl: 'partials/contact.html', controller: 'contactCtrl', reloadOnSearch: false})
		.when('/contact/:userId', {
			templateUrl: 'partials/contact.html', 
			controller: 'producerContactCtrl', reloadOnSearch: false,
			resolve: {
				member: function(Restangular, $route){
					return Restangular.one('api/user', $route.current.params.userId).get();
				}
			}
		})
	
    .when('/login', {templateUrl: 'partials/login.html', isLogin: true, reloadOnSearch: false})
    .when('/must-login', {templateUrl: 'partials/must-login.html', isLogin: true, reloadOnSearch: false})
    .when('/login-failed', {templateUrl: 'partials/login-failed.html', reloadOnSearch: false})
    .when('/login-page', {templateUrl: 'partials/login-page.html', reloadOnSearch: false})
    .when('/login-failed/attempts=:tries', {templateUrl: 'partials/login-failed.html', reloadOnSearch: false})
    
    // store routes
	.when('/store', {templateUrl: 'partials/store/store-template.html', controller: 'storeCtrl', reloadOnSearch: false})

    .otherwise({redirectTo: '/'});
    
	// RestangularProvider.setBaseUrl('/api');
	
	RestangularProvider.setRestangularFields({
		id: '_id.$oid'
	});
	
  }])
	.run(function($rootScope, $route, $location, LoginManager, flash, Session) {
		// without a callback this function simply checks if the user is authenticated
		// and if he is, saves his data to the rootScope. Handy for getting the data
		// when a session hasn't expired yet. It runs once when the app starts.
		$rootScope.month =  Date.today().toString('MMMM');
		$rootScope.flash = flash;
		Session.customGET().then(function(user) {
			if (typeof user === 'object' && user.hasOwnProperty('email')) {
				console.log(user.plain());
				// if the user has a session save this data for the app to use.
				$rootScope.currentUser = user.plain();
			}
		});
		
		// good but not ideal way to do authentication. Need to find a solution that doesn't trigger a routeChange until after authentication has been resolved 
		/*$rootScope.$on( '$routeChangeStart', function(event, next, current) {
			LoginManager.isLoggedIn().then(function(isAuth) {
				var message;
				// redirect a user who is not logged in from going to a logged in only page
				if (!isAuth && next.loggedInOnly || next.adminOnly) {
					$rootScope.savedLocation = $location.url();
					$rootScope.flash.setMessage({type: 'warning', message: 'Not logged in'});
					$location.path('/must-login');
				}
				// redirect a non-admin from viewing an admin only page
				else if (isAuth && !$rootScope.currentUser.user_type.isAdmin && next.adminOnly) {
					message = "Sorry! That page is only available to Administrators";
					$rootScope.flash.setMessage({type: 'warning', message: message});
					$location.path(current);
				}

			});
        });*/
        
        $rootScope.$on( '$locationChangeStart', function(event, next, current) {
	        var nextPath = $location.path(); // return next path (not full URL);
	        var nextRoute = $route.routes[nextPath]; // returns undefined if a route param is part of the next path
	        if (nextRoute) nextRoute.loggedInOnly = nextRoute.hasOwnProperty('loggedInOnly') ? nextRoute.loggedInOnly : false;
        
	        
	        if (!$rootScope.currentUser && nextRoute.loggedInOnly) {
		        event.preventDefault();
		        
		        LoginManager.isLoggedIn().then(function(isAuth) {
					var message;
					// redirect a user who is not logged in from going to a logged in only page
					if (!isAuth && nextRoute.loggedInOnly || nextRoute.adminOnly) {
						$rootScope.savedLocation = $location.url();
						$rootScope.flash.setMessage({type: 'warning', message: 'Not logged in'});
						$location.path('/must-login');
					}
					// redirect a non-admin from viewing an admin only page
					else if (isAuth && !$rootScope.currentUser.user_type.isAdmin && nextRoute.adminOnly) {
						message = "Sorry! That page is only available to Administrators";
						$rootScope.flash.setMessage({type: 'warning', message: message});
						$location.url(current);
					}
					// allow a logged in user or admin to see a loggedInOnly page
					else if (isAuth && nextRoute.loggedInOnly) {
						//$route.updateParams(nextRoute.originalPath); not working
						$route.reload();
					}
	
				});
	        }
	        
        });

  });
  
