var config = require('./coopConfig.js'),
	cycle = config.cycle,
	async = require('async'),
	nodemail = require('nodemailer'),
	smtpTransport = require('nodemailer-smtp-transport'),
	Emailer = require('./emailer.js'),
	mongoose = require('mongoose'),
	ObjectId = require('mongoose').Types.ObjectId, 
	models = require('./models.js'),
	fs = require('fs'),
	_ = require('lodash'),
	schedule = require('node-schedule'),
	mailChimp = require('./mailChimp.js');
	
	require('datejs');
	
var dailyRule = new schedule.RecurrenceRule();
dailyRule.minute = 0;
dailyRule.hour = 0;

function checkCycle(date, done) {
	if (!date) date = Date.today().toISOString();
	//console.log(date);
	
	models.Cycle.findOne({
		start: {$lte: new Date(date).toISOString()},
		deliveryDay: {$gte: new Date(date).toISOString()}
	})
	//.min({start: date}).max({start: Date.today().addMonths(1).toString()})
	.lean().exec(function(err, cycle) {
		
		if (err) {
			done(new Error('WARNING FAILED TO FIND CYCLE', err));
			exports.currentCycle = -1;
		} else if (!cycle) done(new Error('WARNING CYCLE DOES NOT EXIST FOR DATE: ' + new Date(date).toISOString()));
		else exports.currentCycle = cycle;
		done(err, cycle);
	});
}

exports.checkCycle = checkCycle;
	
// check for events in the order cycle every day at 2am

var orderCycleChecker = schedule.scheduleJob({hour:2, minute: 0}, checkConfig);

// schedule emails to send alerting members that it is delivery day.
// To be executed at 9:15am Wednesday;
function checkConfig() {
	var today = new Date();
	
	checkCycle(today, function(err, cycle) {
		if (err) {
			console.log(err);
		}
		console.log(Date() + '. Constructing cycle object from DB results');
		var shoppingStart = Date.parse(cycle.shoppingStart);
		var shoppingStop = Date.parse(cycle.shoppingStop);
		var deliveryDay = Date.parse(cycle.deliveryDay);
		
		exports.canShop = false;
		
		if ( today.equals( shoppingStart ) || today.between( shoppingStart, shoppingStop) ) {
			console.log('today is a shopping day');
			exports.canShop = true;
		} else if (today.equals(cycle.shoppingStop) ) {
			console.log('Today everyone is invoiced');
			// checkout everyone's purchases
			exports.checkout();
			// send order requests to producers
			exports.orderGoods();
		} else if (today.equals(deliveryDay) ) {
			console.log('Today is Delivery Day!');
		}
		
	});
}
exports.checkConfig = checkConfig;
	
exports.checkout = function () {
	async.waterfall([
		function(done) {
			console.log('beginning checkout process');
			models.Order
			.aggregate()
			.match({cycle: exports.currentCycle._id})
			.group({ _id: '$customer', orders: { $push : {product: '$product', quantity: '$quantity'} }})
			.exec(function(e, customers) {
				// customers is a plain javascript object not a special mongoose document.
				done(e, customers);
			});
		},
		// function(customers, done) {
// 			models.Product.populate(customers, {path: 'orders.product', select: 'fullName variety productName priceWithMarkup price units refrigeration'}
// 			, function(e, result){
// 				done(null, result);
// 			});
// 		},
		function(customers, done) {
			models.User.populate(customers, {path: '_id', select: 'name email routeTitle balance user_type.name'}
			, function(e, result){
				done(null, result);
			});
		}
	],function(e, result){
		if (e) {
			console.log(e);
		}
		else {
			async.each(result, exports.invoiceCustomer, function(error) {
				if (error) console.log(error);
			});
		}
	});
};

// called by checkout() for each customer. Creates invoices for customers to pay
// and emails them a copy
exports.invoiceCustomer = function(customer, callback) {
	async.waterfall([
		function (done) {
			var invoice = new models.Invoice({
				dueDate: Date.parse(exports.currentCycle.shoppingStop).addDays(7).toString(),
				invoicee: customer._id._id,
				title: 'Shopping Order for ' + Date.today().toString('MMMM'),
				items: customer.orders,
				cycle: exports.currentCycle._id,
				deliveryRoute: customer._id.routeTitle || 'Whangarei'
			});
			
			if (customer._id.user_type.name === 'Customer' && customer._id.balance) {
				invoice.credit = customer._id.balance;
				console.log('%s credited on shopping Bill', customer._id.name);
			}
			
			invoice.save(function(e, invoice){
				console.log('Invoice #%s saved for %s and has a total of %s', invoice._id, customer._id.name, invoice.total);
				if (e) done(e);
				else done(null, invoice);
			});
		},
		function(invoice, done) {
			invoice.populate('items.product', 'price priceWithMarkup', function(e, invoice) {
				if (e) return done(e);
				done(null, invoice);
			});
		},
		function(invoice, done) {
			var mailOptions, mailData, mail;
			mailOptions = {
				template: 'shopping-invoice',
				subject: 'Thank you for shopping locally this ' + Date.today().toString('MMM'),
				to: {
					email: customer._id.email,
					name: customer._id.name
				}
			};
			
			var showCredit = 'none';
			if (!isNaN(parseFloat(invoice.credit))) showCredit = 'table-row';
			
			mailData = {
				name: customer._id.name,
				dueDate: Date.parse(exports.currentCycle.shoppingStop).addDays(5).toString('ddd dd MMMM yyyy'),
				code: invoice._id,
				items: invoice.items,
				showCredit: showCredit,
				credit: function() {
					if (invoice.credit >= 0) return '$' + invoice.credit.toFixed(2);
					else if(invoice.credit < 0) return '-' + '$' + Math.abs(invoice.credit).toFixed(2);
				},
				subtotal: invoice.subtotal,
				total: invoice.total,
				account: config.bankAccount
			};
			
			mail = new Emailer(mailOptions, mailData);

			
			mail.send(function(err, result) {
				if (err) done(err);
				// a response is sent so the client request doesn't timeout and get an error.
				else {
					console.log('Message sent to customer ' + customer._id.name);
					done(null);
				}
			});
		}
		
	], function(error) {
		callback(error);
	});
};

