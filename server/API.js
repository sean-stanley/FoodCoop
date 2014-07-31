var util = require('util'),
    http = require('http'),
    fs = require('fs'), // javascript templates
    url = require('url'),
    events = require('events'),
	flash = require('connect-flash'), // makes it possible to send flash messages to the site
	express = require('express'); // handles routing and such
	bodyParser = require('body-parser'), // creates a req.body object to allow easy access of request data in the api.
	methodOverride = require('method-override'), // an express module for overriding default http methods
	cookieParser = require('cookie-parser'), // an express module for reading, writing and parsing cookies. In the app it is used for session cookies.
	session = require('express-session'), // an express module for creating browser sessions.
	errorHandler = require('express-error-handler'), // an express module for handling errors in the app.
	mongoose = require('mongoose'), // used to connect to MongoDB and perform common CRUD operations with the API.
	models = require('./models.js'), // this file stores the mongoose schema data for our MongoDB database.
	mail = require('./staticMail.js'), // this file stores some common mail settings.
	Emailer = require('./emailer'), // this is a custom class expanded upon nodemailer to allow html templates to be used for the emails.
	passport = require('passport'), // middleware that provides authentication tools for the API.
	LocalStrategy = require('passport-local').Strategy; // the passport strategy employed by this API.

	// This function exports all the routes and configured API so that the web-server file can remain small and compact.
