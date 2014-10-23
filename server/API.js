var util = require('util'),
	http = require('http'),
	fs = require('fs'), // file system
	url = require('url'),
	path = require('path'),
	async = require('async'),
	_ = require('lodash'),
	bunyan = require('bunyan'),
	crypto = require('crypto'),
	events = require('events'),
	compression = require('compression'),
	express = require('express'), // handles routing and such
	bodyParser = require('body-parser'), // creates a req.body object to allow easy access of request data in the api.
	methodOverride = require('method-override'), // an express module for overriding default http methods
	cookieParser = require('cookie-parser'), // an express module for reading, writing and parsing cookies. In the app it is used for session cookies.
	session = require('express-session'), // an express module for creating browser sessions.
	//errorHandler = require('express-error-handler'), // an express module for handling errors in the app.
	RedisStore = require('connect-redis')(session),
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

//testing stuff comment out in production
//var test = require('./testEmail.js');

// sets date locality and formats to be for new zealand.
Date.i18n.setLanguage("en-NZ");

var log = bunyan.createLogger({
	name: 'API', 
	serializers: {
		req: bunyan.stdSerializers.req,
		err: bunyan.stdSerializers.err,
		e: bunyan.stdSerializers.err,
		res: bunyan.stdSerializers.res,
		error: bunyan.stdSerializers.err
	}
});

