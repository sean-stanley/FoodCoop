'use strict';

/* Controllers */

angular.module('co-op.controllers', []).
  controller('MyCtrl1', [function() {

  }])
  .controller('MyCtrl2', [function() {

  }])
  .controller('userCtrl', ['$scope', function($scope) {
	  $scope.userType = [
	  {text:'', buy:false, sell:false },
	  {text:'Customer', buy:true, sell:false},
	  {text:'Producer', buy:true, sell:true}]
  }])
  .controller('Login', ['$scope', function($scope) {
	  $scope.showLogin = false;
  }])
  .controller('product-upload', ['$scope', function($scope) {
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
		  $scope.units = $scope.availableUnits[0];
	  });
	 
  }]);