var async = require('async'), 
	mongoose = require('mongoose'),
	geocoder = require('geocoder'),
	models = require('./../models.js'),
	Emailer = require('./../emailer.js'),
	config = require('./../coopConfig.js'),
	discount = require('./../controllers/discount'),
passport = require('passport');

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
				email: 'test@test2.com',
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
			if (invoice) {
				invoice.remove(function(err) {
					done();
				});
			} else done();
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
			done();
		});
	});
});

describe('perform different transactions on a user object', function() {
	beforeEach(function(done) {
		testUser = {
				name: 'John Smith',
				address: '123 Worsnop Road, Ruatangata West',
				email: 'test3@test3.com',
				phone: '095334692',
				user_type: {
					name: 'Producer',
					canBuy: true,
					canSell: true
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
	it('should be able to adjust the balance with a general transaction', function(done) {
		// assume a $100 purchase was made
		models.User.transaction(user._id, -100, {sandbox:true}, function(err, user) {
			expect(err).toBeNull();
			expect(user).not.toBeUndefined();
			expect(user.balance).toEqual(-100);
			done();
		});
	});
	it('should be able to adjust the businessBalance', function(done) {
		models.User.transaction(user._id, 100, {businessBalance: true, title: 'Test Payment for Products Sold'}, function(err, user) {
			expect(err).toBeNull();
			expect(user).not.toBeUndefined();
			expect(user.businessBalance).toEqual(100);
			done();
		});
	});
});

