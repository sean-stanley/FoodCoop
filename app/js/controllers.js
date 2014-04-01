'use strict';

/* Controllers */

angular.module('co-op.controllers', []).
  controller('MyCtrl1', [function() {

  }])
  .controller('MyCtrl2', [function() {

  }])
  .controller('navCtrl', ['$scope', '$location', 'LoginManager', 'CartRecords', function($scope, $location, LoginManager, CartRecords) {
	$scope.loginManager = LoginManager; 
	$scope.isActive = function(route) {
		return route === $location.path();
	} 
	
	$scope.items = CartRecords.getCart().length;
	
  }])
  
  .controller('logoutCtrl', ['$scope', '$location', 'LoginManager', function($scope, $location, LoginManager) {
	$scope.loginManager = LoginManager;
	
	$scope.logOut = function () {
		$scope.loginManager.loginChange(false);
		$location.path('/home');
	}
	
	$scope.logIn = function () {
		$scope.loginManager.loginChange(true);
		$location.path('/home');
	}
	
  }])
  
  .controller('loginCtrl', ['$scope', '$location', 'LoginManager', function($scope, $location, LoginManager) {
	  $scope.showLogin = false;
	
	$scope.loginManager = LoginManager;
	
	$scope.loginData = {
		email: '',
		password: ''
	};
	
	$scope.submitForm = function () {
        $scope.loginManager.loginAttempt($scope.loginData);
        $scope.loginManager.logIn();
        console.log($scope.loginManager.loggedIn);
        $location.path('/home');
    } 
  }])
  .controller('resetPwdCtrl', ['$scope', 'PwdResetManager', function($scope, PwdResetManager) {
	
	$scope.resetData = {
		email: '',
		dob: '',
		securityQuestion: '',
		securityAnswer: '',
		loginTries: $scope.loginAttemts,
	};
	$scope.submitForm = function () {
        PwdResetManager.pwdReset($scope.resetData);
    }
	
  }])
  
  .controller('userAdminCtrl', ['$scope', 'UserManager', function($scope, UserManager) {
	
	$scope.userLibrary = UserManager.getUserLibrary();
	$scope.predicate = 'dateJoined';
	
  }])
  
  .controller('userEditingCtrl', ['$scope', 'UserManager', function($scope, UserManager) {
		
	$scope.$watch('user', function(newValue, oldValue) {
		UserManager.updateUser(newValue);
		console.log('user changer: ', newValue); //calls the server to make the change for this user
	}, true);
		
  }])    
  
  .controller('userCtrl', ['$scope', 'UserManager', 'LocationService', 'LoginManager', '$location', function($scope, UserManager, LocationService, LoginManager, $location) {
	  LocationService.getLocations(function(result){$scope.cities = result;
		$scope.userData.city = $scope.cities[21]; // Whangarei is default	
		$scope.mileage = $scope.userData.city.distance * 0.67; //find cost in dollars of return trip to whangarei for producers.
	  });
		$scope.userData = {
		  password: '',
		  email: '',
		  name: '',
		  address: '',
		  
		  securityQ: '',
		  securityA: '',
		  
		  user_type: UserManager.userTypes[0],  
		};

	  $scope.$watch('wantsToBeProducer', function(newValue) {
		  if ($scope.wantsToBeProducer) {
			$scope.userData.user_type = UserManager.userTypes[2];
		  } else {
			$scope.userData.user_type = UserManager.userTypes[0];
		  }
	  });
	  	  
	  

	  $scope.submitForm = function () {
        UserManager.registerUser($scope.userData);
        LoginManager.loginChange(true);
        if ($scope.userData.user_type === UserManager.userTypes[2]) {
	        $location.path('/producer-profile');
        }
        else {
	        $location.path('/home');;
        }
        
    }
  }])
  
  .controller('geoCtrl', ['$scope', function ($scope) {

      $scope.addressOptions = {
		  country: 'nz',
      };
      $scope.details = '';
	  
  }])
  
  .controller('producerListCtrl', ['$scope', '$modal', 'ProducerList', function($scope, $modal, ProducerList) {
	  ProducerList.getData(function(result){$scope.data = result;});

	  
	  $scope.predicate = 'dateJoined';
	  
	  $scope.max = 5;
	  $scope.isReadonly = true;
	  
	  $scope.open = function (producer) {

	    var modalInstance = $modal.open({
	      templateUrl: 'partials/producer-modal.html',
	      controller: 'modalInstanceCtrl',
	      resolve: {
			  data: function () {
				  return producer;
        }
      }
	      }
	    );
	
	    modalInstance.result.then(function (selectedItem) {
	      $scope.selected = selectedItem;
	    }, function () {
	      console.log('Modal dismissed at: ' + new Date());
	    });
	  }
  
  }])
    
  .controller ('modalInstanceCtrl', ['$scope', '$modalInstance', 'data', function($scope, $modalInstance, data) {
	
	  $scope.data = data;
	  
	  $scope.cancel = function () {
	    $modalInstance.dismiss('cancel');
	  };
  }])
  
  .controller('productUpload', ['$scope', 'ProductManager', 'ProductHistory', function($scope, ProductManager, ProductHistory) {	  
//	  $scope.theImage = ''; //sets empty variable to be populated if user uses the input[type=file] method to upload an image
	  
	  ProductHistory.getData(function(result){$scope.data = result});
	   
	  $scope.predicate = 'dateUploaded';
	   
		$scope.delete = function(idx) {
			var itemToDelete = $scope.data[idx];
			$scope.data.splice(idx, 1);
		}
		
		$scope.editProduct = function(product) {
			$scope.productData = product;
			console.log($scope.productData)
			// pass product to productUpload controller $scope.productData
		};
	  
	  $scope.ingredients = false; //show or hide ingredients field
	  
	  $scope.$watch('productData.category', function(newValue, oldValue) {
		if (newValue){
			$scope.availableUnits = newValue.availableUnits;
			$scope.ingredients = newValue.ingredients;
		}
	  });
	  $scope.productData = {};
	  ProductManager.productCategories(function(results){
		$scope.categories = results;
		$scope.category = results[0];	// set produce to default
		$scope.productData.dateUploaded = Date();
		$scope.productData.category = $scope.category.name;
	  
		$scope.submitForm = function(){
			ProductManager.registerProduct($scope.productData);
		}})
	  
	  ProductManager.certificationTypes(function(results){
		$scope.certifications = results;
		$scope.productData.certification = results[0].name;
	  });
	  
	  //$scope.setImage = function(element) {
      //  $scope.$apply(function($scope) {
     //       $scope.theImage = element.files[0];
  //      });
//    };
	  

    }
	 
  ])
  
  .controller('producerCtrl', ['$scope', 'ProducerManager', function($scope, ProducerManager) {
	   
	   $scope.producerData = {
		  image: '',
		  logo: '',
		  companyName: '',
		  description: '',
	  };
	   
	   $scope.submitForm = function () {
        ProducerManager.setProducer($scope.producerData);
        $location.path('/product-upload');
    }
	   
  }])
   
  .controller('orderTableCtrl', ['$scope', '$filter', 'OrderRecords', function($scope, $filter, OrderRecords) {
	  $scope.orders = OrderRecords.getOrders();
	  
	  $scope.predicate = 'product';
	  
	  $scope.total = OrderRecords.sumSales();
	    
  }])
  
  .controller('cartTableCtrl', ['$scope', '$filter', 'CartRecords', function($scope, $filter, CartRecords) {
	  $scope.cart = CartRecords.getCart();
	  
	  $scope.total = CartRecords.sumPrice();
		  	  
	  $scope.delete = function(idx) {
		  var itemToDelete = $scope.cart[idx];
		  $scope.cart.splice(idx, 1);
		  $scope.total = CartRecords.sumPrice();
	  }
	  
	  
	//  API.DeleteItem({ id: itemToDelete.id}, function (success) {
	//	  $scope.cart.splice(idx, 1);
	//  })
	  	  
  }])
  
  .controller('contactCtrl', ['$scope', 'MailManager', function($scope, MailManager) {
	   
	   $scope.mail = {
		   name : '',
		   email : '',
		   subject : '',
		   message : '',
	};
	   
	   $scope.submitForm = function () {
       MailManager.sendMail($scope.mail);
    }

	   
  }])
  
  .controller('calendarCtrl', ['$scope', function($scope) {
      /* config object */
      $scope.uiConfig = {
        calendar:{
          height: 450,
          editable: false,
          header:{
            left: 'month basicWeek basicDay agendaWeek agendaDay',
            center: 'title',
            right: 'today prev,next'
          },
          dayClick: $scope.alertEventOnClick,
          eventDrop: $scope.alertOnDrop,
          eventResize: $scope.alertOnResize
        }
      };
  }]);