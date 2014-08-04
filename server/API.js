var util = require('util'),
	http = require('http'),
	fs = require('fs'), // file system
	url = require('url'),
	async = require('async'),
	crypto = require('crypto'),
	events = require('events'),
	express = require('express'); // handles routing and such
bodyParser = require('body-parser'), // creates a req.body object to allow easy access of request data in the api.
methodOverride = require('method-override'), // an express module for overriding default http methods
cookieParser = require('cookie-parser'), // an express module for reading, writing and parsing cookies. In the app it is used for session cookies.
flash = require('connect-flash'),
session = require('express-session'), // an express module for creating browser sessions.
errorHandler = require('express-error-handler'), // an express module for handling errors in the app.
mongoose = require('mongoose'), // used to connect to MongoDB and perform common CRUD operations with the API.
models = require('./models.js'), // this file stores the mongoose schema data for our MongoDB database.
mail = require('./staticMail.js'), // this file stores some common mail settings.
Emailer = require('./emailer.js'), // this is a custom class expanded upon nodemailer to allow html templates to be used for the emails.
passport = require('passport'), // middleware that provides authentication tools for the API.
LocalStrategy = require('passport-local').Strategy; // the passport strategy employed by this API.

require('datejs'); // provides the best way to do date manipulation.

// sets date locality and formats to be for new zealand.
Date.i18n.setLanguage("en-NZ");


