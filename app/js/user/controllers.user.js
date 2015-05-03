'use strict';
/*global angular, _, Date, oboe*/

/* Controllers */

angular.module('co-op.user')
.controller('userEditCtrl', ['$scope', '$rootScope', 'Restangular', 'LoginManager', 'flash', 'UserManager',
	function($scope, $rootScope, Restangular, LoginManager, flash, UserManager) {

		$scope.destroy = function() {
			var lastChance = confirm('Are you sure you want to delete the profile of ' + $rootScope.currentUser.name +'?');
			if (lastChance) {
				UserManager.delCurrentUser(function() {
					LoginManager.logout();
					flash.setMessage('Account successfully Deleted');
				});
			}
		};
		
		$scope.$watch('currentUser.user_type.name', function(newValue) {
			console.log(newValue);
			if (newValue === 'Customer') {
				$rootScope.currentUser.user_type.canSell = false;
			}
		});
		
		// sends a request for a password reset email to be sent to this user's email.
		$scope.passwordReset = function() {
			Restangular.all('api/forgot').post({email: $rootScope.currentUser.email});
		};
		
		$scope.save = function() {
			UserManager.save();
		};
	}
])
.controller('userInvoiceCtrl', ['$scope', 'Restangular', '$rootScope', function($scope, Restangular, $rootScope){
	$scope.now = Date();
	
	$scope.sort = "_id";
	
	$scope.invoices = Restangular.all('api/invoice').getList({invoicee : $rootScope.currentUser._id}).$object;
	$scope.soon = function(invoice) {
		if (invoice.status === 'un-paid') {
			if ( Date.parse(invoice.dueDate).between( Date.today(), Date.today().addWeeks(1) ) ) {
				return true;
				}
		}
		return false;
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
}])

.controller('userCtrl', ['$scope', '$modal', '$location', 
	function($scope, $modal, $location) {
		$scope.open = function(application_type) {
			var modalInstance = $modal.open({
				templateUrl: 'partials/signup/signup-form.html',
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

// signup form control
.controller('userModalCtrl', ['$scope', 'UserManager', '$modalInstance', 'data',
	function($scope, UserManager, $modalInstance, data) {
		
		$scope.data = data;
		
		$scope.userData = {
			password: '',
			email: '',
			name: '',
			address: '',
			user_type: {
				name 	: $scope.data, 
				canBuy	: true, 
				canSell	: false
			}
		};
		
		$scope.nextRoute = ($scope.data === "Producer") ? "/apply" : "/welcome";
		console.log($scope.nextRoute);
		
		$scope.submitForm = function(isValid) {
			if (isValid) {
				UserManager.createUser($scope.userData).then(function() {
					$modalInstance.close($scope.nextRoute);
				}, function(error) {
					$scope.message = error;
				});
			} else $scope.submitted = true;
		};
		
		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}
])
// used on the sign up page for address finding.
.controller('geoCtrl', ['$scope',
	function($scope) {
		$scope.addressOptions = {
			country: 'nz',
		};
		$scope.details = {};
	}
])

.controller('producerApplicationCtrl', ['$scope', 'flash','certifications', '$http', "$location",
	function ($scope, flash, certifications, $http, $location) {
		certifications.getList().then(function(result) {
			$scope.certifications = result;
			$scope.producerApplication = {
				certification : $scope.certifications[0].name, // none
			};
		});
		
		$scope.submitForm = function(form) {
			$http.post('/api/producer-applicaiton', $scope.producerApplication).success(function(result) {
				flash.setMessage({type: 'success', message: 'Thank you for your application. We\'ll be in touch shortly.'});
				$location.path("welcome");
			}).error(function(error) {
				flash.setMessage({type: 'danger', message: "Error: " + (error.status || "") + " " + (error.message || error)});
			});
		};
	}
])

.controller('viewMeatOrderCtrl', function($scope, $rootScope, order, $location) {
	$scope.order = order.data;
	
	if (order.data.customer.id !== $rootScope.currentUser._id) $location.path('/');
	
})
.controller('MeatOrderManagerCtrl', function($scope, $rootScope, order, $location, flash) {
	$scope.order = order;
	
	$scope.flash = function(type, message) {
		flash.setMessage({type: type, message: message});
	};
	
	if (order.supplier !== $rootScope.currentUser._id) $location.path('/');
	
})
.controller('MeatOrderListCtrl', function($scope, $http, $location) {
	$http.get('/api/meat-order').success(function(result) {
		$scope.meatOrders = result;
		$scope.total = total(result);
	});
	
	function total(orders) {
		var amount, invoiced = _.filter(orders, 'invoiced');
		amount = _.reduce(invoiced, function(t, n) {
			return t + n.total;
		}, 0);
		return amount;
	}
	
})

;