exports.configAPI = function configAPI(app){
	app.use(bodyParser.json()); // here we load the bodyParser and tell it to parse the requests received as json data.
	app.use(methodOverride()); // here we initilize the methodOverride middleware for use in the API.
	app.use(cookieParser()); // here we initilize the cookieParser middleware for use in the API.
	app.use(flash()); // here we initilize the flash middleware for use in the API.
	app.use(session({ // here we initilize our session data with the following options.
		secret: 'Intrinsic Definability', // this must remain a secret.
		resave: true,
		saveUninitialized: true
	}));
	app.use(passport.initialize()); // here we initilize Passport middleware for use in the app to handle user login.
	app.use(passport.session()); // here we initilize passport's sessions which expand on the express sessions the ability to have our session confirm if a user is already logged in.
	
	// this contains the common ways the app sends emails and is accessed in the app from the contact forms.
	app.post("/api/mail", function(req, res, next) {
		var toMeoptions, toMedata, toClientOptions, toClientData, toMe, toClient, toProducerOtpions, toProducerData;
		// So far no form validation has been done on the request as the client side
		// form validation is extensive and sufficient. However, more validation could
		// be done at a later point just to be safe.
		
		
		if (!req.body.hasOwnProperty('to')) { 
			
			// the message originated in the `contact us` page and thus has no 'to' in the req.body then...
			// the options objects are for selecting an html template from the mailTemplates
			// directory, defining a subject (which could be just a string) and defining
			// the recipient. At the moment only one recipient is allowed and must be an
			// object with a structure like
			// {name: 'Jo Frank', address: jo@example.com}. Support for multiple
			// recipients will be coming soon as it is needed for messages sent to all
			// members.
				
			// The data objects here correspond to whatever template was chosen in a options
			// object. Different templates require different data. Each property of the data
			// object evaluates to a variable name in the template.
				
		
		
			toMeoptions = {template: "contact-form", subject: req.body.subject, to: mail.companyEmail}; 
			toMedata = {
				from: req.body.name,
				subject: req.body.subject,
				email: req.body.email,
				message: req.body.message
			};
		  
			toClientOptions = {template: 'thankyou', subject: 'Message sent successfully', to: { email: req.body.email, name : req.body.name }};
		
			toClientData = {
				name: req.body.name,
				message: req.body.message
			};
			
			// this is how an email gets formally setup with the right options and data.
			toMe = new Emailer(toMeoptions, toMedata); 
			toClient = new Emailer(toClientOptions, toClientData);

			// Sends the email using settings from emailer.js The unused result
			// variable is the completed message object.
			toMe.send(function(err, result) {
				if (err) {
					return console.log(err);
				}
				// a response is sent so the client request doesn't timeout and get an error.
				console.log("Message sent to me");
				res.send("text/plain", "Message sent to the NNFC"); 
			});
		
			toClient.send(function(err, result) {
				if (err) {
					return console.log(err);
				}
				// a response is sent so the client request doesn't timeout and get an error.
				console.log("Message sent to client");
				res.send("text/plain", "Message sent to client");
			});
		}
		
		else if (req.body.hasOwnProperty('to')){
			// this case is for when a client is trying to send a message to one of our producer members.
			// the data and objects data are very similar to other cases but here the 'to'
			// property of the options object is populated with data from the client. 
						
			var 
			
			toProducerOptions = {template: "contact-form", subject: req.body.subject, to: {name: req.body.toName, email: req.body.to}  }
			toProducerData = {
				from: req.body.name,
				subject: req.body.subject,
				email: req.body.email,
				message: req.body.message};
			
			toProducer = new Emailer(toProducerOptions, toProducerData);
			
			toProducer.send(function(err, result) {
				if (err) {
					return console.log(err);
				}
				// a response is sent so the client request doesn't timeout and get an error.
				console.log("Message sent to producer");
				res.send("text/plain", "Message sent to producer");
			});
			
		}
		
		else {
			// here if no message data was received in the request, a response is sent
			// detailing what happened.
			res.send("text/plain", "No messages sent"); 
		}
		
		
	});
	
	// this route looks up products and sends an array of results back to the client.
	app.get("/api/product", function(req, res, next) {
		var opts;
		
		models.Product.find(req.query, null, { sort:{ _id : 1 }}, function(e, results) {
			if (!e) { // if no errors
				opts = [ 
					{ path: 'category', select: 'name -_id'},
					{ path: 'certification', select: 'name -_id'},
					{ path: 'producer_ID', select: 'name -_id'}
				]
				
				// replace the id references in the product with the names of the category, certification and producer
				models.Product.populate(results, opts, function(e, product){
					if (!e) res.json(product);
					
					else console.log(e);
					
				});
				
			}
			else {
				console.log(e) // log the error
			}
		})
	});
	
	// this either creates a new product or updates an existing product with data from the req.body. It is
	// usually only called from the product-upload page of the app.
	app.post("/api/product", function(req, res, next) {
		var productObject, needsSave, key, newProduct;
		
		if (req.user) { 
			// this tests if a user is authenticated.
			if (req.body._id) {
				// If the body for a product contains an ID, it must already exist so we will
				// update it.Ideally only an admin or the user who
				// created a product can update it. The original product is looked up by id.
								
				models.Product.findById(req.body._id, function(e, product) {// first find the right product by it's ID
					if (!e) {
						productObject = product.toObject();
						needsSave = false;
						for (key in req.body) {
							if (productObject[key] !== req.body[key]) { 
								// compare the values of the database object to the values of the request object.
								console.log("we are now replacing the old product's "+key+" which evaluates to: "+productObject[key]+" with the new value of: "+req.body[key]);
								product[key] = req.body[key]; // update the product's properties
								needsSave = true;
							}
						}
						if (needsSave) {
							product.save();
							res.json(product); // send back the changed product to the app as JSON.
						} // save the changes
						
						else {
							res.send(200, 'No changes detected');
						}
						
					}
					else {
						console.log(e) 
						// log the error to the console.
						}
					});
				}
			else {
				newProduct = new models.Product({
					dateUploaded: new Date.now(),
					category: req.body.category,
					productName: req.body.productName,
					variety: req.body.variety,
					price: req.body.price,
					quantity: req.body.quantity,
					units: req.body.units,
					refrigeration: req.body.refrigeration,
					ingredients: req.body.ingredients,
					description: req.body.description,
					certification: req.body.certification,
					producer: req.body.producerName,
					producerCompany: req.body.producerCompany
				}).save();
			}			
		}
		else {
			res.send(401, 'Producer not signed in');
		}
		
	});

	// this request will delete a product from the database. First we find the
	// requested product.
	app.post("/api/product/delete", function(req, res, next) {
		
		// ensure user is logged in to perform this request.		
		if (req.user) {
			// delete the product based on it's id and send a request confirming the deletion
			// if it goes off without a hitch.
			models.Product.remove({ id: req.body._id }, function(e, results){
				if (!e) { // if no errors
					console.log(results);
					res.send('text/plain', 'product deleted');
				}
				else {
					console.log(e) // log the error
				}
			});
		}
		else {
			res.send(400, 'Not logged in');
		}
	});
	
	// this request will return orders based on a query. Generally this is used to
	// return all of a month's orders.
	app.get("/api/order", function(req, res, next) {
		var order, opts, orderObject;
		
		// check if the current user is logged in
		if (req.user) {
			// finds all the orders requested by the query from the url query.
			models.Order.find(req.query, null, { sort:{ datePlaced : 1 }}, function(e, results){
				console.log(results);
				if (!e) { // if no errors
					
					// define options for replacing ID's in the order with the appropriate data from other collections
					opts = [
						{ path: 'product', model: 'models.Product', select: 'name variety price producer_ID' },
						{ path: 'customer', model: 'models.User', select: 'name' },
						{ path: 'product.producer_ID', model: 'models.User', select: 'name email producerData' }
					];
					
					// replace the ID's in an order with proper values before sending to the app.
					// @results is the results returned from the Order Query
					// @opts is the array of options for the populate method to use.
					// @e is the error
					// @orders is the returned array or object of order data
					models.Order.populate(results, opts, function(e, orders) {
						console.log(orders);
						// send the results to the app if no error occurred.
						if (!e) {
							orderObject = orders.toObject();
							res.json(orderObject);
						}
						else console.log(e);
						
					});
						
				}
				else {
					console.log(e) // log the error
				}
			})
		}
		
	});
	// get the orders made to a particular producer (the one logged in specifically)
	app.get("api/order/:id", function(req, res, next) {
		var opts, orderObject;
		// check if the cuurent user is logged in and is requesting his or her own cart
		if (req.user && req.user._id === req.params.id) {
			// get the cart orders for the current user.
			models.Order.find({customer: req.params.id}, null, { sort:{ datePlaced: 1 }}, function(e, results) {
				if (!e) {
					
					// define options for replacing ID's in the order with the appropriate data from
					// other collections. The other collections are specified with the 'ref'
					// property in the collections' Schema object.
					opts = [
						{ path: 'product', select: 'name variety price producer_ID' },
						{ path: 'customer', select: 'name' },
						{ path: 'product.producer_ID', select: 'name email producerData' }
					];
					
					// replace the ID's in an order with proper values before sending to the app.
					// @results is the results returned from the Order Query
					// @opts is the array of options for the populate method to use.
					// @e is the error
					// @cart is the returned array or object of order data
					models.Order.populate(results, opts, function(e, orders) {
						console.log(orders);
						// send the results to the app if no error occurred.
						if (!e) {
							orderObject = order.toObject();
							res.json(orderObject);
						}
						
						else console.log(e);
					});
				}
				else console.log(e);
			});
		}
	});
	// get a customer's cart by using their customer ID as a request parameter. The
	// app knows the id of signed in users.
	app.get("api/cart/:id", function(req, res, next) {
		var opts, cartObject;
		// check if the cuurent user is logged in and is requesting his or her own cart.
		// Server-side validation.
		if (req.user && req.user._id === req.params.id) {
			// get the cart orders for the current user.
			models.Order.find({customer: req.params.id}, null, { sort:{ datePlaced: 1 }}, function(e, results) {
				if (!e) {
					
					// define options for replacing ID's in the order with the appropriate data from
					// other collections. The other collections are specified with the 'ref'
					// property in the collections' Schema object.
					opts = [
						{ path: 'product', select: 'name variety price producer_ID' },
						{ path: 'customer', select: 'name' },
						{ path: 'product.producer_ID', select: 'name email producerData' }
					];
					
					// replace the ID's in an order with proper values before sending to the app.
					// @results is the results returned from the Order Query
					// @opts is the array of options for the populate method to use.
					// @e is the error
					// @cart is the returned array or object of order data
					models.Order.populate(results, opts, function(e, cart) {
						console.log(cart);
						// send the results to the app if no error occurred.
						if (!e) {
							// converts and transforms the cart data into plain javascript before sending it
							// to the client.
							cartObject = cart.toObject();
							res.json(cartObject);
						}
												
						else console.log(e);
					});
				}
				else console.log(e);
			});
		}
	});
	
	// Creates a new order from the 'add to cart' buttons in the app. No validation yet.
	app.post("/api/order", function(req, res, next) {
		new models.Order({
			product: req.body.productId,
			customer: req.body.customerId,
			supplier: req.body.supplierId,
			quantity: req.body.quantity,
			datePlaced: Date.now()
		}).save()
	});
	
	// Deletes a specific item from a users cart.
	app.delete("/api/cart/:id/:product", function(req, res, next) {
		models.Order.findOne({_id : req._id}, function(e, results){
			res.send(results)
		})
	});
	
	app.get("/api/user", function(req, res, next) {
		// search for users. if the req.query is blank, all users will be returned.
		models.User.find(req.query, null, { sort:{ _id : 1 }}, function(e, results){
			if (!e) { // if no errors
				results.toObject.transform()
				
				res.json(results);
			}
			else {
				console.log(e) // log the error
			}
		});
	});
	
	
	app.post("/api/user", function(req, res, next) {    
		models.User.register(new models.User({
			dateJoined : Date.now(),
			name : req.body.name,
			email : req.body.email,
			phone : req.body.phone,
			address : req.body.address,
			user_type : req.body.user_type}),
			req.body.password,
			function(err, account) {
				passport.authenticate('local')(req, res, function () {
				res.redirect('/');
			});
		});
	});
	app.post("/api/user/:id", function(req, res, next) {
		models.User.findById(req.params.id, function(e, user) {
			if (!e && req.user) {
				var userObject = user.toObject();
				for (key in req.body) {
					if (userObject[key] !== req.body[key]) {
						console.log("we are now replacing the old user's "+key+" which evaluates to: "+userObject[key]+" with the new value of: "+req.body[key]);
						user[key] = req.body[key];
					}
				}
				user.save();
				res.send(user);
			}
			else {
				console.log(e)
			}
		});
	});
	app.get("/api/user/:id", function(req, res, next) {
		models.User.findById(req.params.id, function(e, results){
			if (!e) {
				res.send(results);
			}
			else {
				console.log(e)
			}
		});
	});
	app.get("/api/user/producer/:producerName", function(req, res, next) {
		models.User.findOne({name: req.params.producerName}, null, { sort:{ _id : 1 }}, function(e, results){
			if (!e) {
				res.send(results);
			}
			else {
				console.log(e)
			}
		});
	});
	
	app.get("/api/user/:id/producer/logo", function(req, res, next) {
		models.User.findById(req.params.id, 'producerData.logo', function(e, results){
			if (!e) {
				res.send(results);
			}
			else {
				console.log(e)
			}
		});
	});
	app.post("/api/user/:id/producer/edit", function (req, res, next) {
		var user = models.User.findByIdAndUpdate(req.params.id, {producerData : req.body.producerData}, function (err, raw){
			if (err) return handleError(err);
			  console.log('The raw response from Mongo was ', raw);
			});
	})
	app.post("/api/user/delete", function(req, res, next) { // disabled
		models.User.findOne({_id : req._id}, function(e, results){
			res.send(results)
		})
	});
	app.route('/auth/session')
		.get(function (req, res, next) {
			if (req.user) { 
				res.json(req.user);
			}
			else {
				res.send('text/plain', 'Not logged in');
			}
		
		})
		.post(passport.authenticate('local', {failureFlash	: 'Login Failed for some reason',
											failureRedirect	: '#/login-failed'}), // redirect not working for some reason. Possibly an angularJS issue?
			function (req, res, next) {		
				var userObject = req.user.toObject();
				res.json(userObject);
		})
		.delete(function (req, res) {
			if(req.user) {
				req.logout();
				res.send(200, "Successfully Logged out");
			} else {
				res.send(400, "Not logged in");
			}
		});
 
	// Static stuff, won't be changed by users.
	app.get("/api/category", function(req, res, next) {
		models.Category.find(req.query, null, { sort:{ _id : 1 }}, function(e, results){
			res.json(results)
		})
	});
/*
	app.get("/api/location", function(req, res, next) {
		models.Location.find(req.query, null, { sort:{ _id : 1 }}, function(e, results){
			res.send(results)
		})
	});*/

	app.get("/api/certification", function(req, res, next) {
		models.Certification.find(req.query, null, { sort:{ _id : 1 }}, function(e, results){
			res.json(results)
		})
	});
	
	app.use(express.static(__dirname));
	app.use(errorHandler({ dumpExceptions: true, showStack: true }));
	return app;
}