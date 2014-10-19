'use strict';
/*global angular*/

// Declare app level module which depends on filters, and services
angular.module('co-op', [ 
	'ngRoute', 
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
	'textAngular',
	'cropme',
	'restangular'])

  .config(['$compileProvider', '$routeProvider', '$locationProvider', 'RestangularProvider', function($compileProvider, $routeProvider, $locationProvider, RestangularProvider) {
	var oldWhiteList = $compileProvider.imgSrcSanitizationWhitelist();
	$compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob):|data:image\/)/ );
	
    $routeProvider
		.when('/', {templateUrl: 'partials/index-content.html', reloadOnSearch: false})
		.when('/signup', {templateUrl: 'partials/signup.html', controller: 'userCtrl', reloadOnSearch: false, title: 'Signup',
		description: 'Signup to be a member of the NNFC. Northland\'s first food co-op.'
		})
		.when('/welcome', {templateUrl: 'partials/welcome.html', loggedInOnly: true, reloadOnSearch: false, title: 'Welcome New Member'})
		.when('/apply', {
			templateUrl: 'partials/producer-application.html', 
			controller: 'producerApplicationCtrl', 
			reloadOnSearch: false,
			loggedInOnly: true, title: 'Apply to Sell',
			description: 'Application to be a producer member of our local food coop the northland natural food coop requires only a short amount of time and a larger membership fee.',
			resolve: {
				certifications: function(Restangular, $route) {
					return Restangular.all('api/certification');
				}
			}
		})
		.when('/terms-cons', {templateUrl: 'partials/legal/terms-cons.html', reloadOnSearch: false, title: 'Terms and Conditions'})
		.when('/priv-pol', {templateUrl: 'partials/legal/priv-pol.html', reloadOnSearch: false, title: 'Privacy Policy'})
		.when('/policy', {templateUrl: 'partials/legal/policy.html', reloadOnSearch: false, title: 'Policy Handbook'})
		.when('/admin', {
			templateUrl: 'partials/admin/admin.html', 
			controller: 'userAdminCtrl', 
			adminOnly: true, reloadOnSearch: false, title: 'Admin',
			resolve: {
				users: function(Restangular) {
					return Restangular.all('api/user');
				}
			}
		})
		.when('/user/:userId', {
			controller: 'adminUserEditCtrl', 
			templateUrl:'partials/admin/details.html',
			title: 'Admin',
			adminOnly: true, reloadOnSearch: false,
			resolve: {
				user: function(Restangular, $route){
					return Restangular.one('api/user', $route.current.params.userId).get();
				}
			}
		})
		.when('/admin/invoices', { controller: 'invoiceCtrl', templateUrl: 'partials/admin/invoices.html', adminOnly: true, reloadOnSearch: false, title: 'Admin' })
		
		.when('/forgot', {templateUrl: 'partials/forgot-password.html', controller: 'forgotCtrl', reloadOnSearch: false, title: 'Forgotten Password'})
		.when('/reset/:token', {
			controller: 'resetCtrl',
			templateUrl:'partials/reset-password.html', reloadOnSearch: false,
			resolve: {
				user: function(Restangular, $route) {
					return Restangular.one('api/reset', $route.current.params.token).get();
				}
			}
		})
		.when('/about', {templateUrl: 'partials/about.html', reloadOnSearch: false, title: "About",
		description: "The Northland Natural Food Co-op was founded by Sean Stanley in 2014. The food coop is based on the Oklahoma Food Coop system. We seek to make food local, affordable and sustainable."
	})
		.when('/calendar', {templateUrl: 'partials/calendar.html', controller:'calendarCtrl', reloadOnSearch: false, 
			title: 'Co-op Calendar', 
			description: 'Ordering with our local food co-op follows a cycle to help reduce travel and shipping costs of local food. First fresh products are uploaded, then members shop, finally, orders are brought to Whangarei and distributed to all members.'
		})
		.when('/producer-list', {templateUrl: 'partials/producer-list.html', controller: 'producerListCtrl', reloadOnSearch: false,
			title: 'Local Producer Directory',
			description: 'Members of the northland natural food co-op have a profile about their practices and operation. Contact details for the producer is also found here.'
		})
		.when('/producer/:companyName-:userName', {
			controller: 'producerPageCtrl',
	 		templateUrl:'partials/producer-page.html', reloadOnSearch: false,
			title : 'Producer',
			description: 'Members of the northland natural food co-op have a profile about their practices and operation. Contact details for the producer is also found here.',
	 		resolve: {
	 			producer: function(Restangular, $route){
					return Restangular.one('api/user/producer', $route.current.params.userName).get({company : $route.current.params.companyName});
	 			}
	 		}
	 	})
	
		.when('/faq', {templateUrl: 'partials/faq.html', controller: 'faqCtrl', reloadOnSearch: false})
		.when('/delivery', {
			templateUrl: 'partials/delivery.html',
			controller: 'deliveryCtrl',
			title : 'Delivery',
			description: 'Have your orders delivered to your community for more local pickup.',
			resolve: {
				routeManagerList : function(Restangular) {
					return Restangular.all('api/user').getList({'user_type.isRouteManager': true}).$object;
				}
			}	
		})
		.when('/volunteer', {templateUrl: 'partials/volunteers.html', reloadOnSearch: false, title: "Volunteer Jobs", 
			description: 'The NNFC, Northland\'s local food coop, needs volunteers to help maintain the service. Volunteers are usually members and have jobs such as sorting orders, delivering orders and managing a delivery route.'
		})
    
		.when('/product-upload', {
			templateUrl: 'partials/loggedIn/product-upload.html', 
			controller: 'productUploadCtrl', 
			loggedInOnly: true, reloadOnSearch: false,
			title : 'Upload Products to Sell',
			resolve: { product: function() { return {}; } }
		})
		.when('/product-upload/:productId', {
			controller: 'productUploadCtrl',
			templateUrl: 'partials/loggedIn/product-upload.html',
			loggedInOnly: true, reloadOnSearch: false,
			title : 'Edit Product',
			resolve: {
				product: function(Restangular, $route) {
					return Restangular.one('api/product', $route.current.params.productId).get();
				}
			}
		})
		//.when('/producer-profile', {templateUrl: 'partials/loggedIn/edit-producer-profile.html', controller: 'producerCtrl', loggedInOnly: true, reloadOnSearch: false})
		.when('/my-cart', {templateUrl: 'partials/loggedIn/my-cart.html', controller: 'cartPageCtrl', loggedInOnly: true, reloadOnSearch: false})
    	.when('/product-manager', {
			templateUrl: 'partials/loggedIn/order-manager.html', 
			controller: 'productOrderCtrl',
			loggedInOnly: true, reloadOnSearch: false,
			title : 'Manage Products',
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
			loggedInOnly: true, reloadOnSearch: false,
			title : 'My Invoices',
			description: 'Use the contact form to contact another northland natural food co-op member.',
		})
		.when('/me', {
			controller: 'userEditCtrl',
			templateUrl:'partials/loggedIn/edit-me.html',
			loggedInOnly: true, reloadOnSearch: false,
			title : 'My Settings',
			
		})

		.when('/contact', {templateUrl: 'partials/contact.html', controller: 'contactCtrl', reloadOnSearch: false})
		.when('/contact/:userId', {
			templateUrl: 'partials/contact.html', 
			controller: 'producerContactCtrl', reloadOnSearch: false,
			title : 'contact member',
			description: 'Use the contact form to contact another northland natural food co-op member.',
			resolve: {
				member: function(Restangular, $route){
					return Restangular.one('api/user', $route.current.params.userId).get();
				}
			}
		})
	
    .when('/login', {templateUrl: 'partials/login.html', isLogin: true, reloadOnSearch: false})
    .when('/must-login', {templateUrl: 'partials/must-login.html', isLogin: true, reloadOnSearch: false, title: 'Must Login'})
    .when('/login-failed', {templateUrl: 'partials/login-failed.html', reloadOnSearch: false, title: 'Login Failed'})
    .when('/login-page', {templateUrl: 'partials/login-page.html', reloadOnSearch: false, title: 'Login'})
    .when('/login-failed/attempts=:tries', {templateUrl: 'partials/login-failed.html', reloadOnSearch: false})
    
    // store routes
	.when('/store', {templateUrl: 'partials/store/store-template.html', controller: 'storeCtrl', reloadOnSearch: false, title: 'Store'})

    .otherwise({redirectTo: '/'});
    
	// RestangularProvider.setBaseUrl('/api');
	
	RestangularProvider.setRestangularFields({
		id: '_id.$oid'
	});
	
	$locationProvider
	.html5Mode(true)
	.hashPrefix('!');
	
  }])
	.run(function($rootScope, $route, $location, LoginManager, flash, Session, Restangular, $window) {
		$rootScope.slideInterval = 7000;
		$rootScope.setInterval = function(interval) {
			$rootScope.slideInterval = interval;
			console.log('interval changed to '+ interval);
		};
		$rootScope.page_title = 'NNFC';
		$rootScope.page_description = "We help Northland buy and sell local food through our co-op store. We are a food co-op dedicated to helping our community buy local food. Our member's supply produce, meat, dairy, milk, bread, and home-made goods.";
		var originalDescription = $rootScope.page_description;
		
		
		$rootScope.$on('$routeChangeSuccess', function(event, next, current) {
			if (next.$$route) {
				$rootScope.page_title = (next.$$route.hasOwnProperty('title')) ? next.title : 'NNFC';
				$rootScope.page_description = (next.$$route.hasOwnProperty('description')) ? next.description : originalDescription;
			}
			$window.ga('send', 'pageview', { page: $location.path() });
			
		});

		// when the app starts, check if the user is logged in. This does not return a
		// 401 error but a custom error to avoid the regular errorInterceptor the app
		// uses. 
		LoginManager.isLoggedIn('initial').catch(function(reason) {
			//$location.path('/');
		});
		
		Restangular.setErrorInterceptor(function(response, deferred, responseHandler) {
			if(response.status === 401) {
				if ($rootScope.currentUser) {
					return false; // error handled
				}
				else {
					flash.setNextMessage({type: 'warning', message: 'You can\'t see that page unless you are logged in'});
					return true;
				}
		        
		    }

		    return true; // error not handled
		});
		
		// good but not ideal way to do authentication. Need to find a solution that doesn't trigger a routeChange until after authentication has been resolved 
		$rootScope.$on( '$routeChangeStart', function(event, next, current) {
			if (next.loggedInOnly || next.adminOnly) {
				LoginManager.isLoggedIn().catch(function(reason) {
					var message;
					
					// redirect a non-admin from viewing an admin only page
					if (next.adminOnly) {
						message = "Sorry! That page is only available to Administrators";
						flash.setNextMessage({type: 'warning', message: message});
						$location.path('must-login');
					}
					else {
						$rootScope.savedLocation = $location.url();
						flash.setNextMessage({type: 'warning', message: 'Not logged in'});
						$location.path('must-login');
					}

				});
			}
			else return;
			
			
        });
  });
  
