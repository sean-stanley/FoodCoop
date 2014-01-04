'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('co-op.services', []).
	factory('LoginManager', ['$http', function($http) {
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
			registerUser : function(userData) {
				console.log('User data', userData);
			},
			userTypes : [
	  {name:'Guest', buy:false, sell:false },
	  {name:'Customer', buy:true, sell:false},
	  {name:'Producer', buy:true, sell:true},
	  ]		
		};
	}])
	
	.factory('ProductManager', ['$http', function($http) {
		return {
			registerProduct : function(productData) {
				console.log('Product Data Object', productData);
			},
			
			productCategories : [
		  		{	
		  			name:'Produce', 
		  			value:'produce', 
		  			placeholderName:'apples', 
		  			placeholderVariety:'Granny Smith'
		  		},
		  		{
		  			name:'Processed Food', 
		  			value:'processedFood', 
		  			placeholderName:'Jam', 
		  			placeholderVariety:'Strawberry'
		  		},
		  		{
		  			name:'Baked Goods', 
		  			value:'bakedGoods', 
		  			placeholderName:'Bread', 
		  			placeholderVariety:'Sourdough Rye'
		  		},
		  		{
		  			name:'Meat', 
		  			value:'meat', 
		  			placeholderName:'Lamb', 
		  			placeholderVariety:'Half a small'
		  		},
		  		{
		  			name:'Dairy', 
		  			value:'dairy', 
		  			placeholderName:'Cheese', 
		  			placeholderVariety:'Cottage'
		  		},	
		  		{
		  			name:'Raw Milk', 
		  			value:'rawMilk', 
		  			placeholderName:'Milk', 
		  			placeholderVariety:'Raw'
		  		}  
	  		],
			
			certificationTypes : [
				'':{
				  name:'none', 
				  img: ''
				},
				'assure-quality':{
				  name:'Assure Quality', 
				  img: 'assure-quality.png'
				},
				'biogro':{
				  name:'BioGro', 
				  img: 'biogro.png'
				},
				'dem-organics':{
				  name:'Demeter Biodynamics', 
				  img: 'demgreen.gif'
				},
				'organicfarmnz'{
				  name:'Organic Farm NZ', 
				  img: 'organicfarmnz.png'
				},
				'transition'{
				  name:'In Transition', 
				  img: ''
				}
				
		  	]

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
						
			getData : function() {
	            return module.data;
	            console.log(module.data);
	        },
			
			addProduct : function(newData) {
				module.data.push(newData);
				return module.data;
				console.log(module.data);

			},
			
			data : [
				{
				    dateUploaded: '24/9/13',
				    category: 'Baked Goods',
				    productName: 'Buns',
				    variety: 'Whole Wheat',
				    price: 3.5,
				    quantity: 10,
				    units: 'dozen',
				    refrigeration: 'refrigeration',
				    ingredients: 'whole wheat, water, poppy seeds, sunflower seeds, sesame seeds, sugar, oil, yeast, salt',
				    description: 'Freshly baked buns topped with a delcious variety of seeds. The buns were baked in Kerikeri by loving hands. The hands in question were washed very thouroughly and covered in latex gloves during the entire baking process.',
				    certification: 'biogro',
				    producerName: 'Jane Blank',
				    producerCompany: 'Fun Buns'
				},
				{
				    dateUploaded: '24/10/13',
				    category: 'Produce',
				    productName: 'Grapefruit',
				    variety: 'Pink',
				    price: 2.5,
				    quantity: 25,
				    units: 'kg',
				    refrigeration: 'none',
				    ingredients: null,
				    description: 'These delicious pink grapefruit were grown in Whangarei without any artificial fertilier, insecticides or herbicides. In fact, every morning we get up and sing to the tree and ask the fey spirits to bless it and make it bountiful. It worked I think as we have more fruit now than my family can eat.',
				    certification: 'assure-quality',
				    producerName: 'Matt Stanley',
				    producerCompany: 'Northland Naturals'
				},
				{
				    dateUploaded: '12/11/13',
				    category: 'Meat',
				    productName: 'Sausages',
				    variety: 'Gluten-Free',
				    price: 12.5,
				    quantity: 10,
				    units: 'kg',
				    refrigeration: 'frozen',
				    ingredients: 'Organic pork, gluten-free breadcrumbs, salt, spices, smoke, tender-loving care',
				    description: 'These delicious pink grapefruit were grown in Whangarei without any artificial fertilier, insecticides or herbicides. In fact, every morning we get up and sing to the tree and ask the fey spirits to bless it and make it boutiful. It worked I think as we have more fruit now than my family can eat.',
				    certification: '',
				    producerName: 'Butch Jock',
				    producerCompany: 'Butch Butcher'
				},
				{
				    dateUploaded: '2/11/13',
				    category: 'Dairy',
				    productName: 'Yoghurt',
				    variety: 'Raw',
				    price: 4,
				    quantity: 20,
				    units: 'L',
				    refrigeration: 'refrigeration',
				    ingredients: 'raw milk, culture',
				    description: 'Raw Milk certified Demeter, made in Waipu',
				    certification: 'dem-organics',
				    producerName: 'Stan',
				    producerCompany: 'Salmon Road Dairy Farm'
				},
				{
				    dateUploaded: '7/11/13',
				    category: 'Raw Milk',
				    productName: 'Goat Milk',
				    variety: 'Raw',
				    price: 2,
				    quantity: 100,
				    units: 'L/week for 4 weeks',
				    ingredients: 'milk',
				    refrigeration: 'refrigeration',
				    description: 'Raw Goats Milk certified Organic Farm NZ. Goats raised naturally in Tutukaka.',
				    certification: 'organicfarmnz',
				    producerName: 'Klaus Lotz',
				    producerCompany: 'Tutukaka Organics'
				}
			]
		};
		
		return module;
	}])
	
	.factory('ProducerList', ['$http', function($http) {
		var module = {
						
			getData : function() {
	            return module.data;
	            console.log(module.data);
	        },
			
			addProducer : function(newData) {
				module.data.push(newData);
				return module.data;

			},
			
			data : [
				{
				   dateJoined : '10/10/13',
				    producerName : 'Lisa Taylor',
				    companyName : 'Northland Naturals 2',
				    companyImg : 'img/producers/lisa-taylor.JPG',
				    companyLogo : 'img/producer-logos/northland%20naturals%20logo.png',
				    description : 'I sell fruits and veges grown organically in deep, rich volcanic soil in Whangarei. They are so fresh and tasty',
				    email : 'lisa@maplekiwi.com',
				    phone : '0212534669',
				    address : '104/148 Corks Rd, Tikipunga Whangarei, 0221',
				    certification : 'Assure Quality',
				    feedbackScore : 4
				},
				{
				    dateJoined : '9/9/13',
				    producerName : 'Rosie Boom',
				    companyName : 'Boom Jams',
				    companyImg : 'img/producers/rosie-boom.JPG',
				    companyLogo : '',
				    description : 'Hi, I\'m Rosie Boom. I write children\'s books about homesteading and homeschooling in New Zealand. I sell home made jams and preserves made from our fruit trees. They are fantastic. Try some!',
				    email : 'boomfamily@xtra.co.nz',
				    phone : '0274376677',
				    address : 'Kara Road, Maungatepere Whangarei',
				    certification : 'none',
				    feedbackScore : 3
				},
				{
				    dateJoined : '8/8/13',
				    producerName : 'Michael Taylor',
				    companyName : 'Assistant Fig Keeper',
				    companyImg : 'img/producers/michael-taylor.JPG',
				    companyLogo : '',
				    description : 'I keep figs! I\'ve got figs to sell! Isn\'t that great? Sean is really good at webdesign don\'t you think?',
				    email : 'michael@maplekiwi.com',
				    phone : '0210699472',
				    address : '104/148 Corks Rd, Tikipunga Whangarei, 0221',
				    certification : 'Demeter Biodynamics',
				    feedbackScore : 1
				},
				{
				    dateJoined : '7/7/13',
				    producerName : 'Matt Stanley',
				    companyName : 'Northland Naturals',
				    companyImg : 'img/producers/matt-stanley.JPG',
				    companyLogo : 'img/producer-logos/northland%20naturals%20logo.png',
				    description : 'Northland Naturals is an organic permacultural centre in Whangarei. We grow on our 11 acre block all varieties of fruit and vegetables and have been feeding families since 2012.',
				    email : 'matt@maplekiwi.com',
				    phone : '02040094128',
				    address : '71 Lauries Drive, Kamo Whangarei',
				    certification : 'Organic Farm NZ',
				    feedbackScore : 5
				}
			]
		};
		
		return module;
	}])

	
	.service('LocationService', function() {
		
        this.getLocations = function() {
            return data;
        }
            
        this.addLocation = function(locationData) {
            data.push(locationData);
        }
		
        var data = [
	  		{
	  		name:'Ahipara', 
	  		value:'ahipara', 
	  		fromWhangarei:'north', 
	  		distance:'166',
	  		maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m1!1sWhangarei%2C+Northland!1m5!1sAhipara!2s0x6d090e62e90609c9%3A0x500ef6143a2b140!3m2!3d-35.1713389!4d173.1532718!3m8!1m3!1d95823!2d173.1526512!3d-35.155162!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{
	  		name:'Awanui', 
	  		value:'awanui', 
	  		fromWhangarei:'north', 
	  		distance:'161', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sAwanui%2C+Northland!3m8!1m3!1d381963!2d173.7388877!3d-35.4362299!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{
	  		name:'Dargaville', 
	  		value:'dargaville', 
	  		fromWhangarei:'west', 
	  		distance:'57.5', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sDargaville%2C+Northland!3m8!1m3!1d382129!2d173.7903178!3d-35.4011621!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{
	  		name:'East Opua', 
	  		value:'east-opua', 
	  		fromWhangarei:'north', 
	  		distance:'64.75', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sEast+Opua!3m8!1m3!1d190036!2d174.0964453!3d-35.8327467!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{
	  		name:'Haruru Fall', 
	  		value:'haruru-falls', 
	  		fromWhangarei:'north', 
	  		distance:'74.4', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sHaruru+Fall!3m8!1m3!1d381570!2d174.197306!3d-35.5190714!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{
	  		name:'Kaeo', 
	  		value:'kaeo', 
	  		fromWhangarei:'north', 
	  		distance:'109', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sKaeo%2C+Northland!3m8!1m3!1d381654!2d174.1886613!3d-35.5012849!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{
	  		name:'Kaikohe', 
	  		value:'kaikohe', 
	  		fromWhangarei:'north', 
	  		distance:'85.3', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sKaikohe%2C+Northland!3m8!1m3!1d382003!2d174.0523914!3d-35.4277197!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{
	  		name:'Kaiwaka', 
	  		value:'kaiwaka', 
	  		fromWhangarei:'south', 
	  		distance:'61.7', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sKaiwaka%2C+Northland!3m8!1m3!1d381423!2d174.0638477!3d-35.5498361!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{
	  		name:'Kerikeri', 
	  		value:'kerikeri', 
	  		fromWhangarei:'north', 
	  		distance:'84.7', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sKerikeri%2C+Northland!3m8!1m3!1d379543!2d174.3737628!3d-35.9431781!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{
	  		name:'Maungatapere', 
	  		value:'maungatapere', 
	  		fromWhangarei:'west', 
	  		distance:'12.3', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sMaungatapere%2C+Northland!3m8!1m3!1d381770!2d174.1281364!3d-35.4768735!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{
	  		name:'Maungaturoto', 
	  		value:'maungaturoto', 
	  		fromWhangarei:'south', 
	  		distance:'61.1', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sMaungaturoto%2C+Northland!3m8!1m3!1d47565!2d174.2657696!3d-35.7400534!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{
	  		name:'Mangawhai Heads', 
	  		value:'mangawhai-heads', 
	  		fromWhangarei:'south', 
	  		distance:'72.1', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sMangawhai+Heads%2C+Northland!3m8!1m3!1d379667!2d174.3737628!3d-35.9173831!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{
	  		name:'Moerewa', 
	  		value:'moerewa', 
	  		fromWhangarei:'north', 
	  		distance:'60.1', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!1m4!1m3!1d199101!2d174.1691864!3d-35.5484707!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sMoerewa!3m8!1m3!1d379583!2d174.4330177!3d-35.934878!3m2!1i1298!2i705!4f13.1&fid=0'},
	  		{
	  		name:'Ngunguru', 
	  		value:'ngunguru', 
	  		fromWhangarei:'east', 
	  		distance:'25.8', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sNgunguru%2C+Northland!3m8!1m3!1d199101!2d174.1691864!3d-35.5484707!3m2!1i1298!2i736!4f13.1&fid=0'},
	  		{
	  		name:'Ohaewai', 
	  		value:'ohaewai', 
	  		fromWhangarei:'north', 
	  		distance:'74.9', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sOhaewai!3m8!1m3!1d49696!2d174.413405!3d-35.6765609!3m2!1i1298!2i736!4f13.1&fid=0'},	  
	  		{
	  		name:'Omapere and Opononi', 
	  		value:'omapere-and-opononi', 
	  		fromWhangarei:'north', 
	  		distance:'139', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!1m4!1m3!1d397705!2d173.8538075!3d-35.6483895!4m23!3m22!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m5!1sOmapere+Services+Station%2C+State+Highway+12%2C+Omapere+0473!2s0x6d094511e45efe2b%3A0xad62d9ae39e27d2a!3m2!3d-35.534865!4d173.387571!3m8!1m3!1d397705!2d173.8538075!3d-35.6483895!3m2!1i1298!2i736!4f13.1!4i1&fid=0'},	 
	  		{
	  		name:'Paihia', 
	  		value:'paihia', 
	  		fromWhangarei:'north', 
	  		distance:'70', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1spaihia!3m8!1m3!1d397705!2d173.8538075!3d-35.6483895!3m2!1i1298!2i736!4f13.1&fid=0'},	 
	  		{
	  		name:'Rawene', 
	  		value:'rawene', 
	  		fromWhangarei:'north', 
	  		distance:'126', maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1srawene!3m8!1m3!1d398428!2d174.197306!3d-35.5029025!3m2!1i1298!2i736!4f13.1&fid=0'},	 
	  		{
	  		name:'Te Kopuru',
	  		value:'te-kopuru', 
	  		fromWhangarei:'west', 
	  		distance:'69.1', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sTe+Kopuru!3m8!1m3!1d398994!2d173.8224861!3d-35.3886194!3m2!1i1298!2i736!4f13.1&fid=0'},	 
	  		{
	  		name:'Waipu', 
	  		value:'waipu', 
	  		fromWhangarei:'south', 
	  		distance:'39.3', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sWaipu%2C+Northland!3m8!1m3!1d198375!2d174.0945862!3d-35.8397148!3m2!1i1298!2i736!4f13.1&fid=0'},	 
	  		{
	  		name:'Wellsford', 
	  		value:'wellsford', 
	  		fromWhangarei:'south', 
	  		distance:'81.1', 
	  		maps:'https://www.google.co.nz/maps/preview#!data=!4m18!3m17!1m5!1sWhangarei!2s0x6d0b829c4e6b10c7%3A0x500ef6143a39927!3m2!3d-35.7251117!4d174.323708!1m1!1sWellsford%2C+Auckland!3m8!1m3!1d198337!2d174.3737628!3d-35.854934!3m2!1i1298!2i736!4f13.1&fid=0'},	 
	  		{
	  		name:'Whangarei', 
	  		value:'whangarei', 
	  		fromWhangarei:'south', 
	  		distance:'0', 
	  		maps:'https://www.google.co.nz/maps/preview#!q=Whangarei%2C+Northland&data=!1m4!1m3!1d99347!2d174.2877818!3d-35.7118146!4m10!1m9!4m8!1m3!1d103667!2d174.2877818!3d-35.7118146!3m2!1i1024!2i768!4f13.1'},	 
	  ];
    });
