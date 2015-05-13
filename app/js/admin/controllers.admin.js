'use strict';
/*global angular, _, Date, oboe*/

/* Controllers */

angular.module('co-op.admin')
	
.controller('userAdminCtrl', ['$scope', 'users',
	function($scope, users) {
		$scope.userLibrary = users.getList().$object;
	}
])

.controller('transactionController', ['$scope', '$http', function($scope, $http) {
	// inherits user from parent scope adminUserEditCtrl
	
	$scope.submitted = false;
	
	$scope.transaction = {
		account: $scope.user._id,
		amount: 0,
		options: {}
	};
	
	$scope.createTransaction = function(valid) {
		if (valid) {
			$http.post('/api/user/' + $scope.user._id + '/transaction', $scope.transaction).success(function(result) {
				console.log(result);
				$scope.transaction.options = {};
				$scope.transaction.amount = 0;
			}).error(function(err) {console.log(err);});
		} else $scope.submitted = true;
	};
}])

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

.controller('invoiceCtrl', ['$scope', '$rootScope', 'Restangular', 'flash', '$http',
	function($scope, $rootScope, Restangular, flash, $http) {
		$scope.now = Date();
		
		$scope.soon = function(invoice) {
			if (invoice.status === 'un-paid') {
				if ( Date.parse(invoice.dueDate).between( Date.today(), Date.today().addWeeks(1) ) ) {
					return true;
					}
			}
			
			return false;
		};
		
		$scope.stats = {};

		
		function calculateStats(invoices) {
			$scope.stats.toCoop = _.sum(_.pluck(_.filter(invoices, {toCoop: true, status: 'PAID'}), 'total'));
			$scope.stats.toCustomers = _.sum(_.pluck(_.filter(invoices, {toCoop: false, status: 'PAID'}), 'total'));
			$scope.stats.revenue = $scope.stats.toCustomers - $scope.stats.toCoop;
		}
		
		
		// the array of invoices for use in the template
		Restangular.all('api/invoice').getList().then(function(invoices) {
			$scope.invoices = invoices;
			calculateStats($scope.invoices);
		});
		
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
			var certain = confirm('Are you sure you want to delete invoice #' + invoice._id + "?");
			
			if (certain) {
				invoice.remove({id:invoice._id}).then(function(result){
					flash.setMessage({type:'success', message: "invoice successfully removed: "+ result || 'Great!'});
				},
				function(error) {
					flash.setMessage({
						message: "Sorry! Failed to delete the invoice " + error ,
						type: "danger"
					});
				});
			
				$scope.invoices.splice($scope.invoices.indexOf(invoice), 1);
			}
		};
		
		$scope.email = function(invoice) {
			$http.post('/api/invoice/email', invoice).success(function(result) {
				flash.setMessage({type:'success', message: "email successfully sent: "+ result || 'Great!'});
			});
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
.controller('adminCalendarCtrl', ['$scope', function ($scope) {
	$scope.format = 'EEEE MMMM dd yyyy Z';
	
	$scope.open = function($event) {
		$event.preventDefault();
		$event.stopPropagation();
		$scope.opened = true;
	};
}])
// admin cycle control
.controller('cycleCtrl', ['$scope', 'Restangular', '$http', 'flash', 'Calendar',
	function($scope, Restangular, $http, flash, Calendar){
		
		$http.get('/api/admin/cycle').success(function(cycles) {
			$scope.cycles = cycles;
		});
				
		$scope.$on('CALENDAR-LOADED', function() {
			$scope.currentCycle = Calendar.cycle;
		});
		
		$scope.cycleToEdit = {};
		
		$scope.edit = function(index) {
			$scope.cycleToEdit = $scope.cycles[index];
		};
		
		$scope.save = function(cycle) {
			$http.post('/api/admin/cycle/', cycle).success(function(cycle) {
				console.log(cycle);
				flash.setMessage({type: 'success', message: 'Yay! Cycle '+ cycle._id + ' was created'});
			}).error(function(err) {
				console.log(err);
				flash.setMessage({type: 'danger', message: 'Drat! Something went wrong: '+ err.data || err});
			});
		};
		
		$scope.update = function(cycle) {
			$http.put('/api/admin/cycle/' + cycle._id, cycle).success(function(cycle) {
				flash.setMessage({type: 'success', message: 'Yay! Cycle '+ cycle._id + ' was updated'});
				console.log(cycle);
			}).error(function(err) {
				console.log(err);
				flash.setMessage({type: 'danger', message: 'Drat! Something went wrong: '+ err.data || err});
			});
		};
		
		$scope.invoice = function() {
			$http.post('api/admin/send-invoices', {}).success(function() {
				flash.setMessage({type: 'success', message:'sending invoices manually'});
			}).error(function(error) {
				flash.setMessage({type: 'danger', message: 'Oh no! Something went wrong!'});
				console.log(error);
			});
		};
		
	}])

.controller('routeAdminCtrl', ['$scope', 'UserManager', function($scope, UserManager) {
	$scope.ruralUsers = UserManager.users.all('route').getList().$object;
}])

.controller('orderAdminCtrl', ['$scope', '$rootScope', 'orders', function($scope, $rootScope, orders) {
	
	$scope.cycle = $rootScope.cycle || 15;
	
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
		var total = 0;
		
		if (_.isArray(orders)) {
			for (var i=0; i < orders.length; i++) {
				total += Number(orders[i][property]);
			}
			return total;
		}
	};
	
	$scope.$watch('search', function() {
		$scope.total($scope.orders);
	});
}])
.controller('productAdminCtrl', ['$scope', '$http', '$modal', '$window', 'categories', function($scope, $http, $modal, $window, categories) {
	$scope.categories = categories.data;
	// possible properties are:
	//    cycle (number or gt, lt value)
	//    producer_ID
	//    category
	//    certification
	//    productName
	//    variety
	//    price (number or gt, lt value)
	$scope.params = {};
	
	$scope.get = function() {
		$http.get('/api/product', {
			params: $scope.params
		}).then(function(result) { 
			$scope.products = result.data;
		}, function(error) {console.log(error);});
	};
	
	$scope.open = function(product) {
		var modalInstance = $modal.open({
			templateUrl: 'partials/store/catalogue-modal.html',
			controller: 'modalInstanceCtrl',
			size: 'lg',
			resolve: {
				data: function() {
					return product;
				}
			}
		});
		modalInstance.result.then(function(product) {
			console.log('Modal Closed');
		}, function() {
			console.log('Modal dismissed at: ' + new Date());
		});
	};
	
	$scope.$watch('products', function(n) {
		makeCsv(n);
	});
	
	function makeCsv(array) {
		var A = [];
		A.push(['Product Name', 'Producer', 'Amount Available', 'Price']); // add permanent link to product as well?
		if(angular.isArray(array)) {
			angular.forEach(array, function(product) {
				var producer = product.producer_ID.hasOwnProperty('producerData') ? product.producer_ID.producerData.companyName || product.producer_ID.name : product.producer_ID.name;
				A.push([product.fullName, producer, product.quantity - product.amountSold, '$' + product.priceWithMarkup.toFixed(2) + ' / ' +  product.units]);
			});
		}
		var csvRows = [];

		for(var i=0, l=A.length; i<l; ++i){
			csvRows.push(A[i].join(','));
		}
		var csvString = csvRows.join("\r\n");
		
		$scope.csv = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csvString);
		//return 'data:application/csv;charset=utf-8,' + encodeURIComponent(csvString);
	}
	
	$scope.download = function(csvString) {
		
		if ($window.navigator.msSaveOrOpenBlob) {
		  var blob = new Blob([decodeURIComponent(encodeURI(csvString))], {
		    type: "text/csv;charset=utf-8;"
		  });
		  navigator.msSaveBlob(blob, 'products.csv');
		}
	};
	
}]);