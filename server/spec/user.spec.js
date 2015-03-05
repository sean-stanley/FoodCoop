var async = require('async'), 
	mongoose = require('mongoose'),
	geocoder = require('geocoder'),
	models = require('./../models.js'),
	Emailer = require('./../emailer.js'),
	config = require('./../coopConfig.js'),
	discount = require('./../controllers/discount'),
passport = require('passport');

//setup DB connection;
mongoose.connect('mongodb://localhost/nnfc-test');

	//Globals
var testUser, invoice, user;

require('datejs');

describe('registering a producer user', function() {
	beforeEach(function(done) {
		testUser = {
				name: 'John Smith',
				address: '123 Worsnop Road, Ruatangata West',
				email: 'test@test.com',
				phone: '095334692',
				password: 'BadPassword',
				user_type: {
					name: 'Producer',
					canBuy: true,
					canSell: false
				}	
			};
			done();
	});
	it('should be able to geocode address', function(done) {
		var lat, lng;
		geocoder.geocode(testUser.address, function ( err, data ) {
			expect(err).toBeNull();
			expect(data).not.toBeNull();
			expect(data.status).toBe('OK');
			done();
		});
		
	});
	it('should be able to register user', function(done) {
		models.User.register(new models.User({
			dateJoined: Date.today(),
			name: testUser.name,
			email: testUser.email,
			phone: testUser.phone,
			address: testUser.address,
			user_type: testUser.user_type,
		}),
		testUser.password,
		function(err, account) {
			expect(err).toBeNull();
			expect(account.name).toBe('John Smith');
			expect(account.salt).not.toBeUndefined();
			expect(account.hash).not.toBeUndefined();
			expect(account.password).toBeUndefined();
			account.remove();
			done();
		});
	});
});

describe('creating an invoice for new user', function() {
	beforeEach(function(done) {
		testUser = {
				name: 'John Smith',
				address: '123 Worsnop Road, Ruatangata West',
				email: 'test@test.com',
				phone: '095334692',
				user_type: {
					name: 'Producer',
					canBuy: true,
					canSell: false
				}	
			};
		models.User.register(testUser, 'badPassword', function(err, account) {
			user = account;
			done();
		});
	});
	afterEach(function(done) {
		user.remove(function(err) {
			done();
		});
	});
	it('should have saved user correctly', function(done) {
		expect(user).not.toBeUndefined();
		expect(user.name).toBe('John Smith');
		expect(user._id).not.toBeUndefined();
		expect(user.salt).not.toBeUndefined();
		expect(user.hash).not.toBeUndefined();
		done();
	});
	it('should be able to create the invoice', function(done) {
		var itemName = 'Producer Membership', cost = config.producerMembership;
		invoice = new models.Invoice({
			datePlaced: Date.today(),
			invoicee: user._id,
			title: 'Membership',
			items: [{name:itemName, cost:cost}],
			dueDate: Date.today().addDays(30)
		});
		
		invoice.save(function(err) {
			expect(err).toBeNull();
			expect(invoice.title).toBe('Membership');
			expect(invoice.invoicee).not.toBeUndefined();
			expect(invoice._id).not.toBeUndefined();
			expect(invoice.dueDate.toString()).toBe(Date.today().addDays(30).toString());
			
			invoice.remove(function(err) {
				expect(err).toBeNull();
				done();
			});
		});
	});
});

