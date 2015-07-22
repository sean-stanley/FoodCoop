'use strict';
/*global angular*/

angular.module('co-op.user', ['ngRoute']).config(['$routeProvider', function($routeProvider) {
	
	$routeProvider
	//.when('/producer-profile', {templateUrl: 'partials/loggedIn/edit-producer-profile.html', controller: 'producerCtrl', loggedInOnly: true, reloadOnSearch: false})
	.when('/my-cart', {templateUrl: 'partials/loggedIn/orders/my-cart.html', controller: 'cartPageCtrl', loggedInOnly: true, reloadOnSearch: false})
	
	.when('/meat-order/:_id', {
		templateUrl: 'partials/loggedIn/orders/customer-meat.html', 
		controller: 'viewMeatOrderCtrl',
		loggedInOnly: true,
		reloadOnSearch: false,
		title: 'My Bulk Meat Order',
		resolve: {
			order: function($http, $route) {
				return $http.get('/api/meat-order/'+ $route.current.params._id);
			}
		}
	})
	
	.when('/meat-order/edit/:_id', {
		templateUrl: 'partials/loggedIn/orders/producer-meat.html', 
		controller: 'MeatOrderManagerCtrl',
		loggedInOnly: true,
		reloadOnSearch: false,
		title: 'Manage Bulk Meat Order',
		resolve: {
			order: function(Restangular, $route) {
				return Restangular.one('api/meat-order', $route.current.params._id).get();
			}
		}
	})
	
	.when('/butchery/sheep/:_id', {
		templateUrl: 'partials/loggedIn/butchery/sheep.html', controller: 'butcheryFormCtrl', loggedInOnly: true, reloadOnSearch: false,
		title: 'Sheep Butchery Form',
		resolve: {
			beast: function($http, $route) {
				return $http.get('/api/product/' + $route.current.params._id);
			}
		}
	})
	
	.when('/butchery/beef/:_id', {
		templateUrl: 'partials/loggedIn/butchery/beef.html', controller: 'butcheryFormCtrl', loggedInOnly: true, reloadOnSearch: false,
		title: 'Beef Butchery Form',
		resolve: {
			beast: function($http, $route) {
				return $http.get('/api/product/' + $route.current.params._id);
			}
		}
	})
	
	.when('/butchery/pig/:_id', {
		templateUrl: 'partials/loggedIn/butchery/pig.html', controller: 'butcheryFormCtrl', loggedInOnly: true, reloadOnSearch: false,
		title: 'Beef Butchery Form',
		resolve: {
			beast: function($http, $route) {
				return $http.get('/api/product/' + $route.current.params._id);
			}
		}
	})
	
	.when('/product-manager', {
		templateUrl: 'partials/loggedIn/order-manager.html', 
		controller: 'productOrderCtrl',
		loggedInOnly: true, reloadOnSearch: false,
		title : 'Manage Products',
		resolve: {
			products: function(Restangular) {
				return Restangular.all('api/product-list');
			},
			myOrders: function(Restangular) {
				return Restangular.all('api/order/me');
			},
			unfullfilledOrders: function(Restangular) {
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
	.when('/edit-me', {
		controller: 'userEditCtrl',
		templateUrl:'partials/loggedIn/edit-me.html',
		loggedInOnly: true, reloadOnSearch: false,
		title : 'My Settings',
	})
	.when('/me', {
		templateUrl:'partials/loggedIn/profile.html',
		loggedInOnly: true, reloadOnSearch: false,
		title : 'My Profile',
	})
	
	
	;
}]);
	
