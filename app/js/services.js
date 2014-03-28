'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('co-op.services', [])
	.factory('LoginManager', ['$http', function($http) {
		var module = {
			loginAttempt : function(loginData) {
				console.log('Login Data', loginData);
				module.loginChange(true);
			},			
			IsLoggedIn : function() {
	            return module.loggedIn;
	            console.log(module.loggedIn);
	        },
			
			loginChange : function(newValue) {
				module.loggedIn = newValue;
				return module.loggedIn;
				console.log(module.loggedIn);

			},
			
			logIn : function() {
				module.loginChange(true);
				return module.loggedIn;
				console.log(module.loggedIn);
				
			},
			
			logOut : function() {
				module.loginChange(false);
				return module.loggedIn;
				console.log(module.loggedIn);
			},
			
			loggedIn : false
		};
		
		return module;
	}])
	
	.factory('PwdResetManager', ['$http', function($http) {
		return {
			pwdReset : function(resetData) {
				console.log('Reset Data', resetData);
			}			
		};
	}])

	.factory('UserManager', ['$http', function($http) {
		return {
			getUserLibrary : function() {
	            return module.userLibrary;
	            console.log(module.userLibrary);
	        },
			
			registerUser : function(userData) {
				$http.post("api/user", userData);
			},
			userTypes : [
				{name : "Guest", canBuy:false, canSell:false },
				{name : "Customer", canBuy:true, canSell:false },
				{name : "Producer", canBuy:true, canSell:true },
			],
	  
	  		userLibrary : [
	  		
	  		]		
		};
	}])
	
	.factory('ProductManager', ['$http', function($http) {
		return {
			registerProduct : function(productData) {
				$http.post("api/product", productData);
			},
			
			productCategories : function(callback){
				$http.get("api/category").success(callback);
			},
			certificationTypes: function(callback){
				$http.get("api/certification").success(callback);
			}

		}	
	}])
	
	.factory('ProducerManager', ['$http', function($http) {
		return {
			setProducer : function(producerData) {
				console.log('Producer Data Object', producerData);
			},
		}	
	}])
	
	.factory('MailManager', ['$http', function($http) {
		return {
			mail : function(mail) {
				console.log('email message', mail);
			}
		}	
	}])
	.service('OrderRecords', ['$http', function($http) {
		
		this.getOrders = function() {
			return orders;
		}
		
		this.addOrder = function(orderData) {
			orders.push(orderData)
		}
		
		this.sumSales = function() {
		 var total = 0;
		 for(var i=0; i < orders.length; i++) {
		 	console.log(i, ' order items = ', orders[i].price)
		 	total += orders[i].price; 
		 }
		 return total;
	  }

		
		var orders = [
			{product: 'Granny Smith Apples', quantity: 30, price: 2*30, customer: 'Sean Stanley'},
            {product: 'Spray-Free Oranges', quantity: 12, price: 2.5*12, customer: 'Matt Stanley'},
            {product: 'Romaine Lettuce', quantity: 27, price: 4*27, customer: 'Myles Green'},
            {product: 'Organic Basil', quantity: 7, price: 1.5*7, customer: 'Rowan Clements'},
            {product: 'Dozen Eggs', quantity: 4, price: 8*4, customer: 'Lisa Taylor'}
		];
	}])
	.service('CartRecords', ['$http', function($http) {
		
		this.getCart = function() {
			return cartItems;
		}
		
		this.addItem = function(productData) {
			cartItems.push(productData);
		}
		
		this.removeItem = function(i) {
			cartItems.splice(i, 1);
		}
		
		this.sumPrice = function() {
		 var total = 0;
		 for(var i=0; i < cartItems.length; i++) {
		 	console.log(i, ' cart items = ', cartItems[i].price)
		 	total += cartItems[i].price; 
		 }
		 return total;
	  }

		
		var cartItems = [
			{product: 'Organic Blue-Veined Cheese', quantity: 1, price: 10, producer: 'Hiki Dairy Farm'},
            {product: 'Spray-Free Oranges', quantity: 2, price: 2.5*2, producer: 'Northland Naturals'},
            {product: 'Romaine Lettuce', quantity: 6, price: 4*6, producer: 'EcoBikes'},
            {product: 'Rosemary bunches', quantity: 4, price: 1*4, producer: 'Rowan Clements'},
            {product: 'Loafs of Gluten Free Bread', quantity: 3, price: 3.2*4, producer: 'Lisa Taylor'},
            {product: 'Organic Garlic and Basil Sausages', quantity: 2, price: 8.50*2, producer: 'Lisa Taylor'}
		];
	}])
	
	.factory('ProductHistory', ['$http', function($http) {
		var module = {
						
			getData : function(callback) {
				this.products = $http.get("/api/product").success(callback);
	        },
			addProduct : function(newData) {
				module.data.push(newData);
				return module.data;
				console.log(module.data);
			}
		}
		return module;
	}])
	
	.factory('ProducerList', ['$http', function($http) {
		var module = {
						
			getData : function(callback) {
	            $http.get("/api/user?user_type=Producer").success(callback);
	        },
			
			addProducer : function(newData) {
				module.data.push(newData);
				return module.data;

			},
			
		};
		
		return module;
	}])

	
	.service('LocationService',  ['$http', function($http) {
		
        this.getLocations = function(callback) {
			$http.get("/api/location").success(callback);
	    },

        this.addLocation = function(locationData) {
            data.push(locationData);
			$http.post("/api/location", locationData);
        }
		

    }]);
