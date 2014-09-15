var util = require('util'),
	http = require('http'),
	fs = require('fs'), // file system
	url = require('url'),
	async = require('async'),
	_ = require('lodash'),
	crypto = require('crypto'),
	events = require('events'),
	compression = require('compression'),
	express = require('express'), // handles routing and such
	bodyParser = require('body-parser'), // creates a req.body object to allow easy access of request data in the api.
	methodOverride = require('method-override'), // an express module for overriding default http methods
	cookieParser = require('cookie-parser'), // an express module for reading, writing and parsing cookies. In the app it is used for session cookies.
	session = require('express-session'), // an express module for creating browser sessions.
	errorHandler = require('express-error-handler'), // an express module for handling errors in the app.
	geocoder = require('geocoder'), // for geocoding user addresses.
	mongoose = require('mongoose'), // used to connect to MongoDB and perform common CRUD operations with the API.
	ObjectId = require('mongoose').Types.ObjectId,
	models = require('./models.js'), // this file stores the mongoose schema data for our MongoDB database.
	mail = require('./staticMail.js'), // this file stores some common mail settings.
	Emailer = require('./emailer.js'), // this is a custom class expanded upon nodemailer to allow html templates to be used for the emails.
	mailChimp = require('./mailChimp.js'),
	config = require('./coopConfig.js'), // static methods of important configuration info
	scheduler = require('./scheduler.js'), // contains scheduled functions and their results
	
	passport = require('passport'), // middleware that provides authentication tools for the API.
	LocalStrategy = require('passport-local').Strategy; // the passport strategy employed by this API.

require('datejs'); // provides the best way to do date manipulation.


// sets date locality and formats to be for new zealand.
Date.i18n.setLanguage("en-NZ");


