'use strict';
/*global angular*/

// Declare app level module which depends on filters, and services
angular.module('co-op', [
	'ngAnimate',
	'ngRoute',
	// 'ngSanitize',
	'ngJcrop',
	'co-op.filters',
	'co-op.services',
	'co-op.directives',
	'co-op.controllers',
	'co-op.admin',
	'co-op.user',
	'co-op.product-upload',
	'co-op.orders',
	'angular-loading-bar',
	'btford.socket-io',
	'ui.bootstrap',
	'textAngular',
	'restangular',
	'angulartics', 'angulartics.google.analytics',
	'ngTouch'
	])
  .config(['$compileProvider', '$routeProvider', '$locationProvider', 'RestangularProvider', function($compileProvider, $routeProvider, $locationProvider, RestangularProvider) {
	var oldWhiteList = $compileProvider.imgSrcSanitizationWhitelist();
	$compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob):|data:image\/)/ );
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(|data:application\/csv;charset=utf-8|)/);

    $routeProvider
		.when('/', {templateUrl: 'partials/index-content.html', reloadOnSearch: false})
		.when('/signup', {templateUrl: 'partials/signup/signup.html', controller: 'userCtrl', reloadOnSearch: false, title: 'Signup',
		description: 'Signup to be a member of the NNFC. Northland\'s first food co-op.'
		})
    .when('/info/customer', {templateUrl: 'partials/signup/customer-info.html', reloadOnSearch: false, title: 'Customer Benefits'})
    .when('/info/producer', {templateUrl: 'partials/signup/producer-info.html', reloadOnSearch: false, title: 'Producer Benefits'})
		.when('/welcome', {templateUrl: 'partials/signup/welcome.html', loggedInOnly: true, reloadOnSearch: false, title: 'Welcome New Member'})
		.when('/apply', {
			templateUrl: 'partials/signup/producer-application.html',
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
		.when('/forgot', {templateUrl: 'partials/auth/forgot-password.html', controller: 'forgotCtrl', reloadOnSearch: false, title: 'Forgotten Password'})
		.when('/reset/:token', {
			controller: 'resetCtrl',
			templateUrl:'partials/auth/reset-password.html', reloadOnSearch: false,
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
		.when('/producer/:id/:userName', {
			controller: 'producerPageCtrl',
	 		templateUrl:'partials/producer-page.html', reloadOnSearch: false,
			title : 'Producer',
			description: 'Members of the northland natural food co-op have a profile about their practices and operation. Contact details for the producer is also found here.',
	 		resolve: {
	 			producer: function(Restangular, $route){
					return Restangular.one('api/user/producer', $route.current.params.userName).get({_id : $route.current.params.id});
	 			}
	 		}
	 	})
		.when('/features', {templateUrl: 'partials/features.html', reloadOnSearch:false, title:'Features of the NNFC'})
		.when('/faq', {templateUrl: 'partials/faq.html', controller: 'faqCtrl', reloadOnSearch: false})
		.when('/delivery', {
			templateUrl: 'partials/delivery.html',
			controller: 'deliveryCtrl',
			reloadOnSearch: false,
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

		.when('/message-board', {
			templateUrl: 'partials/message-board.html',
			reloadOnSearch: false,
			title:"Member Message Board",
			descrpiption: 'Post Messages for all members to see.',
			controller: 'MessageBoardCtrl',
			resolve: {
				messageHistory : function(Restangular) {
					return Restangular.all('api/message-board').getList().$object;
				}
			}
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

    .when('/login', {templateUrl: 'partials/auth/login.html', isLogin: true, reloadOnSearch: false})
    .when('/must-login', {templateUrl: 'partials/auth/must-login.html', isLogin: true, reloadOnSearch: false, title: 'Must Login'})
    .when('/login-failed', {templateUrl: 'partials/auth/login-failed.html', reloadOnSearch: false, title: 'Login Failed'})
    .when('/login-page', {templateUrl: 'partials/auth/login-page.html', reloadOnSearch: false, title: 'Login'})
    .when('/login-failed/attempts=:tries', {templateUrl: 'partials/auth/login-failed.html', reloadOnSearch: false})

    // store routes
	.when('/store', {
		templateUrl: 'partials/store/store-template.html',
		controller: 'storeCtrl',
		reloadOnSearch: false,
		title: 'Store',
		resolve: {
			categories: function($http) {
				return $http.get('/api/category');
			}
		}
	})

    .otherwise({redirectTo: '/'});

	// RestangularProvider.setBaseUrl('/api');

	RestangularProvider.setRestangularFields({
		id: '_id.$oid'
	});

	$locationProvider
	.html5Mode(true)
	.hashPrefix('!');

  }])
	.config(function(ngJcropConfigProvider){

	    // [optional] To change the jcrop configuration
	    // All jcrop settings are in: http://deepliquid.com/content/Jcrop_Manual.html#Setting_Options
	    ngJcropConfigProvider.setJcropConfig({
	        bgColor: 'black',
	        bgOpacity: 0.4,
	        aspectRatio: 42 / 30
	    });

	   // [optional] To change the css style in the preview image
	    ngJcropConfigProvider.setPreviewStyle({
				'display':'none',
				'visibility':'hidden'
				// 'width': '420px',
// 				'height': '300px',
// 				'overflow': 'hidden',
// 				'margin-left': '5px'
			});

	})
  .run(function($rootScope, $http) {
		$http.get('/api/calendar').success(function(result) {
			
      $rootScope.cycleObject = result.cycle;
			$rootScope.cycle = result.cycle._id;
			
			$rootScope.$broadcast('CALENDAR-LOADED');
			$rootScope.$broadcast('GET_CART');
		});
  })
	.run(['$rootScope', '$route', '$location', 'LoginManager', 'flash', 'Session', 'Restangular', '$window', function($rootScope, $route, $location, LoginManager, flash, Session, Restangular, $window) {
		$rootScope.slideInterval = 7000;
		$rootScope.setInterval = function(interval) {
			$rootScope.slideInterval = interval;
			console.log('interval changed to '+ interval);
		};
		$rootScope.page_title = 'Buy and Sell Local Food';
		$rootScope.page_description = "We help Whangarei and Northland buy and sell local food through our co-op store. We are a food co-op dedicated to helping our community buy local food. Our member's supply produce, meat, dairy, milk, bread, jams, spreads and sauces.";
		var originalDescription = $rootScope.page_description;


		$rootScope.$on('$routeChangeSuccess', function(event, next, current) {
			$rootScope.mobileMenu = true;
			if (next.$$route) {
				$rootScope.page_title = (next.$$route.hasOwnProperty('title')) ? next.title : 'NNFC';
				$rootScope.page_description = (next.$$route.hasOwnProperty('description')) ? next.description : originalDescription;
			}
			//$window.ga('send', 'pageview', { page: $location.path() });

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
				LoginManager.isLoggedIn().then(function(result) {
					if (next.adminOnly && !$rootScope.currentUser.user_type.isAdmin) {
						flash.setNextMessage({type: 'warning', message: "Sorry! That page is only available to Administrators"});
						$location.path('/');
					}
					if (next.canSell) {
						if (!$rootScope.currentUser.user_type.canSell) {
							$location.path('/product-upload-401');
						}
					}

				}, function(reason) {
					// redirect a user from viewing from a loggedInOnly page
						if (next.LoggedInOnly) $rootScope.savedLocation = $location.url();
						flash.setNextMessage({type: 'warning', message: 'Not logged in'});
						$location.path('must-login');
				});
			} else return;


		});
	}]);
