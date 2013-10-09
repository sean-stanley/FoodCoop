angular.module('fcStore', ['ui.bootstrap'])
	.config(['$routeProvider', function($routeProvider) {
	    $routeProvider.when('/products/:type', {templateUrl: 'partials/products.html', controller: 'productDisplay'});
		$routeProvider.when('/producers/:id', {templateUrl: 'partials/producers.html', controller: 'producerDisplay'});
		$routeProvider.otherwise({redirectTo: '/products/all'});
	}])
    .
    controller('productDisplay', ['$scope', '$dialog', 'productService', function($scope, $dialog, productService) {
        $scope.products = productService.getProducts();

		$scope.getOrder = function() {
			var orderField = productService.getOrder();
			return orderField;
		}

  $scope.opts = {
    backdrop: true,
    keyboard: true,
    backdropClick: true,
    templateUrl:  'partials/dialog.html', // OR: templateUrl: 'path/to/view.html',
    controller: 'TestDialogController'
  };

  $scope.openDialog = function(){
  // take passed in var, send to service. Popup Dialog controller reads it in (next implementation step)
    var d = $dialog.dialog($scope.opts);
    d.open().then(function(result){
      if(result)
      {
        alert('dialog closed with result: ' + result);
      }
    });
  };
  
    }])
    
    .controller('productRefine', ['$scope', 'productService', function($scope, productService) {
		// Initialize values
        $scope.category = productService.getCategories(); //passed objects aren't immutable, we can set value directly in another $scope
		var categories = ['veg', 'meat', 'processed', 'baked', 'dairy'];
		$scope.orderField = productService.getOrder();
		
		$scope.sortingMethods = [
		{name:'title'},
		{name:'producer'}
		];
		
		$scope.sortingMethod = $scope.sortingMethods[0];
		
		$scope.$watch('sortingMethod.name', function(newValue) {
		  switch (newValue) {
			  case 'title':
			  $scope.sortingMethod = $scope.sortingMethods[0]; 
			  break;
			  
			  case 'producer':
			  $scope.sortingMethod = $scope.sortingMethods[1]; 
			  break;
		}
		});
		
		$scope.setOrder = function(orderField) {
			productService.setOrder(orderField);
		}
		
		$scope.setFilter = function(setCat) {
			for (var i=0; i<categories.length; i++) {
				var value = categories[i];
				if (categories[i] == setCat) {
					$scope.category[setCat] = true;
				} else {
					$scope.category[value] = false
				}
			}
		}
    }])
   
    .controller('DialogDemoCtrl', ['$scope', '$dialog', function ($scope, $dialog){

  // Inlined template for demo
  var t = '<div class="modal-header">'+
          '<h3>This is the title</h3>'+
          '</div>'+
          '<div class="modal-body">'+
          '<p>Enter a value to pass to <code>close</code> as the result: <input ng-model="result" /></p>'+
          '</div>'+
          '<div class="modal-footer">'+
          '<button ng-click="close(result)" class="btn btn-primary" >Close</button>'+
          '</div>';

  $scope.opts = {
    backdrop: true,
    keyboard: true,
    backdropClick: true,
    template:  t, // OR: templateUrl: 'path/to/view.html',
    controller: 'TestDialogController'
  };

  $scope.openDialog = function(){
    var d = $dialog.dialog($scope.opts);
    d.open().then(function(result){
      if(result)
      {
        alert('dialog closed with result: ' + result);
      }
    });
  };

  $scope.openMessageBox = function(){
    var title = 'This is a message box';
    var msg = 'This is the content of the message box';
    var btns = [{result:'cancel', label: 'Cancel'}, {result:'ok', label: 'OK', cssClass: 'btn-primary'}];

    $dialog.messageBox(title, msg, btns)
      .open()
      .then(function(result){
        alert('dialog closed with result: ' + result);
    });
  };
}])

