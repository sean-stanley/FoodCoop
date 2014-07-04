'use strict';
/*global angular*/

// Declare app level module which depends on filters, and services
angular.module('co-op', [ 
	'ngRoute', 
	'ngResource', 
	'ngCookies', 
	'co-op.filters', 
	'co-op.services', 
	'co-op.directives', 
	'co-op.controllers', 
	'ngAnimate', 
	'ui.bootstrap',
	'restangular']).

  config(['$routeProvider', 'RestangularProvider', function($routeProvider, RestangularProvider) {
    $routeProvider.when('/home', {templateUrl: 'partials/index-content.html', controller: 'MyCtrl1'});
    $routeProvider.when('/signup', {templateUrl: 'partials/signup.html', controller: 'userCtrl'});
    $routeProvider.when('/thankyou', {templateUrl: 'partials/thankyou.html', controller: 'signupInvoiceCtrl'});
	
    $routeProvider.when('/terms-cons', {templateUrl: 'partials/legal/terms-cons.html'});
    $routeProvider.when('/priv-pol', {templateUrl: 'partials/legal/priv-pol.html'});

    $routeProvider.when('/users-rights', {templateUrl: 'partials/admin/users-rights.html', controller: 'userAdminCtrl'});
	$routeProvider.when('/user/:userId', {
	        controller: 'userEditCtrl', 
	        templateUrl:'partials/admin/details.html',
	        resolve: {
	          user: function(Restangular, $route){
	            return Restangular.one('user', $route.current.params.userId).get();
	          }
	        }
	      });
	$routeProvider.when('/about', {templateUrl: 'partials/about.html'});
    $routeProvider.when('/producer-list', {templateUrl: 'partials/producer-list.html', controller: 'producerListCtrl'});
    
	$routeProvider.when('/product-upload', {templateUrl: 'partials/loggedIn/product-upload.html', controller: 'productUpload'});
    $routeProvider.when('/producer-profile', {templateUrl: 'partials/loggedIn/edit-producer-profile.html', controller: 'producerCtrl'});
	$routeProvider.when('/my-cart', {templateUrl: 'partials/loggedIn/my-cart.html'});
    $routeProvider.when('/order-manager', {templateUrl: 'partials/loggedIn/order-manager.html'});

	$routeProvider.when('/contact', {templateUrl: 'partials/contact.html', controller: 'contactCtrl'});
	
    $routeProvider.when('/login', {templateUrl: 'partials/login.html'});
    $routeProvider.when('/must-login', {templateUrl: 'partials/must-login.html'});
    $routeProvider.when('/forgot-password', {templateUrl: 'partials/forgot-password.html', controller: 'resetPwdCtrl'}); //needs to be sorted and replaced with the node server script for password resetting. Mailer has to be setup first though.
    

    $routeProvider.when('/store', {templateUrl: 'store.html'});
    $routeProvider.otherwise({redirectTo: '/home'});
    
	RestangularProvider.setBaseUrl('/api');
	RestangularProvider.setRequestInterceptor(function(elem, operation, what) {        
		if (operation === 'put') {
			elem._id = undefined;
			return elem;
		}
		return elem;
	});
	RestangularProvider.setRestangularFields({
		id: '_id.$oid'
	});
	
  }])
  .run(function($rootScope, $location, LoginManager) {
  
        $rootScope.$on( '$routeChangeStart', function(event, next, current) {
        	switch(next.originalPath) {
				case '/home':
				case '/about':
				case '/signup':
				case '/contact':
				case '/producer-list':
				case '/users-rights': //remove this before going live	
				case '/thankyou':
				case '/login':
					
				    break;
				default:	        	
					if ($rootScope.currentUser === null && next.templateUrl !== '/partials/login.html') {
						$location.path("/must-login");
					}
		            break;
		    }
        });

  });