exports.orderGoods = function() {
	async.waterfall([
		function(done) {
			models.Order
			.aggregate()
			.match({cycle: exports.currentCycle._id})
			.group({ _id: '$supplier', orders: { $push : {product: '$product', customer: '$customer', quantity: '$quantity'} }})
			
			.exec(function(e, producers) {
				// producers is a plain javascript document not a special mongoose document.
				done(e, producers);
			});
		},
		//function(producers, done) {
			// models.Product.populate(producers, {path: 'orders.product', select: 'fullName variety productName price units refrigeration'}
// 			, function(e, result){
//
// 				_.map(result, function(producer) {
// 					producer.orders = _.sortBy(producer.orders, function(order) {
// 						return order.product.fullName.toLowerCase();
// 					});
// 					return producer;
// 				});
// 				done(null, result);
// 			});
// 		},
		function(producers, done) {
			models.User.populate(producers, {path: '_id', select: 'name email producerData.bankAccount balance'}
			, function(e, result){
				done(null, result);
			});
		}
	],function(e, result){
		if (e) {
			console.log(e);
		}
		else {
			async.each(result, exports.invoiceFromProducer, function(error) {
				if (error) console.log(error);
			});
		}
	});
};

// called by orderGoods() for each customer. Creates invoices for producers to
// be paid. Creates invoices for producers to know what to deliver and emails
// them a copy of the invoice. This function is for the producer's 
// convenience and is as a way of invoicing the co-op for orders requested.
exports.invoiceFromProducer = function (producer, callback) {
	var order, items = [];
	
	async.waterfall([
		function(done) {
			var invoice = new models.Invoice({
				dueDate: Date.parse(exports.currentCycle.deliveryDay).addDays(4).toString('ddd dd MMMM yyyy'),
				invoicee: producer._id._id,
				title: 'Products Requested for ' + Date.today().toString('MMMM'),
				items: producer.orders,
				cycle: exports.currentCycle._id,
				toCoop: true,
				bankAccount: producer._id.producerData.bankAccount || 'NO ACCOUNT ON RECORD'
			});
			
			if (producer._id.balance) {
				invoice.credit = -producer._id.balance;
			}
			
			invoice.save(function(e, invoice) {
				if (e) return done(e);
				done(null, invoice);
			});
		},
		function(invoice, done) {
			invoice.populate('items.customer', 'name email routeTitle balance').populate('items.product', 'fullName variety productName price units refrigeration',
			 function(e, invoice) {
				if (e) return done(e);
				done(null, invoice);
			});
		},
		function(invoice, done) {
			var mailOptions, mailData, mail;
			mailOptions = {
				template: 'producer-invoice',
				subject: Date.today().toString('MMMM') + ' Products Requested for ' + config.coopName,
				to: {
					email: producer._id.email,
					name: producer._id.name
				}
			};
			var showCredit = 'none';
			if (!isNaN(parseFloat(invoice.credit))) showCredit = 'table-row';
			
			mailData = {
				name: producer._id.name,
				dueDate: Date.parse(exports.currentCycle.deliveryDay).addDays(4).toString('ddd dd MMMM yyyy'),
				deliveryDay: Date.parse(exports.currentCycle.deliveryDay).toString('ddd dd MMMM yyyy'),
				code: invoice._id,
				items: invoice.items,
				showCredit: showCredit,
				credit: function() {
					if (invoice.credit >= 0) return '$' + invoice.credit.toFixed(2);
					else if(invoice.credit < 0) return '-' + '$' + Math.abs(invoice.credit).toFixed(2);
				},
				subtotal: invoice.subtotal,
				total: invoice.total,
				account: producer._id.producerData.bankAccount
			};
			
			mail = new Emailer(mailOptions, mailData);
			
			
			mail.send(function(err, result) {
				if (err) done(err);
				else {
					console.log('Message sent to producer ' + producer._id.name);
					done(null);
				}
			});
		}
		
	],function(error) {
		callback(error);
	});
};

function disableCycle() {
	exports.canShop = true;
}


// function writeProductImgToDisk() {
// 	models.Product.find({}, null, function(err, products){
// 		console.log(err);
// 		async.each(products, function(product, done) {
// 			product.save(function(err) {
// 				if (err) return done(err);
// 				done();
// 			});
// 		}, function(err) {
// 			console.log(err);
// 		});
//
// 	});
// }
//
// function writeProducerImgToDisk() {
// 	models.User.find({'user_type.name':'Producer'}, null, function(err, users){
// 		console.log(err);
// 		async.each(users, function(user, done) {
// 			user.save(function(err) {
// 				if (err) return done(err);
// 				done();
// 			});
// 		}, function(err) {
// 			console.log(err);
// 		});
// 	});
// }

checkConfig();
//disableCycle();



