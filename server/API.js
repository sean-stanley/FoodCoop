var util = require('util')
	, http = require('http')
	, fs = require('fs') // file system
	, url = require('url')
	, path = require('path')
	, async = require('async')
	, _ = require('lodash')
	, bunyan = require('bunyan')
	, crypto = require('crypto')
	, events = require('events')
	, compression = require('compression')
	, express = require('express')// handles routing and such
	, bodyParser = require('body-parser') // creates a req.body object to allow easy access of request data in the api.
	, methodOverride = require('method-override') // an express module for overriding default http methods
	, cookieParser = require('cookie-parser') // an express module for reading, writing and parsing cookies. In the app it is used for session cookies.
	, session = require('express-session') // an express module for creating browser sessions.
	//errorHandler = require('express-error-handler'), // an express module for handling errors in the app.
	, RedisStore = require('connect-redis')(session)
	, favicon = require('serve-favicon')
	, geocoder = require('geocoder') // for geocoding user addresses.
	, mongoose = require('mongoose') // used to connect to MongoDB and perform common CRUD operations with the API.
	, ObjectId = require('mongoose').Types.ObjectId
	
	, models = require('./models') // this file stores the mongoose schema data for our MongoDB database.
	, mail = require('./staticMail') // this file stores some common mail settings.
	, Emailer = require('./emailer') // this is a custom class expanded upon nodemailer to allow html templates to be used for the emails.
	, mailChimp = require('./mailChimp')
	, config = require('./coopConfig') // static methods of important configuration info
	, scheduler = require('./scheduler') // contains scheduled functions and their results
	//oboe = require('oboe'); //JSON streaming and parsing
	, discount = require('./controllers/discount')
	, auth = require('./controllers/auth') // convenience authentication middleware for the app
	, cycle = require('./controllers/cycle')
	, product = require('./controllers/product')
	
	, passport = require('passport') // middleware that provides authentication tools for the API.
	, LocalStrategy = require('passport-local').Strategy; // the passport strategy employed by this API.

require('datejs'); // provides the best way to do date manipulation.

//testing stuff comment out in production
//var test = require('./testEmail.js');

// sets date locality and formats to be for new zealand.
Date.i18n.setLanguage('en-NZ');

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
	app.use(compression());
	// serve the favicon
	app.use(favicon(path.normalize(path.join(__dirname, '../', 'app', 'favicon.ico')) ));
	// here we load the bodyParser and tell it to parse the requests received as json data.
	app.use(bodyParser.json({limit: '50mb'})); 
	// here we initilize the methodOverride middleware for use in the API.
	app.use(methodOverride()); 
	// here we initilize the cookieParser middleware for use in the API.
	app.use(cookieParser('Intrinsic Definability')); 
	app.use(session({ saveUninitialized: true, resave: true, store: new RedisStore(config.redis), secret: 'Intrinsic Definability' }));
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
		  res.header('Access-Control-Allow-Origin', '*');
		  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
		  next();