//app.post('/api/user', discount.checkForDiscount, function(req, res, next) {
	// var memberEmailOptions, memberEmailData, memberEmail, dueDate, invoice;
	// async.waterfall([
	// 	// create the new user and pass the user to the next function
	// 	function(done) {
	// 		var lat, lng;
	// 		if (req.body.address) {
	// 			geocoder.geocode(req.body.address, function ( err, data ) {
	// 				if (data.status === 'OK') {
	// 					lat = data.results[0].geometry.location.lat;
	// 					lng = data.results[0].geometry.location.lng;
	// 					log.info('geocoded address successfully for %s', req.body.name);
	// 					done(null, lat, lng);
	// 				} else {
	// 					log.info('geolocator status is %s and the number of results is %s', data.status, data.results.length);
	// 					done({name: 'ZERO_RESULT', message: 'could not match your address to GPS coordinates. Try removing the rural delivery number as we don\'t need it'}, null);
	// 				}
	// 			});
	// 		}
	// 		else done(null, 0, 0);
	// 	}, function(lat, lng, done) {
	// 		// disable unapproved producers from uploading immediately.
	// 		if (req.body.user_type.canSell) req.body.user_type.canSell = false;
	// 		// if (req.body.user_type.name === 'Producer') req.body.user_type.canSell = true;
	// 		models.User.register(new models.User({
	// 			dateJoined: Date.today(),
	// 			name: req.body.name,
	// 			email: req.body.email,
	// 			phone: req.body.phone,
	// 			address: req.body.address,
	// 			user_type: req.body.user_type,
	// 			lat: lat,
	// 			lng: lng
	// 		}),
	// 		req.body.password,
	// 		function(err, account) {
	// 			if (err) return done(err, null);
	// 			log.info('added new user to database');
	// 			done(null, account);
	// 		});
	// 	},
	// 	// Create an invoice to be used in the email and also available to the app
	// 	// because it's saved to the database.
	// 	function(user, done) {
	// 		var itemName = 'Customer Membership', cost = config.customerMembership;
	// 		if (user.user_type.name === 'Producer') {
	// 			itemName = 'Producer Membership';
	// 			cost = config.producerMembership;
	// 		}
	// 		//create a promise of a new invoice
	// 		invoice = new models.Invoice({
	// 			datePlaced: Date.today(),
	// 			invoicee: user._id,
	// 			title: 'Membership',
	// 			items: [{name:itemName, cost:cost}],
	// 			dueDate: Date.today().addDays(30)
	// 		});
	// 		if (req.body.discount && user.user_type.name === 'Customer') invoice.credit = req.body.discount.customer;
	// 		if (req.body.discount && user.user_type.name === 'Producer') invoice.credit = req.body.discount.producer;
	// 		// save the invoice made for the user;
	// 		invoice.save(function(err, invoice) {
	// 			if (err) log.info(err);
	// 			log.info('Invoice saved');
	// 			memberEmailOptions = {
	// 				template: 'new-member',
	// 				subject: 'Welcome to the NNFC and Invoice',
	// 				to: {
	// 					email: user.email,
	// 					name: user.name
	// 				}
	// 			};
	// 			//send an email invoice
	// 			memberEmailData = {
	// 				name: user.name,
	// 				dueDate: invoice.dueDate,
	// 				code: invoice._id,
	// 				items: invoice.items,
	// 				cost: invoice.total,
	// 				account: config.bankAccount,
	// 				email: user.email,
	// 				password: req.body.password,
	// 				discountCode: req.body.discountCode || '',
	// 				discount: invoice.credit || ''
	// 			};
	//
	// 			memberEmail = new Emailer(memberEmailOptions, memberEmailData);
	// 			memberEmail.send(function(err, result) {
	// 				if (err) {
	// 					log.warn(err);
	// 				}
	// 				log.info('Message sent to new member %s', user.name);
	// 			});
	// 		});
	//
	// 		done(null, user);
	// 	}], function(err, user){
	// 		var userObject;
	// 		if (user) {
	// 			var params = {
	// 				id: 'e481a3338d',
	// 				email: {email: user.email},
	// 				merge_vars : {
	// 					FNAME : user.name.substr(0, user.name.indexOf(' ')),
	// 					LNAME : user.name.substr(user.name.indexOf(' ')+1) || '',
	// 					USER_TYPE : user.user_type.name,
	// 					ADDRESS : user.address,
	// 					PHONE : user.phone
	// 				}
	// 			};
	// 			//subscribe user to mailChimp
	// 							//
	// 			// mc.lists.subscribe(params, function(result) {log.info(result);}, function(err) {
	// 			// 	log.info(err);
	// 			// });
	// 			//
	// 			// authenticate the newly created user
	// 			passport.authenticate('local', function(err, user, info){
	// 				if (!user) {
	// 					return next(err);
	// 				} else {
	// 					req.logIn(user, function(err){
	// 						// req.user should now be assigned
	// 						if (err) log.info(err);
	// 						userObject = req.user.toObject();
	// 						delete userObject.salt;
	// 						delete userObject.hash;
	// 						res.send(userObject);
	// 					});
	// 				}
	// 			})(req, res, next);
	// 		} else next(err);
	// 	});