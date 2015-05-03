'use strict';
/*global angular*/

angular.module('co-op.product-upload', ['ngRoute']).config(['$routeProvider', function($routeProvider) {
	
	$routeProvider
	.when('/product-upload-401', {templateUrl: 'partials/loggedIn/product-upload/401.html', reloadOnSearch: false, title:'401 - Unauthorized to Sell'})
	
	.when('/product-upload', {
		templateUrl: 'partials/loggedIn/product-upload/product.html', 
		controller: 'productUploadCtrl',
		loggedInOnly: true, canSell: true, reloadOnSearch: false,
		title : 'Sell a Product online',
		resolve: { product: function() { return false; } }
	})
	
	.when('/product-upload/:productId', {
		controller: 'productUploadCtrl',
		templateUrl: 'partials/loggedIn/product-upload/product.html',
		loggedInOnly: true, canSell: true, reloadOnSearch: false,
		title : 'Edit Product',
		resolve: {
			product: ['Restangular', '$route', function(Restangular, $route) {
				return Restangular.one('api/product', $route.current.params.productId).get();
			}]
		}
	})
	
	.when('/meat-upload', {
		templateUrl: 'partials/loggedIn/product-upload/meat.html', 
		controller: 'PermanentProductUploadController',
		loggedInOnly: true, canSell: true, reloadOnSearch: false,
		title : 'Sell Whole Beast Online',
		resolve: { 
			product: function() { return false; },
			category: function($http) {return $http.get('/api/category?name=Meat');}
		}
	})
	
	.when('/meat-upload/:id', {
		templateUrl: 'partials/loggedIn/product-upload/meat.html', 
		controller: 'PermanentProductUploadController',
		loggedInOnly: true, canSell: true, reloadOnSearch: false,
		title : 'Edit Whole Beast you sell',
		resolve: {
			product: ['Restangular', '$route', function(Restangular, $route) {
				return Restangular.one('api/product', $route.current.params.id).get();
			}],
			category: function($http) {return $http.get('/api/category?name=Meat');} 
		}
	})
	
	.when('/milk-upload', {
		templateUrl: 'partials/loggedIn/product-upload/milk.html', 
		controller: 'PermanentProductUploadController',
		loggedInOnly: true, canSell: true, reloadOnSearch: false,
		title : 'Sell Raw Milk Online',
		resolve: { product: function() { return false; } },
		category: function($http) {return $http.get('/api/category?Name=Dairy%20%26%20Eggs');} 
	})
	
	.when('/milk-upload/:id', {
		templateUrl: 'partials/loggedIn/product-upload/milk.html', 
		controller: 'PermanentProductUploadController',
		loggedInOnly: true, canSell: true, reloadOnSearch: false,
		title : 'Edit Raw Milk You Sell',
		resolve: {
			product: ['Restangular', '$route', function(Restangular, $route) {
				return Restangular.one('api/product', $route.current.params.id).get();
			}],
			category: function($http) {return $http.get('/api/category?Name=Dairy%20%26%20Eggs');}
		}
	})
	
	;
}]);
	