*/
	
	// this contains the common ways the app sends emails and is accessed in the app from the contact forms.
	app.post('/api/mail', function(req, res, next) {
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
				template: 'contact-form',
				subject: req.body.subject,
				to: mail.companyEmail,
				replyTo: {
					email: req.body.email,
					name: req.body.name
				}
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
			res.status(200).send('Message sent to client');
			
		} else if (req.body.hasOwnProperty('to')) {
			// this case is for when a client is trying to send a message to one of our producer members.
			// the data and objects data are very similar to other cases but here the 'to'
			// property of the options object is populated with data from the client. 
			toProducerOptions = {
				template: 'contact-form',
				subject: req.body.subject,
				to: {
					name: req.body.toName,
					email: req.body.to
				},
				replyTo: {
					email: req.body.email,
					name: req.body.name
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
			res.status(200).send('Message sent to producer');
		} else {
			// here if no message data was received in the request, a response is sent
			// error details will be in the log.
			res.status(403).send(403, 'Improperly formatted message. No message sent');
		}
	});

	// this route looks up products and sends an array of results back to the client.
	app.get('/api/product', function(req, res, next) {		
		//
		models.Product.find(req.query)
		.sort({_id: 1})
		.populate('category', 'name')
		.populate('certification', 'name -_id img')
		.populate('producer_ID', 'name producerData.companyName email')
		//.stream({transform: JSON.stringify})
		
		// oboe( stream )
// 		.node('![*]', function( productsLoadedSoFar ){
// 			res.write(productsLoadedSoFar);
// 		})
// 		.done(function() {
// 			res.end();
// 		});
		
// 		res.write('[');
// 		res.on('data', function (doc) {
// 		  // do something with the mongoose document
// 			//res.write(doc);
// 			res.write(',');
// 		}).on('error', function (err) {
// 		  log.info(err)
// 			res.end()
// 		}).on('close', function () {
// 		  res.end(']');
// 		});
		.exec(function(err, products) {
			if (err) return next(err);
			res.json(products);
		});
	});
	
	// return just one product for editing
	app.param('productId', product.product);
	
	app.get('/api/product/:productId', auth.isLoggedIn, product.show);
	
	app.put('/api/product/', auth.canSell, product.fromBody, product.changePrice, product.updateValidator, product.emailChange, product.quantityChange, product.update);

	// this creates a new product. It is
	// only called from the product-upload page of the app.
	app.post('/api/product', auth.canSell, product.removeID, product.create);

	// this request will delete a product from the database. First we find the
	// requested product.
	app.delete('/api/product/:productId', auth.isLoggedIn, function(req, res, next) {
		var mailData, mailOptions, deleteMail;
		var product = req.product;
			
		if (product.cycle == scheduler.currentCycle._id) {
				
			models.Order.find({cycle: scheduler.currentCycle._id, product: new ObjectId(product._id)})
			.populate('customer', 'name email')
			.populate('product', 'productName variety fullName')
			.exec(function(e, orders){
				if (e) return next(e);
						
				function sendProductNotAvailableEmail(order) {
					var mailOptions, mailData, update;
					mailOptions = {
						template: 'product-delete',
						subject: product.productName + ' has been removed from the NNFC store',
						to: {
							email: order.customer.email,
							name: order.customer.name
						}
					};
					mailData = {
						name: order.customer.name, 
						productName: order.product.fullName
					};
					update = new Emailer(mailOptions, mailData);
					
					update.send(function(err, result) {
						if (err) log.warn(err);
						log.info('message sent about item deletion to %s', order.customer.email);
					});
				}
						
				if (orders.length > 0) {
					async.each(orders, function(order, done) {
						sendProductNotAvailableEmail(order);
						models.Order.findByIdAndRemove(order._id, function(err, order) {
							if (err) return done(err);
							done(null);
						});
					}, function(err) {
						if (err) return next(err);
						product.remove(function(err, product){
							if (err) return next(err);
							res.status(200).send('product deleted');
						});
					});
				} else { // no orders for that product
					product.remove(function(err, product){
						if (err) return next(err);
						else res.status(200).send('product deleted');
					});
				}
			});
		} else { // don't even bother looking for orders just delete the product
			product.remove(function(err, product){
				if (err) return next(err);
				else res.status(200).send('product deleted');
			});
		}
	});
	// return a compact list of all the current user's products.
	app.get('/api/product-list', auth.isLoggedIn, function(req, res, next) {
		models.Product.find(req.query)
		.where('producer_ID').equals(new ObjectId(req.user._id))
		.limit(100)
		.select('productName variety dateUploaded price quantity amountSold units cycle')
		.populate('cycle')
		.sort('cycle.deliveryDay')
		.exec(function(e, products){
			if (e) return next(e);
			res.setHeader('Cache-Control', 'private, no-cache, no-store');
			res.json(products);
		});
	});
	// return a compact list of all the current user's products for the current month.
	app.get('/api/product-list/current', auth.isLoggedIn, function(req, res, next) {
		models.Product.find({
			producer_ID : new ObjectId(req.user._id),
			cycle: scheduler.currentCycle._id
		}, 'productName variety dateUploaded price quantity amountSold units cycle', { sort: {dateUploaded: 1} }, function(e, products) {
			if (e) return next(e);
			res.setHeader('Cache-Control', 'private, no-cache, no-store');
			res.json(products);
		});
	});

	// this request will return orders based on a query. Generally this is used to
	// return all of a month's orders.
	app.get('/api/order', auth.isLoggedIn, function(req, res, next) {

		// finds all the orders requested by the query from the url query.
		models.Order.find(req.query).sort({datePlaced: 1})
		.populate('product', 'fullName price units producer_ID productName variety cycle refrigeration')
		.populate('customer', 'name')
		.populate('supplier', 'name email producerData.companyName')
		.exec( function(e, orders) {
			if (e) return next(e);
			res.json(orders);
		});

	});
	// get the orders made to the currently authenticated producer/supplier
	app.get('/api/order/me', auth.isLoggedIn, function(req, res, next) {
		var opts, orderObject;

			// get all cart orders for the current user.
			// optional query params will select a cycle to sort from
			models.Order.find(req.query).find({supplier: req.user._id}).sort({datePlaced: 1})
			.populate('product', 'fullName price productName variety units')
			.populate('customer', 'name')
			.populate('supplier', 'name email producerData.companyName')
			.exec( function(e, orders) {
				if (e) return next(e);
				res.json(orders);
			});
	});
	// get a suppliers orders for the current cycle grouped by customer
	app.get('/api/order/cycle', auth.isLoggedIn, function(req,res, next){
			async.waterfall([
				function(done) {
					models.Order
					.aggregate().match({cycle: scheduler.currentCycle._id, supplier: req.user._id})
					.group({ _id: '$customer', orders: { $push : {product: '$product', quantity: '$quantity'} }})
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
						done(e, result);
					});
				},
				function(customers, done) {
					models.User.populate(customers, {path: '_id', select: 'name email'}
					, function(e, result){
						done(e, result);
					});
				}
			],function(e, result){
				if (e) return next(e);
				else res.json(result);
			});	
	});
	
	app.get('/api/cart/:user/length', auth.isMe, function(req, res, next) {
			models.Order.count({customer: req.user._id, cycle: scheduler.currentCycle._id}, function(e, count) {
				if (!e) {
					res.send(count.toString());
				}
				else return next(e);
			});
	});
	// get a customer's cart items by using their customer ID as a request parameter.
	app.get('/api/cart/:user', auth.isMe, function(req, res, next) {
		var opts, cartObject;
			// get the cart orders for the current user.
			// req.query is used for finding orders from a specific cycle
			models.Order.find(req.query).find({customer: req.user._id}).sort({datePlaced: 1})
			.populate('product', 'fullName price productName variety')
			.populate('customer', 'name')
			.populate('supplier', 'name email producerData.companyName')
			.exec( function(e, cart) {
				if (!e) {
					res.json(cart);
				} else next(e);
			});
	});
	// update an order from a user's perspective. Only allowed to change quantity
	app.post('/api/cart', auth.isLoggedIn, function(req, res, next) {
		if (scheduler.canShop) {
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
							if ( order.cycle === product.cycle && product.cycle === scheduler.currentCycle._id) {
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
									res.status(403).send('Sorry! Insufficient inventory to add more than ' + (product.quantity - product.amountSold) + ' to your cart' );
								}
							} else {
								res.status(403).send('Sorry! That product cannot be changed at this time. Contact technical support for assistance');
							}
						} else callback(e);
					});
				}
				], 
				function(err) {
					log.info(err);
					next(err);
			});
		} else res.status(403).send('Sorry! It\'s not the right time of the month to add items to your cart.');
		
	});
	// Deletes a specific item from a users own cart and increases the quantity
	// available of that product again.
	app.delete('/api/cart/:id', auth.isLoggedIn, function(req, res, next) {
		// Check if the current user is logged in and their ID in the params matches the
		// id of their user data. If it does, delete that order from the database. Items
		// entered after the end of ordering week can't be changed.
		if (scheduler.canShop) {
			models.Order.findById(req.params.id, function(e, order) {
				if (!e) {
					// make sure only recent orders are being deleted
					if (order.cycle === scheduler.currentCycle._id) {
						// adjust the inventory of the product available
						models.Product.findByIdAndUpdate(order.product, { $inc: {amountSold : order.quantity * -1}}, function(e, product) {
							if (!e) {
								// delete the requested order
								// respond with a basic HTML message
								res.status(200).send('Product removed from cart');
								order.remove(function(e) {
									if (e) log.info(e);
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
		} else res.status(403).send('Sorry! You can\'t make changes to your cart after Shopping Week Closes');
	});
	
	// Creates a new order from the 'add to cart' buttons in the app. Returns the
	// populated order. It creates the order object and subtracts the quantity from
	// the product being purchased inventory.
	app.post('/api/order', auth.isLoggedIn, function(req, res, next) {
		if (scheduler.canShop) {
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
							cycle: scheduler.currentCycle._id
						}, function(e, newOrder) {
							if (!e) {
								callback(null, newOrder);
							}
							else {
								log.info(e);
								next(err);
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
					if (error.message === 'you can\'t buy that many. Insufficient quantity available.') res.status(400).send('That product is sold out');
					else next(err);
				});
			} else res.status(403).send('Sorry, you can\'t try to buy your own products');
		} else res.status(403).send('It\'s not shopping time yet');
	});
	
	app.route('/api/invoice')
	// get all the invoices or a query. Called in the app from the invoices page
	.get(auth.isLoggedIn, function(req, res, next) {
		models.Invoice.find(req.query)
		.sort({_id:-1})
		.populate('invoicee', 'name address phone email -_id')
		.populate('items.customer', 'name email routeTitle')
		.populate('items.product', 'fullName variety productName priceWithMarkup price units')
		.exec(function(e, invoices) {
			if (e) {
				log.info(e);
				res.status(404).send(e);
			}
			else {
				log.info('sending invoices');
				res.json(invoices);
			}
		});
	})
	
	// update an invoice's status
	.put(auth.isAdmin, function(req, res, next) {
		models.Invoice.findByIdAndUpdate(req.body._id, {status: req.body.status}, function(e, invoice){
			if (e) return next(e);
			// Save the time the invoice was modified
			invoice.dateModified = Date();
			invoice.save(function(err) {
				if (err) return next(err);
				res.status(200).end();
			});
		});
	})
	// delete an invoice. The invoice to delete is found in the query param. Ideally only delete cancelled invoices.
	.delete(auth.isAdmin, function(req, res, next) {
		models.Invoice.findByIdAndRemove(req.query.id, function(e, invoice) {
			if (e) return next(e);
			if (invoice) res.status(200).end();
			else res.status(404).end();
		});
	});
	
	// get a query of one specific invoice by id
	app.get('/api/invoice/:id', auth.isAdmin, function(req, res, next) {
		models.Invoice.findById(req.params.id)
		.populate('invoicee', 'name address phone email -_id')
		.populate('items.customer', 'name email routeTitle')
		.populate('items.product', 'fullName variety productName priceWithMarkup price units')
		.exec(function(e, invoice) {
			if (e) return next(e);
			res.json(invoice);
		});
	});
	
	
	//Forward producer application to standards committee.
	app.post('/api/producer-applicaiton', auth.isLoggedIn, function(req, res, next) {
		var application = req.body, mailData, mailOptions, email;

		mailOptions = {template: 'producer-application-form', subject: 'Application form for member '+ req.user.name, 
			to: [
					{name: config.standardsEmail[0].name, email: config.standardsEmail[0].email}, 
					{name: config.standardsEmail[1].name, email: config.standardsEmail[1].email}
			]
		};
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
			if (err) log.info(err);
		});
		res.status(200).end();
	});
	
	app.get('/api/message-board', function(req, res, next) {
		var Message = mongoose.model('Message');
		Message.find().populate('author', 'name').exec(function(err, messages) {
			if (err) return next(err);
			res.json(messages);
		});
	});
	
	//Get and return users as JSON data based on a query. Only really used for the
	//admin to look at all users.
	app.get('/api/user', function(req, res, next) {
		// search for users. if the req.query is blank, all users will be returned.
		models.User.find(req.query).select('-hash -salt -producerData.logo').sort('_id').exec(function(e, results) {
			if (e) return next(e);
			log.info('User just requested from api/user/');
			res.json(results);
		});
	});
	
	app.get('/api/user/route', auth.isAdmin, function(req, res, next) {
		// search for users. if the req.query is blank, all users will be returned.
		models.User.find({$or: [ {routeTitle: {$exists: true} }, {'routeManager.pickupLocation': {$exists: true} } ]}).find(req.query).select('name email routeTitle routeManager address user_type').exec(function(e, results) {
			if (e) return next(e);
			// if no errors
			log.info('Route Users just requested from api/user/route');
			res.json(results);
		});
	});
	
	
	//Get list of producer users for directory
	app.get('/api/user/producer-list', function(req, res, next) {
		models.User.find({'user_type.name' : 'Producer'}).select('producerData.logo producerData.companyName producerData.thumbnail name address addressPermission dateJoined')
		.lean().exec(function(err, producers){
			if (err) next(err);
			else {
				res.json(producers);
			}
		});
	});
	// This registers a new user and if no error occurs the user is logged in 
	// A new email is sent to them as well.
	app.post('/api/user', discount.checkForDiscount, function(req, res, next) {
		var memberEmailOptions, memberEmailData, memberEmail, dueDate, invoice;
		async.waterfall([
			// create the new user and pass the user to the next function
			function(done) {
				var lat, lng;
				if (req.body.address) {
					geocoder.geocode(req.body.address, function ( err, data ) {
						if (data.status === 'OK') {
							lat = data.results[0].geometry.location.lat;
							lng = data.results[0].geometry.location.lng;
							log.info('geocoded address successfully for %s', req.body.name);
							done(null, lat, lng);
						} else {
							log.info('geolocator status is %s and the number of results is %s', data.status, data.results.length);
							done({name: 'ZERO_RESULT', message: 'could not match your address to GPS coordinates. Try removing the rural delivery number as we don\'t need it'}, null);
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
				function(err, account) {
					if (err) return done(err, null);
					log.info('added new user to database');
					done(null, account);
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
				if (req.body.discount && user.user_type.name === 'Customer') invoice.credit = req.body.discount.customer;
				if (req.body.discount && user.user_type.name === 'Producer') invoice.credit = req.body.discount.producer;
				// save the invoice made for the user;
				invoice.save(function(err) {
					if (err) {
						log.warn(err);
						done(err);
					} else log.info('Invoice saved');
					memberEmailOptions = {
						template: 'new-member',
						subject: 'Welcome to the NNFC and Invoice',
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
						password: req.body.password,
						discountCode: req.body.discountCode || '', 
						discount: invoice.credit || ''
					};
					
					memberEmail = new Emailer(memberEmailOptions, memberEmailData);
					memberEmail.send(function(err, result) {
						if (err) {
							log.warn(err);
						}
						log.info('Message sent to new member %s', user.name);
					});
				});
				
				done(null, user);
			}], function(err, user){
				var userObject;
				if (user) {
					var params = {
						id: 'e481a3338d',
						email: {email: user.email},
						merge_vars : {
							FNAME : user.name.substr(0, user.name.indexOf(' ')),
							LNAME : user.name.substr(user.name.indexOf(' ')+1) || '',
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
							return next(err);
						} else {
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
				} else next(err);
			}
		);
	});

	// edit changes to a user including updates their password if they submitted a change.
	app.put('/api/user/:user', auth.isMe, function(req, res, next) {
		var mailOptions, mailData, emailToSend, changeOptions, changeData, changeEmail, canSell, message;
		//might be able to use req.user rather than db lookup here
			models.User.findById(req.params.user, function(e, user) {
				if (e) return next(e);
				var userData = user.toJSON();
				
				// email the user that their account details were changed
				if ( !_.isEqual(req.body.user_type, userData.user_type) ) {
					canSell = (req.body.user_type.canSell) ? 'can sell products through the co-op website' : 'no longer sell products through the co-op website';
					if (req.body.user_type.name !== userData.user_type.name) {
						message = 'You\'re now a ' + req.body.user_type.name + ' member.';
					}
					mailOptions = {template: 'user-rights-change', subject: 'Your NNFC membership has changed', to: [{name: req.body.name, email: req.body.email}, mail.companyEmail]};
					mailData = {name: user.name, canSell: canSell, message: message};
					emailToSend = new Emailer(mailOptions, mailData);
					emailToSend.send(function(err, result) {
						if (err) log.info(err);
					});
				}
				// update the database with the user's changes
				async.each(Object.keys(req.body), function(key, done) {
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
					// do nothing
					done();
				}, function(err) {
					if (err) return next(err);
					user.save();
					if (req.body.password && req.body.oldPassword) {
						req.userPasswordChange = user;
						next();
					} else { // save changes to the user and send OK back to the app.
						res.status(200).end();
					}
				});
			});
	});
	
	// change a user's password
	app.put('/api/user/:user', auth.isMe, function(req, res, next) {
		// if the user is attempting to change their password, this checks if the user
		// remembers their old password and if they do will change it to their requested
		// new password. Admins reset passwords by sending the user a password reset
		// email.
		models.User.findById(req.params.user, function(err, user) {
			if (err) return next(err);
			if (req.body.password && req.body.oldPassword) {
				user.authenticate(req.body.oldPassword, function(e, checksOut) {
					if (checksOut) {
						user.setPassword(req.body.password, function() {
							user.save();
							res.status(200).end();
						
							changeOptions = { template: 'password-change', subject: 'Food Co-op Password Changed', to: { email: user.email, name: user.name }};
							changeData = {name: user.name};
							changeEmail = new Emailer(changeOptions, changeData);
							changeEmail.send(function(err, result) {
								if (err) {
									log.info(err);
								}
								// a response is sent so the client request doesn't timeout and get an error.
								log.info('Message sent to user confirming password change');
							});
						});
					} else {
						log.info('Old password does not match current password.');
						res.status(400).send('Old password does not match your current password.');
					}
				});
			}
		});
		
		
	});

	// return a specific user by ID. This call is made for contacting a user as well as by the admin
	app.get('/api/user/:user', function(req, res, next) {
		models.User.findById(req.params.user, '-hash -salt', function(e, user) {
			if (e) return next(e);
			if (user) {
				res.json(user);
			}
			else {
				res.status(404).end();
			}
		});
	});

	// returns a user by name. This call is designed to return only a producer.
	app.get('/api/user/producer/:producerName', function(req, res, next) {
		var nameParam, companyQuery;
		if (req.params.producerName) {
			nameParam = req.params.producerName.replace(/^-/,'').split('+');
			nameParam = nameParam.join(' ');
		}
		if (req.query.company) {
			companyQuery = req.query.company.split('+');
			companyQuery = companyQuery.join(' ');
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
					res.status(400).send(producer.name + ' is not a producer');
				}
			}
			else {
				next(e);
			}
		});
	});

	// updates a producer by ID. This id is generally the logged in user.
	app.put('/api/user/:user/producer', auth.isMe, function(req, res, next) {
		//log.info('about to search database to update details on %s', req.user.name);
		models.User.findById(req.params.user).select('producerData addressPermission user_type.name').exec(function(err, user) {
			if (err) return next(err);
			
			user.producerData = req.body.producerData;
			user.addressPermission = req.body.addressPermission;
			
			user.save(function(err, user) {
				if (err) log.info(err);
				//console.log('user saved!');
				//console.log(user.producerData.logo);
			});
			
			res.status(200).end();
		});

	});
	
	// delete a user and all their products and their cart. A user can only delete
	// themself. An admin can delete any user. An email is sent to the user thanking
	// them for their membership and to expect a refund soon. Another email is sent
	// to the NNFC admin to arrange refunds.
	app.delete('/api/user/:user', auth.isMe, function(req, res, next) {
		var toUser, toUserOptions, toUserData, toAdmin, toAdminOptions, toAdminData;
		async.waterfall([
			// look up the user and their membership invoice
			function(done) {
				models.User.findById(req.params.user, function(e, user) {
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
					log.info('Message sent to admin about %s leaving the NNFC', user.name);
				});
				done(null, user, invoice);
			},
			
			// next we send an email notifying the user they will be re-imbursed for their membership fee
			function(user, invoice, done) {
				log.info('preparing to send email to user');
				if (invoice) {
					toUserOptions = {
						template: 'goodbye',
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
						log.info('Message sent to %s about leaving the NNFC', user.name);
						
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
	});
	
	app.route('/auth/session')
	// check to see if the user is logged in
	.get(auth.isLoggedIn, function(req, res, next) {
			var userObject = req.user.toObject();
			delete userObject.salt;
			delete userObject.hash;
			res.send(userObject);
			log.info('user %s just logged in', req.user.name);
	})
	// attempt to log the user in
	.post(function(req, res, next) {
		passport.authenticate('local', function(err, user, info) {
			if (err) next(err);
			else if (!user) {
				req.session.messages =  [info.message];
				var error = new Error('Incorrect Login');
				error.status = 401;
				res.status(401).send(error);
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
			res.status(200).send('Successfully Logged out');
		} else {
			res.status(401).send('You are not logged in');
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
		else res.send('No session saved');
	});
	
	app.post('/api/admin/send-invoices', auth.isAdmin, function(req, res) {
		// to do: convert these controller functions to use route error handling.
		scheduler.checkout();
		scheduler.orderGoods();
		res.status(200).end();
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
					template: 'reset-password',
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
						log.info('Message sent to user for resetting their password');
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
					template: 'password-change',
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
					log.info('Message sent to user confirming password change');
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
	app.get('/api/category', function(req, res, next) {
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
	app.get('/api/certification', function(req, res, next) {
		models.Certification.find(req.query, null, {
			sort: {
				_id: 1
			}
		}).lean().exec(function(e, results) {
			if (e) next(e);
			res.json(results);
		});
	});
	
	// get the cycles a product can be uploaded for
	app.get('/api/admin/cycle/future', cycle.future);
	
	app.route('/api/admin/cycle')
		.get(cycle.all)
		.post(auth.isAdmin, cycle.create);
	
	app.param('cycleId', cycle.cycle);
	
	app.route('/api/admin/cycle/:cycleId')
		.get(cycle.show)
		.put(auth.isAdmin, cycle.update)
		.delete(auth.isAdmin, cycle.destroy);
	
	// get the calendar and current cycle for the app to use
	app.get('/api/calendar', function(req, res, next) {
		var calendar = {
			currentCycle : scheduler.currentCycle,
			canShop: scheduler.canShop
		};
		async.parallel([function(done) {
			models.Cycle.findOne({deliveryDay: {$gt: new Date(scheduler.currentCycle.deliveryDay)}})
			.lean().exec(function(err, cycle) {
				if (err) return next(err);
				calendar.nextCycle = cycle;
				done();
			});
		}, function(done) {
			models.Cycle.find({
				deliveryDay: {$gte: Date.today().moveToFirstDayOfMonth().toString() } 
			}).sort('shoppingStart').lean().exec(function(err, cycles) {
				if (err) return next(err);
				calendar.cycles = cycles;
				done();
			});
		}], function(err) {
			res.json(calendar);
		});
	});
	
	// ensure redirects work with tidy and hashBangless URL's
	app.get('*', function(req, res, next){
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
