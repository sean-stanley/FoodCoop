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
		pwd: ''
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
	  $scope.cities = LocationService.getLocations();
	  
	  $scope.userData = {
		  pw: '',
		  email: '',
		  fullName: '',
		  address: '',
		  
		  securityQ: '',
		  securityA: '',
		  
		  type: UserManager.userTypes[0],
		  city: $scope.cities[21],  // Whangarei is default		  
	  };
	  
	  $scope.$watch('wantsToBeProducer', function(newValue) {
		  if ($scope.wantsToBeProducer) {
			  $scope.userData.type = UserManager.userTypes[2]
		  } else {
			$scope.userData.type = UserManager.userTypes[0];
		  }
	  });
	  	  
	  $scope.mileage = $scope.userData.city.distance * 0.67; //find cost in dollars of return trip to whangarei for producers.

	  $scope.submitForm = function () {
        UserManager.registerUser($scope.userData);
        LoginManager.loginChange(true);
        if ($scope.userData.type.name === 'Producer') {
	        $location.path('/producer-profile');
        }
        else {
	        $location.path('/home');;
        }
        
    }
  }])
  
  .controller('producerListCtrl', ['$scope', '$modal', 'ProducerList', function($scope, $modal, ProducerList) {
	  $scope.data = ProducerList.getData();
	  console.log($scope.data);
	  
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
	  
	  $scope.data = ProductHistory.getData();
	   
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
	  
	  $scope.categories = ProductManager.productCategories;
	  $scope.category = ProductManager.productCategories[0]; // set produce to default
	  $scope.ingredients = false; //show or hide ingredients field
	  
	  $scope.$watch('productData.category', function(newValue, oldValue) {
		  switch (newValue) {
			  case 'Meat':
			  	$scope.availableUnits = [
			  		'kg',
			  		'unit',
			  		'quarter beast',
			  		'half beast',
			  		'whole beast',
			  		'live animal'
			  	];
			  	$scope.ingredients = true; 
			  	break;
			  case 'Produce':
			  	$scope.availableUnits = [
			  		'kg',
			  		'5 kg',
			  		'10 kg' 
			  	];
			  	$scope.ingredients = false;
			  	break;
			  case 'Processed Food':
			  	$scope.availableUnits = [
			  		'g',
			  		'kg',
			  		'ml',
			  		'L',
			  		'unit',
			  		'case'
			  	];
			  	$scope.ingredients = true;
			  	break;
			  case 'Baked Goods':
			  	$scope.availableUnits = [
			  		'loaf',
			  		'bun',
			  		'unit',
			  		'dozen',
			  		'bakers dozen',
			  		'kg'
		
			  	];
			  	$scope.ingredients = true;
			  	break;
			  case 'Dairy':
			  	$scope.availableUnits = [
			  		'100 g',
			  		'kg',
			  		'unit',
			  		'100 ml',
			  		'L'
		
			  	];
			  	$scope.ingredients = true;
			  	break;
			  case 'Raw Milk':
			  	$scope.availableUnits = [
			  		'L/week for 4 weeks',	
			  	];
			  	$scope.ingredients = false;
			  	break;
		  }
	  });
	  
	  $scope.certifications = ProductManager.certificationTypes;
	  
	  //$scope.setImage = function(element) {
      //  $scope.$apply(function($scope) {
     //       $scope.theImage = element.files[0];
  //      });
//    };
	  
	  $scope.productData = {
		  dateUploaded: Date(),
		  category: $scope.category.name,
		  image: '',
		  productName: '',
		  variety: '',
		  price: '',
		  quantity: '',
		  units: '',
		  refrigeration: '',
		  ingredients: '',
		  description: '',
		  certification: $scope.certifications[0],
		  producerName: '',
		  producerCompany: '',
	  };
	  
	  $scope.submitForm = function () {
        ProductManager.registerProduct($scope.productData);
    }
	 
  }])
  
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
   
  .controller('orderTableCtrl', ['$scope', '$filter', 'ngTableParams', 'OrderRecords', function($scope, $filter, ngTableParams, OrderRecords) {
	  $scope.orders = OrderRecords.getOrders();
	  
	  $scope.predicate = 'product';
	  
	  $scope.total = OrderRecords.sumSales();
	    
  }])
  
  .controller('cartTableCtrl', ['$scope', '$filter', 'ngTableParams', 'CartRecords', function($scope, $filter, ngTableParams, CartRecords) {
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
	   
  }]);