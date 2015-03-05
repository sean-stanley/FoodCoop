'use strict';
/*global angular*/

angular.module('co-op.user', ['ngRoute']).config(['$routeProvider', function($routeProvider) {
	
	$routeProvider
	.when('/product-upload-401', {templateUrl: 'partials/loggedIn/upload401.html', reloadOnSearch: false, title:'401 - Unauthorized to Sell'})
	
	.when('/product-upload', {
		templateUrl: 'partials/loggedIn/product-upload.html', 
		controller: 'productUploadCtrl',
		loggedInOnly: true, canSell: true, reloadOnSearch: false,
		title : 'Upload Products to Sell',
		resolve: { product: function() { return false; } }
	})
	
	.when('/product-upload/:productId', {
		controller: 'productUploadCtrl',
		templateUrl: 'partials/loggedIn/product-upload.html',
		loggedInOnly: true, canSell: true, reloadOnSearch: false,
		title : 'Edit Product',
		resolve: {
			product: ['Restangular', '$route', function(Restangular, $route) {
				return Restangular.one('api/product', $route.current.params.productId).get();
			}]
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
	
	
	;
}]);
	
