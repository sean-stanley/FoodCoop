'use strict';
/*global angular, _, Date, oboe*/

/* Controllers */

angular.module('co-op.admin')
	
.controller('userAdminCtrl', ['$scope', 'users', '$location',
	function($scope, users) {
		$scope.userLibrary = users.getList().$object;
	}
])

.controller('adminUserEditCtrl', ['$scope', '$rootScope', 'LoginManager', 'flash', 'Restangular', '$location', 'user',
	function($scope, $rootScope, LoginManager, flash, Restangular, $location, user) {
		
		var original = user;
		
		$scope.user = Restangular.copy(original);
  
  		$scope.$watch('user.user_type.canSell', function(newValue) {
  			if ($scope.user.user_type.canSell) {
  				$scope.user.user_type.name = "Producer";
  			} else {
  				$scope.user.user_type.name = "Customer";
  			}
  		});
		  
		$scope.isClean = function() {
			return angular.equals(original, $scope.user);
		};

		$scope.destroy = function() {
			var lastChance = confirm('Are you sure you want to delete the profile of ' + user.name +'?');
			if (lastChance) {
				if ($scope.user._id === $rootScope.currentUser._id) {
					LoginManager.logout();
				}
				original.customDELETE(original._id).then(function() {
					flash.setMessage('User successfully Deleted');
					$location.path('/admin');
				});
			}
		};
		
		// sends a request for a password reset email to be sent to this user's email.
		$scope.passwordReset = function() {
			Restangular.all('api/forgot').post({email: original.email});
		};
		
		$scope.save = function() {
			if (!$scope.isClean()) {
				$scope.user.customPUT($scope.user, $scope.user._id).then(function(response) {
					// success!
					flash.setMessage({type: 'success', message: 'Changes saved successfully'});
				});
			}
			else {
				flash.setMessage({type: 'warning', message: 'No changes detected so no changes saved'});
			}
			
		};
	}
])

.controller('invoiceCtrl', ['$scope', '$rootScope', 'Restangular', 'flash',
	function($scope, $rootScope, Restangular, flash) {
		$scope.now = Date();
		
		$scope.soon = function(invoice) {
			if (invoice.status === 'un-paid') {
				if ( Date.parse(invoice.dueDate).between( Date.today(), Date.today().addWeeks(1) ) ) {
					return true;
					}
			}
			
			return false;
		};
		
		// the array of invoices for use in the template
		$scope.invoices = Restangular.all('api/invoice').getList().$object;
		
		// update the invoice
		$scope.invoiceSave = function (invoice) {
			invoice.put().then(
			function(result) {
				flash.setMessage({
					message: "Invoice Successfully updated",
					type: "success"
				});
				$scope.unPaid();
				$scope.overdue();
				}, 
			function(error) {
				flash.setMessage({
					message: "Sorry! Failed to update the invoice for some reason",
					type: "danger"
				});
			});
		};
		
		$scope.unPaid = function() {
			var match;
			match = _.where($scope.invoices, {status: 'un-paid'});
			return match.length;
		};
		
		$scope.overdue = function() {
			var match;
			match = _.where($scope.invoices, {status: 'OVERDUE'});
			return match.length;
		};
		
		$scope.invoiceDelete = function(invoice) {
			invoice.remove({id:invoice._id}).then(function(result){
				flash.setMessage({type:'success', message: "invoice successfully removed: "+ result});
			},
			function(error) {
				flash.setMessage({
					message: "Sorry! Failed to delete the invoice " + error ,
					type: "danger"
				});
			});
			
			$scope.invoices.splice($scope.invoices.indexOf(invoice), 1);
			
		};
		
	}
])

.controller('userCtrl', ['$scope', '$modal', '$location', 
	function($scope, $modal, $location) {
		$scope.open = function(application_type) {
			var modalInstance = $modal.open({
				templateUrl: 'partials/signup-form.html',
				controller: 'userModalCtrl',
				size: 'md',
				resolve: {
					data: function() {
						return application_type;
					}
				}
			});
			
			modalInstance.result.then(function (nextRoute) {
				console.log(nextRoute);
				$location.path(nextRoute);	
				
			}, function () {
				console.log('Modal dismissed at: ' + new Date());
			});
		};
	}
])

// admin cycle control
.controller('cycleCtrl', ['$scope', '$http', 'flash', 'cycle',
	function($scope, $http, flash, cycle){
		$scope.cycle = cycle.data;
		console.log(cycle.data);
		
		$scope.next = function() {
			$http.post('api/admin/cycle', {}).success(function(cycle) {
				console.log(cycle);
				if (!isNaN(cycle)) {
					$scope.cycle = cycle;
				}
				else {
					flash.setMessage({type:'warning', message: cycle});
				}
			});
		};
	}])

.controller('routeAdminCtrl', ['$scope', 'UserManager', function($scope, UserManager) {
	$scope.ruralUsers = UserManager.users.all('route').getList().$object;
}])

.controller('orderAdminCtrl', ['$scope', 'orders', function($scope, orders) {
	
	$scope.cycle = 4;
	
	$scope.next = function() {
		$scope.cycle += 1;
		$scope.orders = orders.getList({cycle: $scope.cycle}).$object;
	};
	
	$scope.previous = function() {
		$scope.cycle -= 1;
		$scope.orders = orders.getList({cycle: $scope.cycle}).$object;
	};
	
	$scope.predicate = 'customer.name';
	$scope.orders = orders.getList({cycle: $scope.cycle}).$object;
	$scope.total = function(orders, property, filter) {
		var order, total = 0;
		for (var i=0; i < orders.length; i++) {
			total += orders[i][property];
		}
		return total;
	};
	
	$scope.$watch('search', function() {
		$scope.total($scope.orders);
	});
}]);