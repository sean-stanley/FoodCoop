'use strict';
/*global angular*/

angular.module('co-op.admin', ['ngRoute']).config(['$routeProvider', function($routeProvider) {
	
    $routeProvider
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
		.when('/admin/cycle', { 
			controller: 'cycleCtrl', 
			templateUrl: 'partials/admin/cycle.html', 
			adminOnly: true, 
			reloadOnSearch: false, 
			title: 'Cycle Manager Page'
		})
		.when('/admin/orders', { controller: 'orderAdminCtrl', templateUrl: 'partials/admin/orders.html', adminOnly: true, reloadOnSearch: false, title: 'Order Manager Page',
			resolve: {
				orders: function(Restangular) {
					return Restangular.all('api/order');
				}
			}
		})
		.when('/admin/routes', { controller: 'routeAdminCtrl', templateUrl: 'partials/admin/routes.html', adminOnly: true, reloadOnSearch: false, title: 'Route Master Page'});
  }]);
	
