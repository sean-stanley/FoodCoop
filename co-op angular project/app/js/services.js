'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('co-op.services', []).
	factory('UserManager', ['$http', function($http) {
		return {
			registerUser : function(userData) {
				console.log("User data", userData);
			}			
		};
	}])
	
	.factory('ProductManager', ['$http', function($http) {
		return {
			registerProduct : function(productData) {
				console.log("Product Data Object", productData);
			}
		}	
	}])
	
	.factory('ProducerManager', ['$http', function($http) {
		return {
			registerProducer : function(producerData) {
				console.log("Producer Data Object", producerData);
			}
		}	
	}])
	
	.factory('MailManager', ['$http', function($http) {
		return {
			mail : function(mail) {
				console.log("email message", mail);
			}
		}	
	}]);
