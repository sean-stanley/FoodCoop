'use strict';

/* Controllers */

angular.module('co-op.controllers', []).
  controller('MyCtrl1', [function() {

  }])
  .controller('MyCtrl2', [function() {

  }])
  .controller('navCtrl', function($scope, $location) {
	$scope.isActive = function(route) {
		return route === $location.path();
	}  
  })
  .controller('userCtrl', ['$scope', 'UserManager', function($scope, UserManager) {
	  
	  $scope.userTypes = [
	  {name:'Guest', buy:false, sell:false },
	  {name:'Customer', buy:true, sell:false},
	  {name:'Producer', buy:true, sell:true},
	  ];
	  
	  $scope.cities = [
	  		{name:'Ahipara', value:'ahipara', fromWhangarei:'north', distance:'166', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m1!1sWhangarei%2C+Northland!1m5!1sAhipara!2s0x6d090e62e90609c9%3A0x500ef6143a2b140!3m2!3d-35.1713389!4d173.1532718!3m8!1m3!1d95823!2d173.1526512!3d-35.155162!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{name:'Awanui', value:'awanui', fromWhangarei:'north', distance:'161', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sAwanui%2C+Northland!3m8!1m3!1d381963!2d173.7388877!3d-35.4362299!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{name:'Dargaville', value:'dargaville', fromWhangarei:'west', distance:'57.5', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sDargaville%2C+Northland!3m8!1m3!1d382129!2d173.7903178!3d-35.4011621!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{name:'East Opua', value:'east-opua', fromWhangarei:'north', distance:'64.75', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sEast+Opua!3m8!1m3!1d190036!2d174.0964453!3d-35.8327467!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{name:'Haruru Fall', value:'haruru-falls', fromWhangarei:'north', distance:'74.4', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sHaruru+Fall!3m8!1m3!1d381570!2d174.197306!3d-35.5190714!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{name:'Kaeo', value:'kaeo', fromWhangarei:'north', distance:'109', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sKaeo%2C+Northland!3m8!1m3!1d381654!2d174.1886613!3d-35.5012849!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{name:'Kaikohe', value:'kaikohe', fromWhangarei:'north', distance:'85.3', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sKaikohe%2C+Northland!3m8!1m3!1d382003!2d174.0523914!3d-35.4277197!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{name:'Kaiwaka', value:'kaiwaka', fromWhangarei:'south', distance:'61.7', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sKaiwaka%2C+Northland!3m8!1m3!1d381423!2d174.0638477!3d-35.5498361!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{name:'Kerikeri', value:'kerikeri', fromWhangarei:'north', distance:'84.7', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sKerikeri%2C+Northland!3m8!1m3!1d379543!2d174.3737628!3d-35.9431781!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{name:'Maungatapere', value:'maungatapere', fromWhangarei:'west', distance:'12.3', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sMaungatapere%2C+Northland!3m8!1m3!1d381770!2d174.1281364!3d-35.4768735!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{name:'Maungaturoto', value:'maungaturoto', fromWhangarei:'south', distance:'61.1', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sMaungaturoto%2C+Northland!3m8!1m3!1d47565!2d174.2657696!3d-35.7400534!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{name:'Mangawhai Heads', value:'mangawhai-heads', fromWhangarei:'south', distance:'72.1', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sMangawhai+Heads%2C+Northland!3m8!1m3!1d379667!2d174.3737628!3d-35.9173831!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{name:'Moerewa', value:'moerewa', fromWhangarei:'north', distance:'60.1', maps:'https://www.google.co.nz/maps/preview#!data=!1m4!1m3!1d199101!2d174.1691864!3d-35.5484707!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sMoerewa!3m8!1m3!1d379583!2d174.4330177!3d-35.934878!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{name:'Ngunguru', value:'ngunguru', fromWhangarei:'east', distance:'25.8', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sNgunguru%2C+Northland!3m8!1m3!1d199101!2d174.1691864!3d-35.5484707!3m2!1i1298!2i736!4f13.1&fid=0'},
	  		{name:'Ohaewai', value:'ohaewai', fromWhangarei:'north', distance:'74.9', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sOhaewai!3m8!1m3!1d49696!2d174.413405!3d-35.6765609!3m2!1i1298!2i736!4f13.1&fid=0'},	  
	  		{name:'Omapere and Opononi', value:'omapere-and-opononi', fromWhangarei:'north', distance:'139', maps:'https://www.google.co.nz/maps/preview#!data=!1m4!1m3!1d397705!2d173.8538075!3d-35.6483895!4m23!3m22!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m5!1sOmapere+Services+Station%2C+State+Highway+12%2C+Omapere+0473!2s0x6d094511e45efe2b%3A0xad62d9ae39e27d2a!3m2!3d-35.534865!4d173.387571!3m8!1m3!1d397705!2d173.8538075!3d-35.6483895!3m2!1i1298!2i736!4f13.1!4i1&fid=0'},	 
	  		{name:'Paihia', value:'paihia', fromWhangarei:'north', distance:'70', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1spaihia!3m8!1m3!1d397705!2d173.8538075!3d-35.6483895!3m2!1i1298!2i736!4f13.1&fid=0'},	 
	  		{name:'Rawene', value:'rawene', fromWhangarei:'north', distance:'126', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1srawene!3m8!1m3!1d398428!2d174.197306!3d-35.5029025!3m2!1i1298!2i736!4f13.1&fid=0'},	 
	  		{name:'Te Kopuru', value:'te-kopuru', fromWhangarei:'west', distance:'69.1', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sTe+Kopuru!3m8!1m3!1d398994!2d173.8224861!3d-35.3886194!3m2!1i1298!2i736!4f13.1&fid=0'},	 
	  		{name:'Waipu', value:'waipu', fromWhangarei:'south', distance:'39.3', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sWaipu%2C+Northland!3m8!1m3!1d198375!2d174.0945862!3d-35.8397148!3m2!1i1298!2i736!4f13.1&fid=0'},	 
	  		{name:'Wellsford', value:'wellsford', fromWhangarei:'south', distance:'81.1', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sWellsford%2C+Auckland!3m8!1m3!1d198337!2d174.3737628!3d-35.854934!3m2!1i1298!2i736!4f13.1&fid=0'},	 
	  		{name:'Whangarei', value:'whangarei', fromWhangarei:'south', distance:'0', maps:'https://www.google.co.nz/maps/preview#!q=Whangarei%2C+Northland&data=!1m4!1m3!1d99347!2d174.2877818!3d-35.7118146!4m10!1m9!4m8!1m3!1d103667!2d174.2877818!3d-35.7118146!3m2!1i1024!2i768!4f13.1'},	 
	  ];
	  
	  $scope.userData = {
		  pw: '',
		  email: '',
		  fullName: '',
		  address: '',
		  type: $scope.userTypes[0],
		  city: $scope.cities[21] // Whangarei is default
	  };
	  
	  $scope.$watch('wantsToBeProducer', function(newValue) {
		  if ($scope.wantsToBeProducer) {
			  $scope.userData.type = $scope.userTypes[2]
		  } else {
			$scope.userData.type = $scope.userTypes[0];
		  }
	  });
	  	  
	  $scope.mileage = $scope.userData.city.distance * 0.67 * 2; //find cost in dollars of return trip to whangarei for producers.

	  $scope.submitForm = function () {
        UserManager.registerUser($scope.userData);
    }
  }])
  
  .controller('Login', ['$scope', function($scope) {
	  $scope.showLogin = false;
  }])
  
  .controller('product-upload', ['$scope', 'ProductManager', function($scope, ProductManager) {	  
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