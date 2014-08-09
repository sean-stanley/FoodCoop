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
	'ngAnimate', 
	'ui.bootstrap',
	'cropme',
	'restangular'])

  .config(['$routeProvider', 'RestangularProvider', function($routeProvider, RestangularProvider) {
    $routeProvider
		.when('/home', {templateUrl: 'partials/index-content.html', controller: 'MyCtrl1'})
		.when('/signup', {templateUrl: 'partials/signup.html', controller: 'userCtrl'})
		.when('/welcome', {templateUrl: 'partials/thankyou.html', controller: 'signupInvoiceCtrl'})
		.when('/terms-cons', {templateUrl: 'partials/legal/terms-cons.html'})
		.when('/priv-pol', {templateUrl: 'partials/legal/priv-pol.html'})
		.when('/users-rights', {templateUrl: 'partials/admin/users-rights.html', controller: 'userAdminCtrl', adminOnly: true})
		.when('/user/:userId', {
			controller: 'userEditCtrl', 
			templateUrl:'partials/admin/details.html',
			adminOnly: true,
			resolve: {
				user: function(Restangular, $route){
					return Restangular.one('api/user', $route.current.params.userId).get();
				}
			}
		})
		.when('/admin/invoices', { controller: 'invoiceCtrl', templateUrl: 'partials/admin/invoices.html' })
		
		.when('/forgot', {templateUrl: 'partials/forgot-password.html', controller: 'forgotCtrl'})
		.when('/reset/:token', {
			controller: 'resetCtrl',
			templateUrl:'partials/reset-password.html',
			resolve: {
				user: function(Restangular, $route) {
					return Restangular.one('api/reset', $route.current.params.token).get();
				}
			}
		})
		.when('/about', {templateUrl: 'partials/about.html'})
		.when('/producer-list', {templateUrl: 'partials/producer-list.html', controller: 'producerListCtrl'})
		.when('/producer/:companyName-:userName', {
			controller: 'producerPageCtrl',
	 		templateUrl:'partials/producer-page.html',
	 		resolve: {
	 			producer: function(Restangular, $route){
				return Restangular.one('api/user/producer', $route.current.params.userName).get();
	 			}
	 		}
	 	})
	
	
		.when('/faq', {templateUrl: 'partials/faq.html'})
    
		.when('/product-upload', {templateUrl: 'partials/loggedIn/product-upload.html', controller: 'productUpload', loggedInOnly: true})
		.when('/producer-profile', {templateUrl: 'partials/loggedIn/edit-producer-profile.html', controller: 'producerCtrl', loggedInOnly: true})
		.when('/my-cart', {templateUrl: 'partials/loggedIn/my-cart.html', loggedInOnly: true})
    	.when('/order-manager', {templateUrl: 'partials/loggedIn/order-manager.html', loggedInOnly: true})
		.when('/me/:userId', {
			controller: 'userEditCtrl',
			templateUrl:'partials/loggedIn/edit-me.html',
			loggedInOnly: true,
			resolve: {
				user: function(Restangular, $route){
					return Restangular.one('api/user', $route.current.params.userId).get();
				}
			}
		})

		.when('/contact', {templateUrl: 'partials/contact.html', controller: 'contactCtrl'})
		.when('/contact/:userId', {
			templateUrl: 'partials/contact.html', 
			controller: 'producerContactCtrl',
			resolve: {
				producer: function(Restangular, $route){
					return Restangular.one('api/user', $route.current.params.userId).get();
				}
			}
		})
	
    .when('/login', {templateUrl: 'partials/login.html', isLogin: true})
    .when('/must-login', {templateUrl: 'partials/must-login.html', isLogin: true})
    .when('/login-failed', {templateUrl: 'partials/login-failed.html'})
    .when('/login-failed/attempts=:tries', {templateUrl: 'partials/login-failed.html'})

    .when('/store', {templateUrl: 'store.html'})
    .otherwise({redirectTo: '/home'});
    
	// RestangularProvider.setBaseUrl('/api');
	
	RestangularProvider.setRestangularFields({
		id: '_id.$oid'
	});
	
  }])
	.run(function($rootScope, $location, LoginManager, flash) {
		// without a callback this function simply checks if the user is authenticated
		// and if he is, saves his data to the rootScope. Handy for getting the data
		// when a session hasn't expired yet. It runs once when the app starts.
		$rootScope.flash = flash;
		LoginManager.isLoggedIn();
		
		
		
		$rootScope.$on( '$routeChangeStart', function(event, next, current) {
			LoginManager.isLoggedIn(function(isAuth) {
				var message;
				// redirect a user who is not logged in from going to a logged in only page
				if (!isAuth && next.loggedInOnly || next.adminOnly) {
					$rootScope.savedLocation = $location.url();
					$location.path('/must-login');
				}
				// redirect a non-admin from viewing an admin only page
				else if (isAuth && !$rootScope.currentUser.user_type.isAdmin && next.adminOnly) {
					message = "Sorry! That page is only available to Administrators";
					$rootScope.flash.setMessage(message);
					$location.path(current);
				}
			});
			
			
			
        });

  });