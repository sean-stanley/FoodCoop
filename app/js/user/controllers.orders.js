'use strict';
/*global angular, _, Date, oboe*/

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
]);