// This function exports all the routes and configured API so that the web-server file can remain small and compact.
exports.configAPI = function configAPI(app) {
	
	// Middleware
	// ==========
	app.use(compression({threshold: 128}));
	
	// here we load the bodyParser and tell it to parse the requests received as json data.
	app.use(bodyParser.json({limit: '50mb'})); 
	// here we initilize the methodOverride middleware for use in the API.
	app.use(methodOverride()); 
	// here we initilize the cookieParser middleware for use in the API.
	app.use(cookieParser()); 
	app.use(session({ saveUninitialized: true, resave: true, store: new RedisStore, secret: 'Intrinsic Definability' }));
	//app.use(session({saveUninitialized: true, resave: true, secret: 'Intrinsic Definability'}));
	app.use(passport.initialize()); // here we initilize Passport middleware for use in the app to handle user login.
	// here we initilize passport's sessions which expand on the express sessions
	// the ability to have our session confirm if a user is already logged in.
	app.use(passport.session()); 


	// Routes
	// ======
	
	// static routes
	app.use(express.static(path.normalize(path.join(__dirname, '../app'))));
	
	/*
	app.all('*', function(req, res, next) {
		  res.header("Access-Control-Allow-Origin", "*");
		  res.header("Access-Control-Allow-Headers", "X-Requested-With");
		  next();
		 });*/
	
	app.put("*", function(req, res, next) {
		log.info({req: req}, 'PUT attempt just made');
		next();
	});
	
	app.post("*", function(req, res, next) {
		log.info({req: req}, 'POST attempt just made');
		/*
		test.testEmail.send(function(result) {
					log.info(result);
				})*/
		
		next();
	});
	
	// this contains the common ways the app sends emails and is accessed in the app from the contact forms.
	app.post("/api/mail", function(req, res, next) {
		var toMeoptions, toMedata, toClientOptions, toClientData, toMe, toClient, toProducerOtpions, toProducerData;
		// So far form validation has been done client side
		// form validation is extensive and sufficient. However, more validation could
		// be done at a later point just to be safe.
		log.info('sending mail...');
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
				if (err) next(err);
				log.info({result:result});
			});
			toClient.send(function(err, result) {
				if (err) next(err);
				log.info({result:result});
			});
			res.status(200).send("Message sent to client");
			
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
			};
			toProducerData = {
				from: req.body.name,
				subject: req.body.subject,
				email: req.body.email,
				message: req.body.message
			};

			toProducer = new Emailer(toProducerOptions, toProducerData);

			toProducer.send(function(err, result) {
				if (err) next(err);
				log.info({result:result});
			});
			// a response is sent so the client request doesn't timeout and get an error.
			res.status(200).send("Message sent to producer");
		} else {
			// here if no message data was received in the request, a response is sent
			// error details will be in the log.
			res.status(403).send(403, "Improperly formatted message. No message sent");
		}
	});

	// this route looks up products and sends an array of results back to the client.
	app.get("/api/product", function(req, res, next) {
		var opts;
		models.Product.find(req.query)
		.sort({_id: 1})
		.populate('category', 'name')
		.populate('certification', 'name -_id img')
		.populate('producer_ID', 'name producerData.companyName')
		.exec(function(err, product) {
					if (err) return next(err);
					res.send(product);
				});
		
	});
	
	// return just one product for editing or use as a template for another product
	app.get("/api/product/:id", function(req, res, next) {
		if (req.user) {
			models.Product.findById(req.params.id, function(err, product) {
				if (err) return next(err);
				log.info('%s requested by current user', product.fullName);
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
					res.status(404).end();
				}
			});
		}
		else res.status(401).end();
		
	});
	
	

	// this either creates a new product or updates an existing product with data from the req.body. It is
	// usually only called from the product-upload page of the app.
	app.post("/api/product", function(req, res, next) {
		var productObject, needsSave = false, key, newProduct;
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
				// If the product's cycle equals the current cycle, edit an existing product
				if (req.body._id && req.body.cycle === scheduler.currentCycle) {
					models.Product.findById(req.body._id, function(err, product) { // first find the right product by it's ID
						if (err) return next(err);
						var key;
						productObject = product.toObject();
						
						for (key in req.body) {
							if (req.body.hasOwnProperty(key)) {
								if (productObject[key] !== req.body[key]) {
									// compare the values of the database object to the values of the request object.
									product[key] = req.body[key]; // update the product's properties
									needsSave = true;
								}
							}
						}
						// default false
						if (needsSave) {
							product.increment();
							// save the changes
							product.save(function(err, product) {
								if (err) return next(err);
								res.json(product); // send back the changed product to the app as JSON.
							});
						} 
						else {
							res.status(200).send('No changes detected');
						}
					});
				} else {
					models.Product.create({
						dateUploaded: Date(),
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
					}, function(err, product) {
						if (err) return next(err);
						res.status(200).end();
					});
				}
			}
			// gain limited product change options during shopping week
			else if (scheduler.canChange) {
				models.Product.findById(req.body._id, 'price productName variety quantity amountSold description ingredients refrigeration cycle', function(err, product) {
					if (err) return next(err);
					if (scheduler.currentCycle == product.cycle) {
						productObject = product.toObject();
						
						
						if (product.amountSold > req.body.quantity ) {
							var amountToRemove = product.amountSold - req.body.quantity;
							// get orders for products
							models.Order.find({cycle: scheduler.currentCycle, product: product._id})
							.sort('-datePlaced').limit(amountToRemove)
							.populate('customer', 'name email')
							.populate('product', 'productName variety fullName producer_ID')
							.remove(function(err, orders) {
								if (err) return next(err);
								var mailData, mailOptions, update;
								(function repeat(i) {
									if (i < orders.length) {
										mailOptions = {
											template: 'product-not-available',
											subject: orders[i].productName + ' No Longer Available',
											to: {
												email: orders[i].customer.email,
												name: orders[i].customer.name
											}
										};
										mailData = {name: orders[i].customer.name, 
											productName: orders[i].product.fullName, 
											producerID: orders[i].product.producer_ID
										};
										update = new Emailer(mailOptions, mailData);
										
										update.send(function(err, result) {
											if (err) return next(err);
											log.info(result);
											repeat(i + 1);
										});
									}
									else return;
								}(0));
							})
						}
						
						for (var key in req.body) {
							if (req.body.hasOwnProperty('key')) {
								if (productObject[key] !== req.body[key]) {
									// compare the values of the database object to the values of the request object.
									if (key === 'price') {
										if (req.body.price <= productObject.price) {
											product.price = req.body.price;
											needsSave = true;
										}
									}
									else {
										product[key] = req.body[key]; // update the product's properties
										needsSave = true;
									}
								}
							}
						}
						
						if (needsSave) {
							product.increment();
							product.save(function(err, product) {
								if (err) return next(err);
								models.Order.find({cycle: scheduler.currentCycle, product: product._id})
								.populate('customer', 'name email')
								.populate('product', 'productName variety fullName')
								.exec(function(err, orders){
									if (err) return next(err);
									var mailData, mailOptions, update;
									if (orders.length > 0) {
										(function repeat(i) {
											if (i < orders.length) {
												mailOptions = {
													template: 'product-change',
													subject: 'Update to Product you are Ordering',
													to: {
														email: orders[i].customer.email,
														name: orders[i].customer.name
													}
												};
												mailData = {name: orders[i].customer.name, productName: orders[i].product.fullName};
												update = new Emailer(mailOptions, mailData);
												
												update.send(function(err, result) {
													if (err) return next(err);
													log.info(result);
													repeat(i + 1);
												});
											}
											else res.status(200).send('Your product is successfully uploaded');
										}(0));
									}
								});
							});
						}
					}
					else {
						log.info('Failed to edit product. Current cycle: %s and product cycle: %s', scheduler.currentCycle, product.cycle);
						res.status(403).send('Only products from this month can be modified right now.')
					}
				})
			}
			
			else res.status(403).send("It's not the right time of the month to upload products");
			
			
		} else {
			log.info('Unauthorized access attempt to upload product');
			res.status(401).send('Producer not signed in');
		}

	});

	// this request will delete a product from the database. First we find the
	// requested product.
	app.delete("/api/product/:id", function(req, res, next) {
		var mailData, mailOptions, deleteMail;
		// ensure user is logged in to perform this request.		
		if ( req.user && (scheduler.canUpload || scheduler.canChange) ) {
			// delete the product based on it's id
			models.Product.findById(new ObjectId(req.params.id), function(err, product) {
				if (err) return next(err);
				if (product.producer_ID == req.user._id || req.user.user_type.isAdmin) {
					if (product.cycle == scheduler.currentCycle) {
						
						if (scheduler.canChange) {
							models.Order.find({cycle: scheduler.currentCycle, product: product._id})
							.populate('customer', 'name email')
							.populate('product', 'productName variety fullName')
							.exec(function(e, orders){
								var mailData, mailOptions, update
								if (e) return next(e);
								
								if (orders.length > 0) {
									(function repeat(i) {
										if (i < orders.length) {
											mailOptions = {
												template: 'product-delete',
												subject: 'Product you are Ordering is no Longer Available',
												to: {
													email: orders[i].customer.email,
													name: orders[i].customer.name
												}
											};
											mailData = {name: orders[i].customer.name, productName: orders[i].product.fullName};
											deleteMail = new Emailer(mailOptions, mailData);
										
											deleteMail.send(function(err, result) {
												if (err) return next(err);
												// a response is sent so the client request doesn't timeout and get an error.
												log.info(result);
												repeat(i + 1);
											});
										}
										else {
											product.remove(function(err, product){
												if (err) return next(err);
												orders.remove(function(err, orders) {
													if (err) return next(err);
													res.status(200).send('product deleted');
												});
											});
										}
									}(0));
								}
							});
						}
						else {
							product.remove(function(err, product){
								if (err) return next(err);
								else res.status(200).send('product deleted');
							});
						}
					} else res.status(403).send('That product cannot be deleted. It is to be stored for record keeping.');
				} else res.status(403).send('You aren\'t authorized to delete that product');
			});
		}
		else if (!scheduler.canUpload && !scheduler.canChange) res.status(403).send("Drat! Wrong time of the ordering cycle to delete products.");
		else res.status(401).send('Not logged in');
	});

	// return a compact list of all the current user's products.
	app.get("/api/product-list", function(req, res, next) {
		if (req.user) {
			models.Product.find(req.query)
			.where('producer_ID').equals(new ObjectId(req.user._id))
			.select('productName variety dateUploaded price quantity amountSold units')
			.sort('datePlaced')
			.exec(function(e, products){
				if (e) return next(e);
				res.json(products);
			});
		}
		else res.status(401).end();
	});
	// return a compact list of all the current user's products for the current month.
	app.get("/api/product-list/current", function(req, res, next) {
		if (req.user) {
			models.Product.find({
				producer_ID : new ObjectId(req.user._id),
				cycle: scheduler.currentCycle || 0
			}, 'productName variety dateUploaded price quantity amountSold units', { sort: {datePlaced: 1} }, function(e, products) {
				if (e) return next(e);
				res.json(products);
			});
		} else res.status(401).end();
	});
	// return a compact list of all the current user's products for the last month.
	app.get("/api/product-list/recent", function(req, res, next) {
		if (req.user) {
			models.Product.find({
				producer_ID : new ObjectId(req.user._id),
				cycle: scheduler.currentCycle - 1 || 0
			}, 'productName variety dateUploaded price quantity amountSold units', { sort: {datePlaced: 1} },
				function(e, products) {
					if (e) return next(e);
					res.json(products);
			});
		}
		else res.status(401).end();
	});

	// this request will return orders based on a query. Generally this is used to
	// return all of a month's orders.
	app.get("/api/order", function(req, res, next) {
		var order, opts, orderObject;

		// check if the current user is logged in
		if (req.user) {
			// finds all the orders requested by the query from the url query.
			models.Order.find(req.query).sort({datePlaced: 1})
			.populate('product', 'fullName price units producer_ID productName variety')
			.populate('customer', 'name')
			.populate('product.producer_ID', 'name email producerData.companyName')
			.exec( function(e, results) {
				if (e) return next(e);
				res.json(orders);
			});
		} else res.status(401).end();

	});
	// get the orders made to the currently authenticated producer/supplier
	app.get("/api/order/me", function(req, res, next) {
		var opts, orderObject;
		// check if the current user is authenticated
		if (req.user) {
			// get all cart orders for the current user.
			// optional query params will select a cycle to sort from
			models.Order.find(req.query).find({supplier: req.user._id}).sort({datePlaced: 1})
			.populate('product', 'fullName price productName variety units')
			.populate('customer', 'name')
			.populate('supplier', 'name email producerData.companyName')
			.exec( function(e, orders) {
				if (e) return next(e);
				res.json(orders);
				
				// define options for replacing ID's in the order with the appropriate data from
				// other collections. The other collections are specified with the 'ref'
				// property in the collections' Schema object.
				

				// replace the ID's in an order with proper values before sending to the app.
				// @results is the results returned from the Order Query
				// @opts is the array of options for the populate method to use.
				// @e is the error
				// @cart is the returned array or object of order data
			/*
				models.Order.populate(results, opts, function(e, orders) {
								// send the results to the app if no error occurred.
								if (e) return next(e);
								res.json(orders);
							});*/
			
			});
		}
		else res.status(401).end();
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
						done(e, customers);
					});
				},
				function(customers, done) {
					models.Product.populate(customers, {path: 'orders.product', select: 'fullName price units productName variety'}
					, function(e, result){
						_.map(result, function(producer) {
							producer.orders = _.sortBy(producer.orders, function(order) {
								return order.product.fullName.toLowerCase();
							});
							return producer;
						});
						done(null, result);
					});
				},
				function(customers, done) {
					models.User.populate(customers, {path: '_id', select: 'name email'}
					, function(e, result){
						done(null, result);
					});
				}
			],function(e, result){
				if (e) return next(e);
				else res.json(result);
			});	
		}
		else res.status(401).end();
	});
	
	app.get("/api/cart/:user/length", function(req, res, next) {
		if (req.user && req.user._id == req.params.user) {
			models.Order.count({customer: req.user._id, cycle: scheduler.currentCycle}, function(e, count) {
				if (!e) {
					log.info('the count is %n', count);
					res.send(count.toString());
				}
				else return next(e);
			});
		}
	});
	// get a customer's cart items by using their customer ID as a request parameter.
	app.get("/api/cart/:user", function(req, res, next) {
		var opts, cartObject;
		// check if the current user is logged in and is requesting his or her own cart.
		// Server-side validation.
		if (req.user && req.user._id == req.params.user) {
			// get the cart orders for the current user.
			// req.query is used for finding orders from a specific cycle
			models.Order.find(req.query).find({customer: req.user._id}).sort({datePlaced: 1})
			.populate('product', 'fullName price productName variety')
			.populate('customer', 'name')
			.populate('supplier', 'name email producerData.companyName')
			.exec( function(e, cart) {
				if (!e) {
					res.json(cart);
					// define options for replacing ID's in the order with the appropriate data from
					// other collections. The other collections are specified with the 'ref'
					// property in the collections' Schema object.
					/*
					opts = [{
											path: 'product',
											select: 'fullName price productName variety'
										}, {
											path: 'customer',
											select: 'name'
										}, {
											path: 'supplier',
											select: 'name email producerData.companyName'
										}];*/
					

					// replace the ID's in an order with proper values before sending to the app.
					// @results is the results returned from the Order Query
					// @opts is the array of options for the populate method to use.
					// @e is the error
					// @cart is the returned array or object of order data
					/*
					models.Order.populate(results, opts, function(e, cart) {
											// send the results to the app if no error occurred.
											if (!e) {
												// quick test we got the right cart items
												cart.forEach(function(item) {
													if (item.customer.name !== req.user.name) {
														log.info('these cart items are not for the right user');
													}
												});
												// converts and transforms the cart data into plain javascript before sending it
												// to the client.
												res.json(cart);
											} else log.info(e);
										});*/
					
				} else next(e);
			});
		}
		else res.status(401).end();
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
							callback(e);
						}
					});
				},
				function(oldQuantity, newQuantity, order, callback) {
					models.Product.findById(order.product, 'quantity amountSold cycle', function(e, product) {
						if (!e) {
							// make sure we are changing an order for the current cycle and a current product
							if ( order.cycle === product.cycle && product.cycle === scheduler.currentCycle) {
								if ( product.quantity >= (product.amountSold - oldQuantity + newQuantity) ) {
									product.amountSold = product.amountSold - oldQuantity + newQuantity;
									order.quantity = newQuantity;
									product.save(function(err) {
										if (err) log.info(err);
										else order.save(function(err) {
											if (err) log.info(err);
											else res.status(200).end();
										});
									});
								}
								
								else {
									res.status(403).send("Sorry! Insufficient inventory to add more than " + (product.quantity - product.amountSold) + " to your cart" );
								}
							}
							else {
								res.status(403).send("Sorry! That product cannot be changed at this time. Contact technical support for assistance");
							}
						}
						else {
							callback(e);
						}
					});
				}
				], 
				function(err) {
					log.info(err);
					next(err)
			});
		}
		else res.status(403).end();
		
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
						// adjust the inventory of the product available
						models.Product.findByIdAndUpdate(order.product, { $inc: {amountSold : order.quantity * -1}}, function(e, product) {
							if (!e) {
								// delete the requested order
								order.remove(function(e) {
									if (e) log.info(e);
									// respond with a basic HTML message
									res.status(200).send('Product removed from cart');
								});
							}
						});
					}
					else {
						log.info('%s failed to delete an item from their cart because it\'s the wrong cycle', req.user.name);
						res.status(403).send('Sorry you cannot delete orders from previous cycles');
					}
				}
			});
		}
		else res.status(401).end();
	});
	
	// Creates a new order from the 'add to cart' buttons in the app. Returns the
	// populated order. It creates the order object and subtracts the quantity from
	// the product being purchased inventory.
	app.post("/api/order", function(req, res, next) {
		if (req.user && scheduler.canShop) {
			if (req.body.customer !== req.body.supplier) {
				async.waterfall([
					function(callback) {
						models.Product.findByIdAndUpdate(req.body.product, { $inc: {amountSold : req.body.quantity}})
						.select('amountSold quantity variety productName fullName')
						.exec(function(e, product) {
							if (!e) {
								log.info('product %s has %s/%s remaining', product.fullName, product.amountSold, product.quantity);
								if (product.quantity >= product.amountSold) {
									callback(null);
								}
								else {
									product.amountSold -= req.body.quantity;
									product.save(function(err) {
										if (err) log.info(err);
										var error = new Error('you can\'t buy that many. Insufficient quantity available.');
										callback(error);
									});
								}
							}
							else callback(e);
						});
					},
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
								log.info(e);
								next(err)
								callback(e);
							}
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
					log.info(error); 
					if (error.message === 'you can\'t buy that many. Insufficient quantity available.') res.status(400).send("That product is sold out");
					else next(err) 
				});
			}
			else res.status(403).send("Sorry, you can't try to buy your own products");
		} else { // error handling 
			if (!scheduler.canShop) res.status(403).send("It's not shopping time yet");
			else res.status(401).send("Not logged in");
		}
	});
	
	// get all the invoices or a query. Called in the app from the invoices page
	app.get("/api/invoice", function(req, res, next) {
		// very slow request for some reason
		if (req.user) {
			models.Invoice.find(req.query)
			//.sort({_id:1})
			.populate('invoicee', 'name address phone email -_id')
			.populate('items.customer', 'name email routeTitle')
			.populate('items.product', 'fullName variety productName priceWithMarkup price units')
			.exec(function(e, invoices) {
				if (e) {
					log.info(e);
					res.status(404).send();
				}
				else {
					log.info('sending invoices');
					res.send(invoices);
				}
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
			res.status(202).end();
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
		//if (req.user && !req.user.user_type.canSell) {
		if (req.user) {
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
			};
			
			req.user.producerData.certification = application.certification;
			req.user.producerData.chemicalDisclaimer = application.chemicals;
			req.user.save();
			
			
			email = new Emailer(mailOptions, mailData);
			email.send(function(err, result) {
				if (err) {
					log.info(err);
				}
			});
			res.status(200).end();
		}
		//else if (req.user.user_type.canSell) res.status(403).send('You are already approved to sell through the food co-op');
		else res.status(401).end();
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
					if ( userObject.producerData.hasOwnProperty('logo') ) {
						delete userObject.producerData.logo;
					}
				});
				log.info('User just requested from api/user/');
				res.json(results);
			} else {
				log.info(e); // log the error
			}
		});
	});
	
	
	//Get list of producer users for directory
	app.get('/api/user/producer-list', function(req, res, next) {
		models.User.find({'user_type.name' : 'Producer'}).select('producerData.logo producerData.companyName name address addressPermission dateJoined')
		.lean().exec(function(err, producers){
			if (err) next(err);
			else {
				res.send(producers);
			}
		})
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
							log.info('geocoded address successfully for %s', req.body.name);
							done(null, lat, lng);
						} else {
							log.info(data.status);
							done(data.status, null);
						}
					});
				}
				else done(null, 0, 0);
			}, function(lat, lng, done) {
				// disable unapproved producers from uploading immediately.
				if (req.body.user_type.canSell) req.body.user_type.canSell = false;
				// if (req.body.user_type.name === 'Producer') req.body.user_type.canSell = true;
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
						log.info('added new user to database');
						done(null, account);
					} else {
						done(e, null);
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
					items: [{name:itemName, cost:cost}],
					dueDate: Date.today().addDays(30)
				});
				// save the invoice made for the user;
				invoice.save(function(err, invoice) {
					if (err) log.info(err);
					log.info('Invoice saved');
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
							log.warn(err);
						}
						log.info("Message sent to new member %s", user.name);
					});
				});
				
				done(null, user);
			}
			],
			function(err, user){
				var userObject;
				if (user) {
					var params = {
						id: 'e481a3338d',
						email: {email: user.email},
						merge_vars : {
							FNAME : user.name.substr(0, user.name.indexOf(" ")),
							LNAME : user.name.substr(user.name.indexOf(" ")+1) || '',
							USER_TYPE : user.user_type.name,
							ADDRESS : user.address,
							PHONE : user.phone
						}
					};
					//subscribe user to mailChimp
					mc.lists.subscribe(params, function(result) {log.info(result);}, function(err) {
						log.info(err);
					});
					// authenticate the newly created user
					passport.authenticate('local', function(err, user, info){
						if (!user) {
							log.info(err);
							return next(err);
						}
						else {
							req.logIn(user, function(err){
								// req.user should now be assigned
								if (err) log.info(err);
								userObject = req.user.toObject();
								delete userObject.salt;
								delete userObject.hash;
								res.send(userObject);
							});
						}
					})(req, res, next);
				}
				else {
					log.info(err);
					next(err);
				}
			}
		);
	});

	// edit changes to a user including updates their password if they submitted a change.
	app.put("/api/user/:id", function(req, res, next) {
		var mailOptions, mailData, mail, changeOptions, changeData, changeEmail, canSell;
		if (req.user._id == req.paramas.id || req.user.user_type.isAdmin) {
			models.User.findById(req.params.id, function(e, user) {
				if (!e) {
					
					var userData = user.toJSON();
					
					// email the user that their account details were changed
					if ( !_.isEqual(req.body.user_type, userData.user_type) ) {
						canSell = (req.body.user_type.canSell) ? "can sell products through the co-op website" : "can no longer sell products through the co-op website";
						mailOptions = {template: "user-rights-change", subject: "Your NNFC membership has changed", to: {name: user.name, email: req.body.email}};
						mailData = {name: user.name, message: canSell};
						mail = new Emailer(mailOptions, mailData);
						mail.send(function(err, result) {
							if (err) log.info(err);
						});
					}
					
					// update the database with the user's changes
					for (var key in req.body) {
						if (userData[key] !== req.body[key] && key !== 'password' && key !== 'oldPassword') {
							// rule out strings and numbers so we know to do a deep comparison
							if (_.isObject(req.body[key]) && _.isObject(userData[key]) ) { 
								// deep comparison
								if ( !_.isEqual(userData[key], req.body[key]) ) {
									user[key] = req.body[key];
								}
							}
							// most likely string or number so this operation is safe
							else user[key] = req.body[key];
							
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
													return log.info(err);
												}
												// a response is sent so the client request doesn't timeout and get an error.
												log.info("Message sent to user confirming password change");
											});
										}
									});
								});
							} else {
								log.info('Old password does not match current password.');
								res.status(400).send('Old password does not match current password.');
							}
						
							delete user.password;
							delete user.oldPassword;
						
						});
					}
					

					// save changes to the user and send OK back to the app.
					user.save();
					res.status(200).end();
				} else {
					log.info(e);
					res.status(401).send("You must be logged in to change data about a user");
				}
				
			});
		}
		else res.status(401).end();
		
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
					res.status(404).end();
				}
				
			} else {
				log.info(e);
			}
		});
	});

	// returns a user by name. This call is designed to return only a producer.
	app.get("/api/user/producer/:producerName", function(req, res, next) {
		var nameParam, companyQuery;
		if (req.params.producerName) {
			nameParam = req.params.producerName.split("+");
			nameParam = nameParam.join(' ');
		}
		if (req.query.company) {
			companyQuery = req.query.company.split("+");
			companyQuery = companyQuery.join(" ");
		} else companyQuery = null;
		
		models.User.findOne({
			name: nameParam,
			'producerData.companyName' : companyQuery
		})
		.sort({_id: 1}).select('producerData name phone email address addressPermission user_type.name')
		.lean()
		.exec(function(e, producer) {
			if (producer) {
				log.info('%s of %s\'s page is being requested.', producer.name, producer.producerData.companyName);
				if (!e && producer.user_type.name === 'Producer') {
					res.send(producer);
				} else if (producer.user_type.name !== 'Producer') {
					res.status(400).send(producer.name + " is not a producer");
				}
			}
			else {
				next(e);
			}
		});
	});

	// updates a producer by ID. This id is generally the logged in user.
	app.put("/api/user/:id/producer", function(req, res, next) {
		if (req.user) {
			log.info('about to search database to update details on %s', req.user.name);
			models.User.findByIdAndUpdate(req.params.id, {
				producerData: req.body.producerData,
				addressPermission: req.body.addressPermission
			}, function(err, user) {
				
				if (err) next(err);

				else {
					log.info('%s successfully updated', user.name);
					res.status(200).end();
				}
			});
		} else {
			res.status(401).end();
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
						if (e) done(e);
						log.info('preparing to delete user %s', user.name);
						if (user) {
							models.Invoice.findOne({ invoicee: new ObjectId(user._id), title: 'Membership'}, function(e, invoice){
								if (e) done(e);
								done(null, user, invoice);
							});
						}
					});
				},
				
				// next send an email to the admin saying this user is being deleted
				function(user, invoice, done) {
					log.info('preparing to send email to admin');
					toAdminOptions = {
						template: 'member-leaving',
						subject: user.name + ' wants to leave the NNFC',
						to: mail.companyEmail
					};
					
					toAdminData = {name: user.name};
					
					toAdmin = new Emailer(toAdminOptions, toAdminData);
					
					toAdmin.send(function(err, result){
						if (err) {
							log.info(err);
						}
						// a response is sent so the client request doesn't timeout and get an error.
						log.info("Message sent to admin about %s leaving the NNFC", user.name);
					});
					done(null, user, invoice);
				},
				
				// next we send an email notifying the user they will be re-imbursed for their membership fee
				function(user, invoice, done) {
					log.info('preparing to send email to user');
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
								return log.info(err);
							}
							// a response is sent so the client request doesn't timeout and get an error.
							log.info("Message sent to %s about leaving the NNFC", user.name);
							
						});
						done(null, user, invoice);
					}
					else {
						//invoice not found
						done(null, user, invoice);
					}
				},
				// make changes to the membership invoice
				function(user, invoice, done) {
					if (invoice) {
						log.info('cancelling %s membership invoice', user.name);
						
						invoice.exInvoicee = 'ex-member ' + user.name;
						invoice.save();
						
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
						done(null, user);
					}
					else done(null, user);
				}, function(user, done) { // remove the user from mailing lists
					log.info('attempting to remove %s from mailchimp list', user.name);
					var params = {
						id: 'e481a3338d',
						email: {email: user.email},
					};
					mc.lists.unsubscribe(params, function(data) {log.info({result: data});}, function(error) {
						log.info(error);
					});
					done(null, user, params);
					
				}, function (user, params, done) {
					if (user.user_type.name === 'Producer') {
						log.info('attempting to remove user from producer mailchimp list');
						// remove the user from producer list as well;
						params.id = 'f379285252';
						mc.lists.unsubscribe(params, function(data) {log.info({result: data});}, function(error) {
							log.info(error);
						});
						done(null, user);
					}
					else {
						done(null, user);
					}
				},
				// delete the user from the database
				function(user, done) {
					//remove an account's cart first
					models.Order.remove({customer: user._id}, function(e) {
						if (e) done(e);
					});
					// then remove an account's products 
					models.Product.remove({producer_ID: user._id}, function(e) {
						if (e) done(e);
					});
					// finally remove the user itself
					models.User.remove({_id: user.id}, function(e) {
						if (e) done(e);
					});	
					log.info('The user and their products and orders are deleted');
					done(null);
				}
				
				], 
				// if the email sent successfully, delete the user's data
				function(e, result) {
					if (!e) {
						res.status(200).end();
					}
					else {
						next(e);
					}
				});
		}
		else {
			res.status(401).send("You are not authorized to remove that user");
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
			log.info('user %s just logged in', req.user.name);
		} else {
			log.info('failed login attempt');
			res.status(401).send('Not logged in');
		}
	})
	// attempt to log the user in
	.post(function(req, res, next) {
		passport.authenticate('local', function(err, user, info) {
			if (err) next(err);
			else if (!user) {
				req.session.messages =  [info.message];
				var error = new Error('Incorrect Login');
				error.status = 401;
				next(error);
			}
			else {
				req.logIn(user, function(err) {
					if (err) next(err);
					var userObject = req.user.toObject();
					delete userObject.salt;
					delete userObject.hash;
					res.send(userObject);
				});
			}
		})(req, res, next);
	})
	// log the user out and delete their session	
	.delete(function(req, res) {
		if (req.user) {
			req.logout();
			res.status(200).send("Successfully Logged out");
		} else {
			res.status(401).send("You are not logged in");
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
						log.warn('failed to reset password for %s', req.body.email);
						res.status(404).send('Error! No account with that email address exists.');
					} else {
						user.resetPasswordToken = token;
						user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
						log.info('reset token expires in: ' + user.resetPasswordExpires);
						user.save(function(err) {
							done(err, token, user);
						});
					}
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
						log.info(err);
					} else {
						log.info("Message sent to user for resetting their password");
					}
					
				});
				done(null, 'done');
			}
			], 
			// if there was no error, redirect the user to the home page
			function(err) {
				if (err) return next(err);
				res.send('Your password reset instructions have been emailed to you.');
		});
	});
	
	// Get a user to have their password reset
	app.get('/api/reset/:token', function(req,res) {
		models.User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })
		.select('email name resetPasswordToken').exec(function(err, user) {
			if (user) {
				res.json(user);
			}
			else {
				res.status(403).send('Password reset token is invalid or has expired.');
			}
		});
	});
	
	// Change a user's password if their token is still valid.
	app.post('/reset/:token', function(req, res) {
		async.waterfall([
			// find and save the user's new password as well as reseting their token values.
			function(done) {
				models.User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, '-producerData', function(err, user) {
					if (!user) {
						log.info('Password reset token is invalid or has expired');
						res.status(403).send('Password reset token is invalid or has expired');
					}
					else {
						
						user.setPassword(req.body.password, function() {
							log.info({user: user}, '%s is having their password changed', user.name);
							user.set('resetPasswordToken', undefined);
							user.set('resetPasswordExpires', undefined);

							user.save(function(err) {
								if (err) next(err);
							});
							done(null, user);
						});
					}
					
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
						return next(err);
					}
					// a response is sent so the client request doesn't timeout and get an error.
					log.info("Message sent to user confirming password change");
				});
				req.logIn(user, function(err) {
					user.toObject();
					res.send(user);
				});
				done(null, 'done changing password for user');
			}
			], function(err, results) {
				if (err) next(err);
				log.info(results);
				
		});
	});
	
	// Static stuff, won't be changed by users.
	
	//get the category collection for defining products
	app.get("/api/category", function(req, res, next) {
		models.Category.find(req.query, null, {
			sort: {
				_id: 1
			}
		}).lean().exec(function(e, results) {
			if (e) next(e);
			res.json(results);
		});
	});

	// get the certification collection for defining products
	app.get("/api/certification", function(req, res, next) {
		models.Certification.find(req.query, null, {
			sort: {
				_id: 1
			}
		}).lean().exec(function(e, results) {
			if (e) next(e);
			res.json(results);
		});
	});
	
	app.get("/api/calendar", function(req, res, next) {
		var calendar = [], nextMonth, twoMonth;

		nextMonth = config.getCycleDates('t + 1 month');
		twoMonth = config.getCycleDates('t + 2months');
		
		calendar.push(config.cycle); // 0
		calendar.push(nextMonth); // 1
		calendar.push(twoMonth); // 2
		calendar.push(scheduler.currentCycle); // 3
		calendar.push(scheduler.canUpload); // 4
		calendar.push(scheduler.canShop); // 5
		calendar.push(scheduler.canChange) // 6
		delete calendar[0].cycleIncrementDay;
		delete calendar[1].cycleIncrementDay;
		delete calendar[2].cycleIncrementDay;
		res.send(calendar);
	});
	
	// ensure redirects work with tidy and hashBangless URL's
	app.get("*", function(req, res, next){
		//log.info({req: req}, 'attempting to send main app/index.html file');
		res.sendFile(path.normalize(path.join(__dirname, '../app/index.html')));
	});
	
	//app.use(express.static(__dirname));
	
	// Error Handling
	
	//Log errors
	app.use(function(err, req, res, next) {
		log.warn({err: err}, 'Oops, an error occurred and was not caught by the API.');
		next(err);
	});
	
	//Respond with 500
	app.use(function(err, req, res, next) {
		res.status(500).send(err);
	});

	return app;
};
