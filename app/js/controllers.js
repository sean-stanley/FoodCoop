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
	}
	
	$scope.logIn = function () {
		$scope.loginManager.loginChange(true);
	}
	
  }])
  
  .controller('loginCtrl', ['$scope', 'LoginManager', function($scope, LoginManager) {
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
  
  .controller('userCtrl', ['$scope', 'UserManager', 'LocationService', function($scope, UserManager, LocationService) {
	  $scope.cities = LocationService.getLocations();
	  
	  $scope.userData = {
		  pw: '',
		  email: '',
		  fullName: '',
		  address: '',
		  
		  securityQ: '',
		  securityA: '',
		  
		  type: UserManager.userTypes[0],
		  city: $scope.cities[21] // Whangarei is default
	  };
	  
	  $scope.$watch('wantsToBeProducer', function(newValue) {
		  if ($scope.wantsToBeProducer) {
			  $scope.userData.type = UserManager.userTypes[2]
		  } else {
			$scope.userData.type = UserManager.userTypes[0];
		  }
	  });
	  	  
	  $scope.mileage = $scope.userData.city.distance * 0.67 * 2; //find cost in dollars of return trip to whangarei for producers.

	  $scope.submitForm = function () {
        UserManager.registerUser($scope.userData);
    }
  }])
  
  .controller('productUpload', ['$scope', 'ProductManager', function($scope, ProductManager) {	  
//	  $scope.theImage = ''; //sets empty variable to be populated if user uses the input[type=file] method to upload an image
	  
	  $scope.productCategories = [
	  		{name:'Produce', value:'produce', placeholderName:'apples', placeholderVariety:'Granny Smith'},
	  		{name:'Processed Food', value:'processedFood', placeholderName:'Jam', placeholderVariety:'Strawberry'},
	  		{name:'Baked Goods', value:'bakedGoods', placeholderName:'Bread', placeholderVariety:'Sourdough Rye'},
	  		{name:'Meat', value:'meat', placeholderName:'Lamb', placeholderVariety:'Half a small'},
	  		{name:'Dairy', value:'dairy', placeholderName:'Cheese', placeholderVariety:'Cottage'},	  
	  ];
	  
	  $scope.category = $scope.productCategories[0]; // produce
	  $scope.ingredients = false; //show or hide ingredients field
	  
	  $scope.$watch('category.name', function(newValue, oldValue) {
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
		  }
	  });
	  
	  $scope.certifications = [
	  {name:'Assure Quality', value: 'assure-quality', img: '<img src="../img/certification/assure-quality.png" alt="assure-quality" width="180" height="180" />'},
	  {name:'BioGro', value: 'biogro', img: '<img src="../img/certification/biogro.png" alt="biogro" width="117" height="126" />'},
	  {name:'Demeter Biodynamics', value: 'dem-organics', img: '<img src="../img/certification/demgreen.gif" alt="demgreen" width="336" height="435" />'},
	  {name:'Organic Farm NZ', value: 'organicfarmnz', img: '<img src="../img/certification/organicfarmnz.png" alt="organicfarmnz" width="88" height="81" />'},
	  {name:'In Transition', value: 'transition', img: ''},
	  {name:'None', value: 'none', img: ''}
	  ];
	  
	  //$scope.setImage = function(element) {
      //  $scope.$apply(function($scope) {
     //       $scope.theImage = element.files[0];
  //      });
//    };
	  
	  $scope.productData = {
		  image: '',
		  productName: '',
		  variety: '',
		  price: '',
		  quantity: '',
		  units: '',
		  refrigeration: '',
		  ingredients: '',
		  description: '',
		  certification: $scope.certifications[5],
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
        ProducerManager.registerProduct($scope.producerData);
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