// the dialog is injected in the specified controller
.controller('TestDialogController', ['$scope', 'dialog', function ($scope, dialog){
  $scope.close = function(result){
    dialog.close(result);
  };
}])
	.filter('categorise', ['productService', function(productService) {
		return function(products) {
			var returnArray = [];
			var categories = productService.getCategories();
			
			for (var i=0; i<products.length; i++) {
				cat = products[i].category;
				if (categories[cat]) {
					returnArray.push(products[i]);
				}
			}
			return returnArray;
		}
	}])
	.directive('popup', function() {
	    return {
	        // Restrict it to be an attribute in this case
	        restrict: 'A',
	        // responsible for registering DOM listeners as well as updating the DOM
	        link: function(scope, element, attrs) {
	            $(element).magnificPopup(scope.$eval(attrs.popup));
            }
        };
    })
    .service('productService', function() {
		this.getCategories = function() {
			return categories;
		}
		
        this.getProducts = function() {
            return data;
        }
            
        this.addProduct = function(productData) {
            data.push(productData);
        }
		this.setOrder = function(newValue) {
			orderField = newValue;
			console.log = "orderField";
		}
		
		this.getOrder = function() {
			return orderField;
		}
		
		var orderField = 'title';
		
		var categories = {"veg": true};
		
        var data = [
            {
                title: "Apples, Mixed",
                category: "veg",
                price: "2.50",
                unit: "kg",
                producer: "James",
                img: "apples.jpg"
            },
            {
                title: "Carrots",
                category: "veg",
                price: "3.50",
                unit: "kg",
                producer: "Steve Bob",
                img: "carrots.jpg"
            },
            {
                title: "Pumpkin, Crown",
                category: "veg",
                price: "3.50",
                unit: "each",
                producer: "James",
                img: "pumpkin.jpg"
            },
			{
                title: "Brownie",
                category: "baked",
                price: "3.50",
                unit: "piece",
                producer: "James",
                img: "brownie.jpg"
            },
            {
                title: "Lettuce, Romane",
                category: "veg",
                price: "3.00",
                unit: "each",
                producer: "George",
                img: "lettuce.jpg"
            },
            {
                title: "Beetroot",
                category: "veg",
                price: "5.50",
                unit: "kg",
                producer: "Peter",
                img: "beetroot.jpg"
            },
            {
                title: "Apples, Sundowner",
                category: "veg",
                price: "5.50",
                unit: "kg",
                producer: "Peter",
                img: "sundowner%20apple.jpg"
            },
            {
                title: "Tomatoes, Romanic",
                category: "veg",
                price: "6.50",
                unit: "kg",
                producer: "James",
                img: "tomatoes.jpg"
            },
			{
                title: "Pork Chops, Seasoned",
                category: "meat",
                price: "6.50",
                unit: "kg",
                producer: "James",
                img: "pork-chop.jpg"
            },
            {
                title: "Capsicum, Mixed",
                category: "veg",
                price: "2.00",
                unit: "bag",
                producer: "Peter",
                img: "capsicum.jpg"
            },
			{
                title: "Eggs, Medium Grade, Mixed",
                category: "dairy",
                price: "5.00",
                unit: "6",
                producer: "Peter",
                img: "eggs.jpg"
            },
            {
                title: "Peaches",
                category: "veg",
                price: "2.00",
                unit: "bag",
                producer: "Peter",
                img: "peach.jpeg"
            },
            {
                title: "Nectarine",
                category: "veg",
                price: "2.50",
                unit: "bag",
                producer: "Fred",
                img: "nectarine.jpeg"
            },
            {
                title: "Plums",
                category: "veg",
                price: "2.50",
                unit: "bag",
                producer: "Fred",
                img: "plum.jpeg"
            },
            {
                title: "Apricots",
                category: "veg",
                price: "2.50",
                unit: "bag",
                producer: "Fred",
                img: "apricot.jpeg"
            },
            {
                title: "Plums",
                category: "veg",
                price: "2.50",
                unit: "bag",
                producer: "Fred",
                img: "plum2.jpeg"
            },
            {
                title: "Peaches",
                category: "veg",
                price: "2.10",
                unit: "bag",
                producer: "Fred",
                img: "peach2.jpg"
            },
            {
                title: "Apples, Rose",
                category: "veg",
                price: "2.00",
                unit: "bag",
                producer: "Peter",
                img: "apples2.jpeg"
            },
            {
                title: "Kale",
                category: "veg",
                price: "3.00",
                unit: "bunch",
                producer: "James",
                img: "kale.jpg"
            },
            {
                title: "Carrots",
                category: "veg",
                price: "3.00",
                unit: "bunch",
                producer: "James",
                img: "carrot3(1).jpg"
            },
            {
                title: "Lettuce, Fancy",
                category: "veg",
                price: "3.00",
                unit: "each",
                producer: "George",
                img: "lettuce2.jpeg"
            },
            {
                title: "Apricots",
                category: "veg",
                price: "3.00",
                unit: "bag",
                producer: "George",
                img: "apricot2.jpeg"
            },
            {
                title: "Apricots",
                category: "veg",
                price: "2.00",
                unit: "bag",
                producer: "Jeff",
                img: "apricot3.jpeg"
            },
            {
                title: "Squash",
                category: "veg",
                price: "4.00",
                unit: "kg",
                producer: "Plymouth Farms",
                img: "squash.jpg"
            },
            {
                title: "Lettuce, Cos",
                category: "veg",
                price: "3.00",
                unit: "each",
                producer: "Plymouth Farms",
                img: "cos%20lettuce.jpeg"
            },
            {
                title: "Apricots",
                category: "veg",
                price: "3.00",
                unit: "bag",
                producer: "Plymouth Farms",
                img: "apricot4.jpeg"
            },
            {
                title: "Macadamia Nuts",
                category: "veg",
                price: "5.50",
                unit: "100g",
                producer: "Jim Bob",
                img: "nuts.jpg"
            },
            {
                title: "Apricots, Dried",
                category: "processed",
                price: "0.50",
                unit: "100g",
                producer: "Jim Bob",
                img: "i-apricots-dried.jpg"
            },
            {
                title: "Apricots, Canned",
                category: "processed",
                price: "2.00",
                unit: "jar",
                producer: "Jim Bob",
                img: "canned-apricots.jpg"
            },
            {
                title: "Lettuce, Variety Pack",
                category: "veg",
                price: "3.00",
                unit: "each",
                producer: "George",
                img: "variety%20lettuce.jpeg"
            },
            {
                title: "Spinach",
                category: "veg",
                price: "2.00",
                unit: "bunch",
                producer: "George",
                img: "spinach.jpg"
            },
            {
                title: "Spinach",
                category: "veg",
                price: "2.00",
                unit: "bunch",
                producer: "Steve",
                img: "spinach2.jpg"
            },
            {
                title: "Spinach",
                category: "veg",
                price: "1.00",
                unit: "100g",
                producer: "Jim Bob",
                img: "spinach3.jpg"
            },
            {
                title: "Pumpkin",
                category: "veg",
                price: "3.00",
                unit: "each",
                producer: "Jim Bob",
                img: "pumpkin2.jpeg"
            },
            {
                title: "Pumpkin",
                category: "veg",
                price: "2.00",
                unit: "each",
                producer: "Steve",
                img: "pumpkin3.jpeg"
            },
            {
                title: "Pumpkin, Miscellanous",
                category: "veg",
                price: "3.00",
                unit: "each",
                producer: "Plymouth Farms",
                img: "pumpkin4.jpeg"
            },
            {
                title: "Spinach",
                category: "veg",
                price: "1.50",
                unit: "bag",
                producer: "Jeff",
                img: "spinach4.jpg"
            },
            {
                title: "Bok Choy",
                category: "veg",
                price: "1.50",
                unit: "bunch",
                producer: "Asian First",
                img: "bok-choy.jpeg"
            },
            {
                title: "Bitter Melon",
                category: "veg",
                price: "3.50",
                unit: "each",
                producer: "Asian First",
                img: "melon.jpg"
            }];
    });