// This function exports all the routes and configured API so that the web-server file can remain small and compact.
exports.configAPI = function configAPI(app) {
	
	// Middleware
	// ==========
	app.use(bodyParser.json()); // here we load the bodyParser and tell it to parse the requests received as json data.
	app.use(methodOverride()); // here we initilize the methodOverride middleware for use in the API.
	app.use(cookieParser('Intrinsic Definability')); // here we initilize the cookieParser middleware for use in the API.
	app.use(session({cookie: { maxAge: 60000 }, saveUninitialized: true, resave: true}));
	app.use(flash()); // here we initilize the flash middleware for use in the API.
	app.use(passport.initialize()); // here we initilize Passport middleware for use in the app to handle user login.
	app.use(passport.session()); // here we initilize passport's sessions which expand on the express sessions the ability to have our session confirm if a user is already logged in.


	// Routes
	// ======
	
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
		} else if (req.body.hasOwnProperty('to')) {
			// this case is for when a client is trying to send a message to one of our producer members.
			// the data and objects data are very similar to other cases but here the 'to'
			// property of the options object is populated with data from the client. 

			var

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
					return console.log(err);
				}
				// a response is sent so the client request doesn't timeout and get an error.
				console.log("Message sent to producer");
				res.send("text/plain", "Message sent to producer");
			});

		} else {
			// here if no message data was received in the request, a response is sent
			// detailing what happened.
			res.send("text/plain", "No messages sent");
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
					select: 'name -_id'
				}, {
					path: 'producer_ID',
					select: 'name -_id'
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

	// this either creates a new product or updates an existing product with data from the req.body. It is
	// usually only called from the product-upload page of the app.
	app.post("/api/product", function(req, res, next) {
		var productObject, needsSave, key, newProduct;

		if (req.user) {
			// this tests if a user is authenticated.
			if (req.body._id) {
				// If the body for a product contains an ID, it must already exist so we will
				// update it. Ideally only an admin or the user who
				// created a product can update it. The original product is looked up by id.

				models.Product.findById(req.body._id, function(e, product) { // first find the right product by it's ID
					if (!e) {
						productObject = product.toObject();
						needsSave = false;
						for (key in req.body) {
							if (productObject[key] !== req.body[key]) {
								// compare the values of the database object to the values of the request object.
								console.log("we are now replacing the old product's " + key + " which evaluates to: " + productObject[key] + " with the new value of: " + req.body[key]);
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
		} else {
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
			models.Product.remove({
				id: req.body._id
			}, function(e, results) {
				if (!e) { // if no errors
					console.log(results);
					res.send('text/plain', 'product deleted');
				} else {
					console.log(e) // log the error
				}
			});
		} else {
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
			models.Order.find(req.query, null, {
				sort: {
					datePlaced: 1
				}
			}, function(e, results) {
				console.log(results);
				if (!e) { // if no errors

					// define options for replacing ID's in the order with the appropriate data from other collections
					opts = [{
						path: 'product',
						model: 'models.Product',
						select: 'name variety price producer_ID'
					}, {
						path: 'customer',
						model: 'models.User',
						select: 'name'
					}, {
						path: 'product.producer_ID',
						model: 'models.User',
						select: 'name email producerData'
					}];

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
						} else console.log(e);

					});

				} else {
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
			models.Order.find({
				customer: req.params.id
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
						select: 'name variety price producer_ID'
					}, {
						path: 'customer',
						select: 'name'
					}, {
						path: 'product.producer_ID',
						select: 'name email producerData'
					}];

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
						} else console.log(e);
					});
				} else console.log(e);
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
			models.Order.find({
				customer: req.params.id
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
						select: 'name variety price producer_ID'
					}, {
						path: 'customer',
						select: 'name'
					}, {
						path: 'product.producer_ID',
						select: 'name email producerData'
					}];

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
						} else console.log(e);
					});
				} else console.log(e);
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

	// Deletes a specific item from a users own cart.
	app.delete("/api/cart/:id/:product", function(req, res, next) {
		// Check if the current user is logged in and their ID in the params matches the
		// id of their user data. If it does, delete that item from the cart. Items
		// entered after the end of ordering week can't be changed.
		if (req.user && req.user._id === req.params.id) {
			// if (calendar.orderweek) ...
			models.Order.remove({
				product: req.params.product
			}, function(e) {
				if (!e) {
					res.send(200, 'Product removed from cart')
				}

			})
		}
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
					user.toObject();
				});

				res.json(results);
			} else {
				console.log(e) // log the error
			}
		});
	});

	// This registers a new user and if no error occurs the user is logged in and
	// redirected to the home page.
	// A new email is sent to them as well.
	app.post("/api/user", function(req, res, next) {
		var memberEmailOptions, memberEmailData, memberEmail, dueDate, invoice, invoiceTotal;

		models.User.register(new models.User({
				dateJoined: Date.now(),
				name: req.body.name,
				email: req.body.email,
				phone: req.body.phone,
				address: req.body.address,
				user_type: req.body.user_type
			}),
			req.body.password,
			function(e, account) {
				if (!e) {
					// Count the total number of invoices and create a new one with an _id equal to
					// the total++. The invoice is used in the email and also available to the app
					// once it's saved to the database.
					models.Invoice.count(function(e, count) {
						var newTotal, itemName
						invoiceTotal = count;
						newTotal = count++;
						dueDate = Date.today().addDays(31);
						
						if (req.body.user_type.name === 'Producer') {
							
							itemName = 'Producer Membership'
						}
						else itemName = 'Customer Membership'
						
						invoice = models.Invoice.create({
							_id: newTotal,
							recipient: req.body.name,
							items: [{name:itemName, cost:req.body.cost}],
							dueDate: dueDate
						});
					});
					
					
					
					// authenticate the newly created user
					passport.authenticate('local')(request, result, function() {
						
						//Once the new invoice has been made, send an email containing the invoice.
						invoice.then(function(invoice){
							memberEmailOptions = {
								template: "new-member",
								subject: 'Welcome to the NNFC online Store',
								to: account.email
							};
							
							memberEmailData = {
								name: req.body.name,
								dueDate: invoice.dueDate,
								code: invoice._id,
								items: invoice.items,
								email: req.body.email,
								password: req.body.password
							};

							memberEmail = new Emailer(memberEmailOptions, memberEmailData);

							memberEmail.send(function(err, result) {
								if (err) {
									return console.log(err);
								}
								// a response is sent so the client request doesn't timeout and get an error.
								console.log("Message sent to new member");
							});
							
						});
						// send the newly logged in user to the home screen
						result.redirect('/');
					});
				} else {
					console.log(e);
					console.log(account);
					res.send(500, 'Server error occured. Check the log for details');
				}
			}
		);
	});

	// edit changes to a user including updates their password if they submitted a change.
	app.post("/api/user/:id", function(req, res, next) {
		models.User.findById(req.params.id, function(e, user) {
			if (!e && req.user) {
				var userObject = user.toObject();
				for (key in req.body) {
					if (user[key] !== req.body[key] && key !== 'password' && key !== 'oldPassword') {
						console.log("we are now replacing the old user's " + key + " which evaluates to: " + user[key] + " with the new value of: " + req.body[key]);
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
								var changeOptions, changeData, changeEmail;
								user.save(function(e) {
									if (!e) {
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
	});

	// return a specific user by ID. This call is made by the admin generally when
	// he is wanting to change permissions of a user.
	app.get("/api/user/:id", function(req, res, next) {
		models.User.findById(req.params.id, function(e, results) {
			if (!e) {
				results.toObject();
				res.send(results);
			} else {
				console.log(e);
			}
		});
	});

	// returns a user by name. This call is designed to return only a producer.
	app.get("/api/user/producer/:producerName", function(req, res, next) {
		models.User.findOne({
			name: req.params.producerName
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
	app.delete("/api/user/:id/", function(req, res, next) {
		var toUser, toUserOptions, toUserData, toAdmin, toAdminOptions, toAdminData;
		if (req.user._id === req.params.id || req.user.user_type.name === 'admin') {
			models.User.findById(req.params.id, function(e, user) {
				if (!e) {
					toUserOptions = {
						template: 'goodbye'
					};
				}
			})

			//add an email here

			models.User.remove({
				_id: req.params.id
			}, function(e) {
				if (e) return handleError(e);
			});
			models.Products.remove({
				producer_ID: req.params.id
			}, function(e) {
				if (e) return handleError(e);
			});
			models.Order.remove({
				customer: req.params.id
			}, function(e) {
				if (e) return handleError(e);
			});
		}


	});
	app.route('/auth/session')
		.get(function(req, res, next) {
			if (req.user) {
				res.json(req.user);
			} else {
				res.send('text/plain', 'Not logged in');
			}

		})
		.post(passport.authenticate('local', {
				failureFlash: 'Login Failed for some reason',
				failureRedirect: '#/login-failed'
			}), // redirect and flash not working for some reason. Possibly an angularJS issue?

			function(req, res, next) {
				var userObject = req.user.toObject();
				res.json(userObject);
			})
		.delete(function(req, res) {
			if (req.user) {
				req.logout();
				res.send(200, "Successfully Logged out");
			} else {
				res.send(400, "Not logged in");
			}
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
				user.toObject();
				res.send(user);
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
					console.log(user.salt);
					user.setPassword(req.body.password, function() {
						user.resetPasswordToken = undefined;
						user.resetPasswordExpires = undefined;

						user.save(function(err) {
							if (err) console.log(err);
							console.log(user.salt);
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
					req.flash('success', 'An email has been sent to ' + user.email + ' confirming their password change.');
					console.log("Message sent to user confirming password change");
					req.logIn(user, function(err) {
						user.toObject();
						res.send(user);
					});
					done(err, 'done');
				});
			}
			], function(err) {
				console.log(err);
				
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

	app.use(express.static(__dirname));
	app.use(errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
	return app;
}