// This function exports all the routes and configured API so that the web-server file can remain small and compact.
exports.configAPI = function configAPI(app) {
	
	// Middleware
	// ==========
	app.use(compression({threshold: 512}));
	
	// here we load the bodyParser and tell it to parse the requests received as json data.
	app.use(bodyParser.json({limit: '50mb'})); 
	// here we initilize the methodOverride middleware for use in the API.
	app.use(methodOverride()); 
	// here we initilize the cookieParser middleware for use in the API.
	app.use(cookieParser()); 
	app.use(session({saveUninitialized: true, resave: true, secret: 'Intrinsic Definability'}));
	app.use(passport.initialize()); // here we initilize Passport middleware for use in the app to handle user login.
	// here we initilize passport's sessions which expand on the express sessions
	// the ability to have our session confirm if a user is already logged in.
	app.use(passport.session()); 


	// Routes
	// ======
	
	// this contains the common ways the app sends emails and is accessed in the app from the contact forms.
	app.post("/api/mail", function(req, res, next) {
		var toMeoptions, toMedata, toClientOptions, toClientData, toMe, toClient, toProducerOtpions, toProducerData;
		// So far form validation has been done client side
		// form validation is extensive and sufficient. However, more validation could
		// be done at a later point just to be safe.
		
		// if no 'to' the data must be for the co-op to recieve as opposed to another member.
		if (!req.body.hasOwnProperty('to')) {

			// the options objects are for Emailer options like template, subject and recipient.
			// At the moment only one recipient is allowed and must be an object with a 
			// structure {name: 'Jo Frank', address: jo@example.com}. Support for multiple
			// recipients is done with MailChimp API
			
			// The data objects here correspond to whatever template was chosen in a options
			// object. Different templates require different data. Each property of the data
			// object evaluates to a variable name in the template.

			toMeoptions = {
				template: "contact-form",
				subject: req.body.subject,
				to: mail.companyEmail
			};
			toMedata = {
				from: req.body.name,
				subject: req.body.subject,
				email: req.body.email,
				message: req.body.message
			};
			toClientOptions = {
				template: 'thankyou',
				subject: 'Message sent successfully',
				to: {
					email: req.body.email,
					name: req.body.name
				}
			};

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
					res.send(500);
				}
				/*
				// a response is sent so the client request doesn't timeout and get an error.
								res.send("text/plain", "Message sent to the NNFC");*/
				
			});

			toClient.send(function(err, result) {
				if (err) {
					console.log(err);
					res.send(500);
				}
				// a response is sent so the client request doesn't timeout and get an error.
				res.send("text/plain", "Message sent to client");
			});
		} else if (req.body.hasOwnProperty('to')) {
			// this case is for when a client is trying to send a message to one of our producer members.
			// the data and objects data are very similar to other cases but here the 'to'
			// property of the options object is populated with data from the client. 
			toProducerOptions = {
				template: "contact-form",
				subject: req.body.subject,
				to: {
					name: req.body.toName,
					email: req.body.to
				}
			}
			toProducerData = {
				from: req.body.name,
				subject: req.body.subject,
				email: req.body.email,
				message: req.body.message
			};

			toProducer = new Emailer(toProducerOptions, toProducerData);

			toProducer.send(function(err, result) {
				if (err) {
					console.log(err);
					res.send(500);
				}
				// a response is sent so the client request doesn't timeout and get an error.
				res.send(200, "Message sent to producer");
			});
		} else {
			// here if no message data was received in the request, a response is sent
			// detailing what happened.
			res.send(403, "No messages sent");
		}
	});

	// this route looks up products and sends an array of results back to the client.
	app.get("/api/product", function(req, res, next) {
		var opts;

		models.Product.find(req.query, null, {
			sort: {
				_id: 1
			}
		}, function(e, results) {
			if (!e) { // if no errors
				opts = [{
					path: 'category',
					select: 'name -_id'
				}, {
					path: 'certification',
					select: 'name -_id img'
				}, {
					path: 'producer_ID',
					select: 'name producerData.companyName'
				}]

				// replace the id references in the product with the names of the category, certification and producer
				models.Product.populate(results, opts, function(e, product) {
					if (!e) res.json(product);

					else console.log(e);

				});

			} else {
				console.log(e) // log the error
			}
		})
	});
	
	// return just one product for editing or use as a template for another product
	app.get("/api/product/:id", function(req, res, next) {
		console.log(req.params.id);
		if (req.user) {
			models.Product.findById(req.params.id, function(e, product) {
				if (!e) {
					if (product) {
						var productObject = product.toObject();
						// if truthy then the product being requested is to be sold this month so pass the _id as well.
						if (productObject.cycle == scheduler.currentCycle) {
							res.send(productObject);
						}
						
						else {
							delete productObject._id;
							res.send(productObject);
						}
					}
					else {
						res.send(404);
					}
				
				} else {
					console.log(e);
				}
			});
		}
		else res.send(401);
		
	});
	
	

	// this either creates a new product or updates an existing product with data from the req.body. It is
	// usually only called from the product-upload page of the app.
	app.post("/api/product", function(req, res, next) {
		var productObject, needsSave, key, newProduct;
		// this tests if a user is authenticated.
		if (req.user && req.user.user_type.canSell) {
			
			if (scheduler.canUpload) {
				// convert ingredients string to an array
				if (typeof req.body.ingredients === "string" && req.body.ingredients.length > 0) {
					req.body.ingredients = req.body.ingredients.split(/,\s*/);
				}
			
				else if (req.body.ingredients instanceof Array) {
					req.body.ingredients = req.body.ingredients.join(', ');
					req.body.ingredients = req.body.ingredients.split(/,\s*/);
				}
						
				// If the body for a product contains an ID, it must already exist so we will
				// update it. Only an admin or the user who
				// created a product can update it. The original product is looked up by id.
				if (req.body._id) {
					models.Product.findById(req.body._id, function(e, product) { // first find the right product by it's ID
						if (!e) {
							productObject = product.toObject();
							needsSave = false;
							for (key in req.body) {
								if (productObject[key] !== req.body[key]) {
									// compare the values of the database object to the values of the request object.
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

						} else {
							console.log(e)
							// log the error to the console.
						}
					});
				} else {
					models.Product.create({
						dateUploaded: Date.today(),
						img: req.body.img,
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
						producer_ID: req.user._id,
						cycle: scheduler.currentCycle
					}, function(e, product) {
						if (!e) {
							res.send(200);
						}
						else console.log(e)
					});
				}
			}
			
			else res.send(403, "It's not the right time of the month to upload products")
			
			
		} else {
			res.send(401, 'Producer not signed in');
		}

	});

	// this request will delete a product from the database. First we find the
	// requested product.
	app.delete("/api/product/:id", function(req, res, next) {

		// ensure user is logged in to perform this request.		
		if (req.user && scheduler.canUpload) {
			// delete the product based on it's id and send a request confirming the deletion
			// if it goes off without a hitch.
			models.Product.findById(new ObjectId(req.params.id), function(e, result) {
				if (!e && results) { // if no errors
					if (result.producer_ID == req.user._id || req.user.user_type.isAdmin) {
						result.remove();
						res.send(200, 'product deleted');
					}
					else res.send(403, 'You aren\'t authorized to delete that product');
				} else {
					console.log(e) // log the error
					res.send(404);
				}
			});
		} 
		else if (!scheduler.canUpload) res.send(403, "Drat! Wrong time of the ordering cycle to delete products.");
		else res.send(401, 'Not logged in');
	});

	// return a compact list of all the current user's products.
	app.get("/api/product-list", function(req, res, next) {
		if (req.user) {
			models.Product.find(req.query)
			.where('producer_ID').equals(new ObjectId(req.user._id))
			.select('productName variety dateUploaded price quantity units')
			.sort('datePlaced')
			.exec(function(e, products){
				if (!e) {
					res.json(products);
				} else {
					console.log(e);
					res.send(500);
				}
			});
		}
		else res.send(401);
	});
	// return a compact list of all the current user's products for the current month.
	app.get("/api/product-list/current", function(req, res, next) {
		if (req.user) {
			models.Product.find({
				producer_ID : new ObjectId(req.user._id),
				cycle: scheduler.currentCycle || 0
			}, 'productName variety dateUploaded price quantity units', { sort: {datePlaced: 1} }, function(e, products) {
				if (!e) {
					res.json(products);
				}
				else {
					console.log(e);
				}
			});
		}
		else res.send(401);
	});
	// return a compact list of all the current user's products for the last month.
	app.get("/api/product-list/recent", function(req, res, next) {
		if (req.user) {
			models.Product.find({
				producer_ID : new ObjectId(req.user._id),
				cycle: scheduler.currentCycle - 1 || 0
			}, 'productName variety dateUploaded price quantity units', { sort: {datePlaced: 1} },
				function(e, products) {
				if (!e) {
					res.json(products);
				}
				else {
					console.log(e);
				}
			});
		}
		else res.send(401);
	});

	// this request will return orders based on a query. Generally this is used to
	// return all of a month's orders.
	app.get("/api/order", function(req, res, next) {
		var order, opts, orderObject;

		// check if the current user is logged in
		if (req.user) {
			// finds all the orders requested by the query from the url query.
			models.Order.find(req.query, null, {
				sort: {
					datePlaced: 1
				}
			}, function(e, results) {
				if (!e) { // if no errors

					// define options for replacing ID's in the order with the appropriate data from other collections
					opts = [{
						path: 'product',
						model: 'models.Product',
						select: 'fullName price units producer_ID productName variety'
					}, {
						path: 'customer',
						model: 'models.User',
						select: 'name'
					}, {
						path: 'product.producer_ID',
						model: 'models.User',
						select: 'name email producerData.companyName'
					}];

					// replace the ID's in an order with proper values before sending to the app.
					// see mongoose API docs for more info.
					models.Order.populate(results, opts, function(e, orders) {
						console.log(orders);
						// send the results to the app if no error occurred.
						if (!e) {
							res.json(orders);
						} else console.log(e);

					});

				} else {
					console.log(e) // log the error
				}
			})
		}
		else res.send(401);

	});
	// get the orders made to the currently authenticated producer/supplier
	app.get("/api/order/me", function(req, res, next) {
		var opts, orderObject;
		// check if the current user is authenticated
		if (req.user) {
			// get the cart orders for the current user.
			models.Order.find({
				supplier: req.user._id
			}, null, {
				sort: {
					datePlaced: 1
				}
			}, function(e, results) {
				if (!e) {
					// define options for replacing ID's in the order with the appropriate data from
					// other collections. The other collections are specified with the 'ref'
					// property in the collections' Schema object.
					opts = [{
						path: 'product',
						select: 'fullName price units productName variety'
					}, {
						path: 'customer',
						select: 'name email'
					}, {
						path: 'supplier',
						select: 'name email producerData.companyName'
					}];

					// replace the ID's in an order with proper values before sending to the app.
					// @results is the results returned from the Order Query
					// @opts is the array of options for the populate method to use.
					// @e is the error
					// @cart is the returned array or object of order data
					models.Order.populate(results, opts, function(e, orders) {
						// send the results to the app if no error occurred.
						if (!e && orders) {
							res.json(orders);
						} else {
							console.log(e);
							res.send(500);
						}
					});
				} else console.log(e);
			});
		}
		else res.send(401);
	});
	// get a suppliers orders for the current cycle grouped by customer
	app.get("/api/order/cycle", function(req,res, next){
		if (req.user) {
			async.waterfall([
				function(done) {
					models.Order
					.aggregate().match({cycle: scheduler.currentCycle, supplier: req.user._id})
					.group({ _id: "$customer", orders: { $push : {product: "$product", quantity: "$quantity"} }})
					.exec(function(e, customers) {
						// customers is a plain javascript object not a special mongoose document.
						done(e, customers)
					})
				},
				function(customers, done) {
					models.Product.populate(customers, {path: 'orders.product', select: 'fullName price units productName variety'}
					, function(e, result){
						_.map(result, function(producer) {
							producer.orders = _.sortBy(producer.orders, function(order) {
								return order.product.fullName.toLowerCase();
							});
							return producer
						});
						done(null, result)
					});
				},
				function(customers, done) {
					models.User.populate(customers, {path: '_id', select: 'name email'}
					, function(e, result){
						done(null, result)
					});
				}
			],function(e, result){
				if (e) {
					console.log(e)
					res.send(500);
				}
				else res.json(result);
			});	
		}
		else res.send(401);
	});
	
	app.get("/api/cart/:user/length", function(req, res, next) {
		if (req.user && req.user._id == req.params.user) {
			models.Order.count({customer: new ObjectId(req.params.user), cycle: scheduler.currentCycle}, function(e, count) {
				if (!e) {
					res.send(count.toString());
				}
				else {
					console.log(e);
					res.send(500);
				}
			})
		}
	});
	// get a customer's cart items by using their customer ID as a request parameter.
	app.get("/api/cart/:user", function(req, res, next) {
		var opts, cartObject;
		// check if the current user is logged in and is requesting his or her own cart.
		// Server-side validation.
		if (req.user && req.user._id == req.params.user) {
			// get the cart orders for the current user.
			models.Order.find({
				customer: new ObjectId(req.params.user),
				cycle: scheduler.currentCycle
			}, null, {
				sort: {
					datePlaced: 1
				}
			}, function(e, results) {
				if (!e) {
					// define options for replacing ID's in the order with the appropriate data from
					// other collections. The other collections are specified with the 'ref'
					// property in the collections' Schema object.
					opts = [{
						path: 'product',
						select: 'fullName price productName variety'
					}, {
						path: 'customer',
						select: 'name'
					}, {
						path: 'supplier',
						select: 'name email producerData.companyName'
					}];

					// replace the ID's in an order with proper values before sending to the app.
					// @results is the results returned from the Order Query
					// @opts is the array of options for the populate method to use.
					// @e is the error
					// @cart is the returned array or object of order data
					models.Order.populate(results, opts, function(e, cart) {
						// send the results to the app if no error occurred.
						if (!e) {
							// quick test we got the right cart items
							cart.forEach(function(item) {
								if (item.customer.name !== req.user.name) {
									console.log('these cart items are not for the right user');
								}
							});
							// converts and transforms the cart data into plain javascript before sending it
							// to the client.
							res.json(cart);
						} else console.log(e);
					});
				} else console.log(e);
			});
		}
		else res.send(401);
	});
	// update an order from a user's perspective. Only allowed to change quantity
	app.post("/api/cart", function(req, res, next) {
		if (req.user && scheduler.canShop) {

			async.waterfall([
				function(callback) {
					models.Order.findById(req.body._id, 'quantity product cycle', function(e, order) {
						if (!e) {
							callback(null, order.quantity, req.body.quantity, order);
						}
						else {
							console.log(e);
							callback(e);
						}
					});
				},
				function(oldQuantity, newQuantity, order, callback) {
					models.Product.findById(order.product, function(e, product) {
						if (!e) {
							// make sure we are changing an order for the current cycle and a current product
							if (order.cycle === product.cycle && product.cycle === scheduler.currentCycle) {
								if (product.quantity + (oldQuantity - newQuantity) >= 0) {
									product.quantity = product.quantity + (oldQuantity - newQuantity);
									product.save();
									order.quantity = newQuantity;
									order.save();
								
									res.send(200);
								}
								else {
									res.send("Sorry! Insufficient inventory to add more than " + product.quantity + " to your cart" );
								}
							}
							else {
								res.send("Sorry! That product cannot be changed at this time. Contact technical support for assistance");
							}
						}
						else {
							callback(e);
						}
					});
				}
				], 
				function(err) {
					console.log(err);
					res.send(500);
			});
		}
		else res.send(403);
		
	});
	// Deletes a specific item from a users own cart and increases the quantity
	// available of that product again.
	app.delete("/api/cart/:id", function(req, res, next) {
		// Check if the current user is logged in and their ID in the params matches the
		// id of their user data. If it does, delete that order from the database. Items
		// entered after the end of ordering week can't be changed.
		if (req.user) {
			models.Order.findById(req.params.id, function(e, order) {
				if (!e) {
					// make sure only recent orders are being deleted
					if (order.cycle === scheduler.currentCycle) {
						
					}
					// adjust the inventory of the product available
					models.Product.findByIdAndUpdate(order.product, { $inc: {quantity : order.quantity}}, function(e, product) {
						if (!e) {
							// delete the requested order
							order.remove();
						}
					});
					// respond with a basic HTML message
					res.send(204, 'Product removed from cart');
				}

			})
		}
		else res.send(401);
	});
	
	// Creates a new order from the 'add to cart' buttons in the app. Returns the
	// populated order. It creates the order object and subtracts the quantity from
	// the product being purchased inventory.
	app.post("/api/order", function(req, res, next) {
		if (req.user && scheduler.canShop) {
			if (req.body.customer !== req.body.supplier) {
				async.waterfall([
					function(callback) {
						models.Order.create({
							product: req.body.product,
							customer: req.body.customer,
							supplier: req.body.supplier,
							quantity: req.body.quantity,
							datePlaced: Date(),
							cycle: scheduler.currentCycle
						}, function(e, newOrder) {
							if (!e) {
								callback(null, newOrder);
						
							}
							else {
								console.log(e);
								res.send(500);
								callback(e);
							}
						});
						
					},
					function(newOrder, callback) {
						models.Product.findByIdAndUpdate(newOrder.product, { $inc: {quantity : newOrder.quantity * -1}}, function(e, product) {
							if (!e) {
								console.log(product.quantity);
								callback(null, newOrder);
							}
							else callback(e);
						});
					},
					function(newOrder, callback) {
						
						newOrder
						.populate('product', 'price units fullName productName variety')
						.populate('supplier', 'name email producerData.companyName', function(e, order) {
							if (!e) res.json(newOrder);
							else callback(e);
						});
						
					}
				], function(error) { 
					console.log(error); 
					res.send(500); 
					return errorHandler(error);
				});
			}
			else res.send(403, "Sorry, you can't try to buy your own products");
		} else { // error handling 
			if (!scheduler.canShop) res.send(403, "It's not shopping time yet");
			else res.send(401, "Not logged in");
		}
	});
	
	// get all the invoices or a query. Called in the app from the invoices page
	app.get("/api/invoice", function(req, res, next) {
		if (req.user) {
			models.Invoice.find(req.query, null, {sort : {_id:1} }, function(e, invoices) {
				models.Invoice.populate(invoices, {path:'invoicee', select: 'name address phone email -_id'}, function(e, invoices) {
					if (e) return errorHandler(e);
					res.json(invoices);
				});
			});
		}
	});
	
	// update an invoice's status
	app.put("/api/invoice", function(req, res, next) {
		models.Invoice.findByIdAndUpdate(req.body._id, {status: req.body.status}, function(e, invoice){
			if (e) return errorHandler(e);
			
			// Save the time the invoice was modified
			invoice.dateModified = Date();
			invoice.save();
			res.send(202);
		});
	});
	
	// get a query of one specific invoice by id
	app.get("/api/invoice/:id", function(req, res, next) {
		models.Invoice.findById(req.params.id, function(e, invoice) {
			models.Invoice.populate(invoice, {path:'invoicee', select: 'name address phone email -_id'}, function(e, invoice) {
				if (e) return errorHandler(e);
				res.json(invoice);
			});
		});
	});
	
	//Forward producer application to standards committee.
	app.post("/api/producer-applicaiton", function(req, res, next) {
		var application, mailData, mailOptions, email;
		if (req.user && !req.user.user_type.canSell) {
			application = req.body;
			mailOptions = {template: 'producer-application-form', subject: 'Application form for member '+ req.user.name, to: {name: 'Standards Committee', email: config.standardsEmail}};
			mailData = {
				name: req.user.name,
				email: req.user.email,
				phone: req.user.phone,
				address: req.user.address,
				certification: application.certification,
				chemicals: application.chemicals,
				products: application.products
			}
			
			req.user.producerData.certification = application.certification;
			req.user.producerData.chemicalDisclaimer = application.chemicals;
			req.user.save();
			
			
			email = new Emailer(mailOptions, mailData);
			email.send(function(err, result) {
				if (err) {
					console.log(err);
					res.send(500, "form failed to be sent to standards commitee. Reason: " + err);
				}
				else res.send(200, result);
			});
		}
		else if (req.user.user_type.canSell) res.send(403);
		else res.send(401);
	});
	
	//Get and return users as JSON data based on a query. Only really used for the
	//admin to look at all users.
	app.get("/api/user", function(req, res, next) {
		// search for users. if the req.query is blank, all users will be returned.
		models.User.find(req.query, null, {
			sort: {
				_id: 1
			}
		}, function(e, results) {
			if (!e) { // if no errors
				// The transform is called to remove the password data before sending to the client.
				results.forEach(function(user) {
					var userObject = user.toObject();
					delete userObject.hash;
					delete userObject.salt;
				});
				console.log('User just requested from api/user/');
				res.json(results);
			} else {
				console.log(e) // log the error
			}
		});
	});

	// This registers a new user and if no error occurs the user is logged in 
	// A new email is sent to them as well.
	app.post("/api/user", function(req, res, next) {
		var memberEmailOptions, memberEmailData, memberEmail, dueDate, invoice;
		async.waterfall([
			// create the new user and pass the user to the next function
			function(done) {
				var lat, lng;
				if (req.body.address) {
					geocoder.geocode(req.body.address, function ( err, data ) {
						if (data.status === "OK") {
							lat = data.results[0].geometry.location.lat;
							lng = data.results[0].geometry.location.lng;
							done(null, lat, lng)
						} else {
							done(data.status);
						}
					
					});
				}
				else done(null, 0, 0)
			}, function(lat, lng, done) {
				// disable unapproved producers from uploading immediately.
				if (req.body.user_type.canSell) req.body.user_type.canSell = false;
				models.User.register(new models.User({
					dateJoined: Date.today(),
					name: req.body.name,
					email: req.body.email,
					phone: req.body.phone,
					address: req.body.address,
					user_type: req.body.user_type,
					lat: lat,
					lng: lng
				}),
				req.body.password,
				function(e, account) {
					if (!e) {
						done(e, account);
					} else {
						done(e);
					}
				});
			},
			// Create an invoice to be used in the email and also available to the app
			// because it's saved to the database.
			function(user, done) {
				var itemName = 'Customer Membership', cost = config.customerMembership;
				if (user.user_type.name === 'Producer') {
					itemName = 'Producer Membership';
					cost = config.producerMembership;
				}
				//create a promise of a new invoice
				invoice = new models.Invoice({
					datePlaced: Date.today(),
					invoicee: user._id,
					title: 'Membership',
					items: [{name:itemName, cost:req.body.cost}],
					dueDate: Date.today().addDays(30)
				});
					
				memberEmailOptions = {
					template: "new-member",
					subject: 'Welcome to the NNFC online Store',
					to: {
						email: user.email,
						name: user.name
					}
				};
				//send an email invoice
				memberEmailData = {
					name: user.name,
					dueDate: invoice.dueDate,
					code: invoice._id,
					items: invoice.items,
					cost: invoice.total,
					account: config.bankAccount,
					email: user.email,
					password: req.body.password
				};

				memberEmail = new Emailer(memberEmailOptions, memberEmailData);

				memberEmail.send(function(err, result) {
					if (err) {
						done(err, null);
					}
					// a response is sent so the client request doesn't timeout and get an error.
					console.log("Message sent to new member");
					
					done(null, user);
				});
			}
			],
			function(err, user){
				var userObject;
				if (user) {
					// save the invoice made for the user;
					invoice.save(function(err) {
						if (err) return errorHandler(err);
						console.log('Invoice saved');
					});
					// authenticate the newly created user
					passport.authenticate('local', function(err, user, info){
						if (!user) {
							console.log(err);
							res.send(500);
						}
						else {
							req.logIn(user, function(err){
								// req.user should now be assigned
								if (err) console.log(err);
								console.log('this is the logged in user: ')
								console.log(req.user);
								userObject = req.user.toObject();
								delete userObject.salt;
								delete userObject.hash;
								res.send(userObject);
							});
						}
					})(req, res, next);
				}
				else {
					console.log(err)
					res.send(500, err);
				}
			}
		);
	});

	// edit changes to a user including updates their password if they submitted a change.
	app.post("/api/user/:id", function(req, res, next) {
		var mailOptions, mailData, mail, changeOptions, changeData, changeEmail, canSell;
		if (req.user) {
			models.User.findById(req.params.id, function(e, user) {
				if (!e) {
					
					// email the user that their account details were changed
					if (req.body.user_type !== user.user_type) {
						canSell = (req.body.user_type.canSell) ? "can sell products through the co-op website" : "can no longer sell products through the co-op website";
						mailOptions = {template: "user-rights-change", subject: "Your NNFC membership has changed", to: {name: user.name, email: req.body.email}};
						mailData = {name: user.name, message: canSell}
						mail = new Emailer(mailOptions, mailData);
						mail.send(function(err, result) {
							if (err) console.log(err);
						});
					}
					
					// update the database with the user's changes
					for (key in req.body) {
						if (user[key] !== req.body[key] && key !== 'password' && key !== 'oldPassword') {
							user[key] = req.body[key];
						}
					}
					
					

					// if the user is attempting to change their password, this checks if the user
					// remembers their old password and if they do will change it to their requested
					// new password. Admins reset passwords by sending the user a password reset
					// email.
					if (req.body.password && req.body.oldPassword) {
						user.authenticate(req.body.oldPassword, function(e, checksOut) {
							if (checksOut) {
								user.setPassword(req.body.password, function() {
									user.save(function(e) {
										if (!e) {
											changeOptions = { template: "password-change", subject: 'Food Co-op Password Changed', to: { email: user.email, name: user.name }};
											changeData = {name: user.name};
											changeEmail = new Emailer(changeOptions, changeData);
											changeEmail.send(function(err, result) {
												if (err) {
													return console.log(err);
												}
												// a response is sent so the client request doesn't timeout and get an error.
												console.log("Message sent to user confirming password change");
											});
										}
									});
								});
							} else {
								console.log('Old password does not match current password.')
								res.send(400, 'Old password does not match current password.')
							}
						
							delete user.password;
							delete user.oldPassword;
						
						});
					}
					

					// save changes to the user and send the user back to the app.
					user.save();
					res.json(user);
				} else {
					console.log(e);
					res.send(401, "You must be logged in to change data about a user")
				}
				
			});
		}
		else res.send(401);
		
	});

	// return a specific user by ID. This call is made by the admin generally when
	// he is wanting to change permissions of a user.
	app.get("/api/user/:id", function(req, res, next) {
		models.User.findById(req.params.id, function(e, results) {
			if (!e) {
				if (results) {
					var userObject = results.toObject();
					delete userObject.hash;
					delete userObject.salt;
					res.send(results);
				}
				else {
					res.send(404);
				}
				
			} else {
				console.log(e);
			}
		});
	});

	// returns a user by name. This call is designed to return only a producer.
	app.get("/api/user/producer/:producerName", function(req, res, next) {
		if (req.params.producerName) {
			var name = req.params.producerName.split("+");
			name = name.join(' ');
		}
		
		models.User.findOne({
			name: name
		}, null, {
			sort: {
				_id: 1
			}
		}, function(e, results) {
			if (!e && results.user_type.name === 'Producer') {
				res.send(results);
			} else if (results.user_type.name !== 'Producer') {
				res.send(400, results.name + " is not a producer");
			} else {
				console.log(e);
			}
		});
	});

	// updates a producer by ID. This id is generally the logged in user.
	app.post("/api/user/:id/producer/edit", function(req, res, next) {
		if (req.user) {
			models.User.findByIdAndUpdate(req.params.id, {
				producerData: req.body.producerData
			}, function(err, user) {
				console.log('The raw response from Mongo was ', user);
				if (err) return handleError(err);

				else {
					res.json(user);
				}
			});
		} else {
			res.send(401);
		}
	});
	
	// delete a user and all their products and their cart. A user can only delete
	// themself. An admin can delete any user. An email is sent to the user thanking
	// them for their membership and to expect a refund soon. Another email is sent
	// to the NNFC admin to arrange refunds.
	app.delete("/api/user/:id", function(req, res, next) {
		var toUser, toUserOptions, toUserData, toAdmin, toAdminOptions, toAdminData;
		if (req.user._id == req.params.id || req.user.user_type.isAdmin) {
			async.waterfall([
				// look up the user and their membership invoice
				function(done) {
					models.User.findById(req.params.id, function(e, user) {
						if (e) handleError(e);
						if (user) {
							models.Invoice.findOne({ invoicee: new ObjectId(user._id), title: 'Membership'}, function(e, invoice){
								if (e) return handleError(e);
								done(e, user, invoice);
							})
						}
					});
				},
				
				// next send an email to the admin saying this user is being deleted
				function(user, invoice, done) {
					toAdminOptions = {
						template: 'member-leaving',
						subject: user.name + ' wants to leave the NNFC',
						to: mail.companyEmail
					},
					
					toAdminData = {name: user.name};
					
					toAdmin = new Emailer(toAdminOptions, toAdminData);
					
					toAdmin.send(function(err, result){
						if (err) {
							return console.log(err);
						}
						// a response is sent so the client request doesn't timeout and get an error.
						console.log("Message sent to user about leaving the NNFC");
						done(null, user, invoice)
					})
				},
				
				// next we send an email notifying the user they will be re-imbursed for their membership fee
				function(user, invoice, done) {
					if (invoice) {
						toUserOptions = {
							template: "goodbye",
							subject: 'Leaving the NNFC',
							to: {
								email: user.email,
								name: user.name
							}
						};
						
						
						toUserData = {name: user.name, code: invoice._id, items: invoice.items, cost: invoice.total};
						
						toUser = new Emailer(toUserOptions, toUserData);
						toUser.send(function(err, result) {
							if (err) {
								return console.log(err);
							}
							// a response is sent so the client request doesn't timeout and get an error.
							console.log("Message sent to user about leaving the NNFC");
							done(null, user, invoice)
						});
					}
					else {
						//invoice not found
						done(null, user, invoice)
					}
				},
				// make changes to the membership invoice
				function(user, invoice, done) {
					if (invoice) {
						
						invoice.exInvoicee = 'ex-member ' + user.name;
						console.log(invoice)
						invoice.save()
						
						switch (invoice.status) {
						case 'PAID':
							invoice.status = 'To Refund';
							invoice.save();
							break;
						case 'OVERDUE':
							//continue to next case
						case 'un-paid':
							invoice.status = 'CANCELLED';
							invoice.save();
							break;
						default:
						}
						
						console.log(invoice.status);
						done(null, user);
					}
					else done(null, user);
				}, function(user, done) { // add the user to mailing lists
					var params = {
						id: 'e481a3338d',
						email: {email: user.email},
					};
					mc.lists.unsubscribe(params, function(data) {console.log(data); done(null, user)}, done(e));
				}, function (user, done) {
					if (user.user_type.name === 'Producer') {
						// add user to producer list as well;
						params.id = 'f379285252'
						mc.lists.unsubscribe(params, function(data) {console.log(data); done(null, user)}, done(e));
					}
					else {
						done(null, user);
					}
				},
				// delete the user from the database
				function(user, done) {
					//remove an account's cart first
					models.Order.remove({customer: user._id}, function(e) {
						if (e) return handleError(e);
					});
					// then remove an account's products 
					models.Product.remove({producer_ID: user._id}, function(e) {
						if (e) return handleError(e);
					});
					// finally remove the user itself
					models.User.remove({_id: user.id}, function(e) {
						if (e) return handleError(e);
					});	
					console.log('The user and their products and orders are deleted')
					done(null, 'done');
				}
				
				], 
				// if the email sent successfully, delete the user's data
				function(e, result) {
					if (!e && result === 'done') {
						res.send(200);
					}
					else {
						console.log(results);
						res.send(500);
					}
				});
		}
		else {
			res.send(401, "You are not authorized to remove that user");
		}
	});
	
	app.route('/auth/session')
	// check to see if the user is logged in
	.get(function(req, res, next) {
		if (req.user) {
			var userObject = req.user.toObject();
			delete userObject.salt;
			delete userObject.hash;
			res.send(userObject);
		} else {
			res.send(401, 'Not logged in');
		}
	})
	// attempt to log the user in
	.post(function(req, res, next) {
		passport.authenticate('local', function(err, user, info) {
			if (err) { return next(err); }
			if (!user) {
				req.session.messages =  [info.message];
				console.log(req.session.messages);
				return res.send('Failed to authenticate user');
			}
			req.logIn(user, function(err) {
				if (err) { console.log(err); }
				var userObject = req.user.toObject();
				delete userObject.salt;
				delete userObject.hash;
				res.send(userObject);
			});
		})(req, res, next);
	})
	// log the user out and delete their session	
	.delete(function(req, res) {
		if (req.user) {
			req.logout();
			res.send(200, "Successfully Logged out");
		} else {
			res.send(401, "You are not logged in");
		}
	});
	// look for browser sessions when the page refreshes
	app.get('/auth/session/initial', function(req, res, next) {
		if (req.user) {
			var userObject = req.user.toObject();
			delete userObject.salt;
			delete userObject.hash;
			res.send(userObject);
		}
		else res.send("No session saved");	
	});
	
	// Sends an email for resetting a user's password. Token will expires in 1 hour.
	app.post('/api/forgot', function(req, res) {
		async.waterfall([
			// generate a random and probably unique key
			function(done) {
				crypto.randomBytes(20, function(err, buf) {
					var token = buf.toString('hex');
					done(err, token);
				});
			},
			//find the user who has forgotten their password
			function(token, done) {
				models.User.findOne({ email: req.body.email }, function(err, user) {
					if (!user) {
						req.flash('error', 'No account with that email address exists.');
						return res.redirect('#/forgot');
					}
					user.resetPasswordToken = token;
					user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
					console.log('expires in: ' + user.resetPasswordExpires);
					user.save(function(err) {
						done(err, token, user);
					});
				});
			},
			// send the user an email with a link to reset their password
			function(token, user, done) {
				var resetOptions, resetData, resetEmail;
								
				resetOption = {
					template: "reset-password",
					subject: 'Food Co-op Password Reset',
					to: {
						email: user.email,
						name: user.name
					}
				};
				
				resetData = {host: req.headers.host, token: token };

				resetEmail = new Emailer(resetOption, resetData);

				resetEmail.send(function(err, result) {
					if (err) {
						return console.log(err);
					}
					// a response is sent so the client request doesn't timeout and get an error.
					req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
					console.log("Message sent to user for resetting their password");
					done(err, 'done');
				});
			}
			], 
			// if there was no error, redirect the user to the home page
			function(err) {
				if (err) return next(err);
				res.redirect('/#/forgot');
		});
	});
	
	// Get a user to have their password reset
	app.get('/api/reset/:token', function(req,res) {
		models.User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
			if (user) {
				res.json(user);
			}
			else {
				res.send(403, 'Password reset token is invalid or has expired.');
			}
			
		});
	});
	
	// Change a user's password if their token is still valid.
	app.post('/reset/:token', function(req, res) {
		async.waterfall([
			// find and save the user's new password as well as reseting their token values.
			function(done) {
				models.User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
					if (!user) {
						return res.send(401, 'Password reset token is invalid or has expired');
					}
					user.setPassword(req.body.password, function() {
						user.set(resetPasswordToken, undefined);
						user.set(resetPasswordExpires, undefined);

						user.save(function(err) {
							if (err) console.log(err);
							done(err, user);
						});
					});
					
				});
			},
			// send an email to the user informing them of their password being changed.
			function(user, done) {
				var changeOptions, changeData, changeEmail;
								
				changeOptions = {
					template: "password-change",
					subject: 'Food Co-op Password Changed',
					to: {
						email: user.email,
						name: user.name
					}
				};
				
				changeData = {name: user.name};

				changeEmail = new Emailer(changeOptions, changeData);

				changeEmail.send(function(err, result) {
					if (err) {
						return console.log(err);
					}
					// a response is sent so the client request doesn't timeout and get an error.
					console.log("Message sent to user confirming password change");
					req.logIn(user, function(err) {
						user.toObject();
						res.send(user);
					});
					done(err, 'done');
				});
			}
			], function(err, results) {
				console.log(results);
				
		});
	});
	
	// Static stuff, won't be changed by users.
	
	//get the category collection for defining products
	app.get("/api/category", function(req, res, next) {
		models.Category.find(req.query, null, {
			sort: {
				_id: 1
			}
		}, function(e, results) {
			res.json(results)
		})
	});

	// get the certification collection for defining products
	app.get("/api/certification", function(req, res, next) {
		models.Certification.find(req.query, null, {
			sort: {
				_id: 1
			}
		}, function(e, results) {
			res.json(results)
		})
	});
	
	app.get("/api/calendar", function(req, res, next) {
		var calendar = [], nextMonth, twoMonth;
		calendar.push(config.cycle);
		
		nextMonth = config.getCycleDates('t + 1 month');
		twoMonth = config.getCycleDates('t + 2months');
		calendar.push(nextMonth);
		calendar.push(twoMonth);
		calendar.push(scheduler.currentCycle);
		delete calendar[0].cycleIncrementDay;
		delete calendar[1].cycleIncrementDay;
		delete calendar[2].cycleIncrementDay;
		res.send(calendar);
	});

	app.use(express.static(__dirname));
	app.use(errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
	return app;
}
