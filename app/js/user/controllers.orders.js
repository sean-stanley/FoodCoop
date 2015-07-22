'use strict';
/*global angular, _, Date, moment*/

/* Controllers */

angular.module('co-op.orders', [])
.controller('butcheryFormCtrl', ['$scope', '$rootScope', '$http', 'beast', 'flash',
	function($scope, $rootScope, $http, beast, flash) {
		$scope.beast = beast.data;

		$scope.meatOrder = {
			unitPrice: $scope.beast.price,
			product: {
				id: $scope.beast._id,
				name: $scope.beast.productName,
			},
			customer: {
				id: $rootScope.currentUser._id,
				name: $rootScope.currentUser.name,
				email: $rootScope.currentUser.email
			},
			supplier: $scope.beast.producer_ID,
			instructions: {}
		};

		if ($scope.beast.fixedPrice) $scope.meatOrder.fixedPrice = $scope.beast.fixedPrice;

		$scope.order = function(valid) {
			if (valid) {
				$http.post('/api/meat-order', $scope.meatOrder).then(function() {
					$scope.success=true;
				}, function(error) {
					flash.setMessage({type: 'danger', message: 'error: ' + error.data});
				});
			} else $scope.submitted = true;
		};
	}
]).controller('MilkFormCtrl', ['$scope', '$rootScope', '$http', 'milk', 'flash', '$modalInstance',
	function($scope, $rootScope, $http, milk, flash, $modalInstance) {
		$scope.milk = milk;

		$scope.weeks = [];

		var n = moment($rootScope.nextDeliveryDay).diff($rootScope.deliveryDay, 'weeks');

		for (var i = 0; i < n; i++) {
			var deliveryDay = moment($rootScope.deliveryDay).add(i, 'w').format();
			$scope.weeks.push({
				product: $scope.milk._id,
				customer: $rootScope.currentUser._id,
				supplier: $scope.milk.producer_ID._id,
				deliveryDay: deliveryDay,
				milk: true
			});
		}

		$scope.order = function(valid) {
			if (valid) {
				$modalInstance.close($scope.weeks);
			} else $scope.submitted = true;
		};
	}
]);
