var config = require('./coopConfig.js'),
	cycle = config.cycle,
	async = require('async'),
	nodemail = require('nodemailer'),
	smtpTransport = require('nodemailer-smtp-transport'),
	Emailer = require('./emailer.js'),
	mongoose = require('mongoose'),
	ObjectId = require('mongoose').Types.ObjectId, 
	models = require('./models.js'),
	fs = require("fs"),
	_ = require('lodash'),
	schedule = require("node-schedule"),
	mailChimp = require("./mailChimp.js");
	
	require('datejs');
	
var dailyRule = new schedule.RecurrenceRule();
dailyRule.minute = 0;
dailyRule.hour = 0;
	
// check for events in the order cycle every day at 1am
var orderCycleChecker = schedule.scheduleJob({hour:0, minute: 0}, checkConfig);

// schedule emails to send alerting members that it is delivery day.
// To be executed at 9:15am Wednesday;
function checkConfig() {
	console.log(Date() + ". Checking if today is a significant day");
	var today = Date.today(), cycle = config.cycleReset('today'), key;
	
	findCycle();
	
	exports.canShop = false;
	exports.canUpload = false;
	exports.canChange = true;
	
	// if the date is between the productUploadStart date and the productUpoad Stop date
	// double check that canShop is false and canUpload is true;
	if ( !today.equals(cycle.ProductUploadStop) && today.between(cycle.ProductUploadStart, cycle.ProductUploadStop) ) {
		console.log('today is between the start of product uploading and the end');
		exports.canShop = false;
		exports.canChange = false;
		exports.canUpload = true;
	}

	// if the date is between the ShoppingStart date and the ShoppingStop Stop date
	// double check that canShop is true and canUpload is false;
	if ( !today.equals(cycle.ShoppingStart) && !today.equals(cycle.ShoppingStop) && today.between(cycle.ShoppingStart, cycle.ShoppingStop) ) {
		console.log('today is between the start of shopping uploading and the end');
		exports.canShop = true;
		exports.canChange = true;
		exports.canUpload = false;
	}

	// test for an exact day match and run reminder email functions if it is.
	for (key in cycle) {
		if (cycle.hasOwnProperty(key) && cycle[key] instanceof Date) {
			// check if today is a special day
			if ( today.equals(cycle[key]) ) {
				console.log('Woohoo! Today is %s day', key);
				// find what day it is
				var cycleDay = key;
				switch (cycleDay) {
				case 'cycleIncrementDay':
					incrementCycle();
					mailChimp.mailSchedule();
					break;
				case 'ProductUploadStart':
					exports.canUpload = true;
					exports.canChange = false;
					break;
				case 'ProductUploadStop':
					exports.canUpload = false;
					exports.canChange = true;
					break;
				case 'ShoppingStart':
					exports.canShop = true;
					exports.canChange = true;
					break;
				case 'ShoppingStop':
					exports.canShop = false;
					// checkout everyone's purchases
					exports.checkout();
					// send order requests to producers
					exports.orderGoods();
					break;
				case 'volunteerRecruitment':
					// send messages asking for sorters and drivers.
					break;
				case 'PaymentDueDay':
					// send reminders to those with unpaid invoices
					break;
				case 'DeliveryDay':
					exports.canChange = false;
					// send reminder emails
					break;
				case 'testDay':
					break;
				default:
					// no functions to execute for this day
					return;
				}
			}
			
		}
	}


}

// looks for all the orders of the cycle and groups them by customer
exports.checkout = function () {
	async.waterfall([
		function(done) {
			console.log('beginning checkout process');
			models.Order
			.aggregate()
			.match({cycle: exports.currentCycle})
			.group({ _id: "$customer", orders: { $push : {product: "$product", quantity: "$quantity"} }})
			.exec(function(e, customers) {
				// customers is a plain javascript object not a special mongoose document.
				done(e, customers);
			});
		},
		function(customers, done) {
			models.Product.populate(customers, {path: 'orders.product', select: 'fullName variety productName priceWithMarkup price units refrigeration'}
			, function(e, result){
				done(null, result);
			});
		},
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
}

// called by checkout() for each customer. Creates invoices for customers to pay
// and emails them a copy
exports.invoiceCustomer = function(customer, callback) {
	async.waterfall([
		function (done) {
			var invoice = new models.Invoice({
				dueDate: config.cycle.PaymentDueDay.toString(),
				invoicee: customer._id._id,
				title: "Shopping Order for " + Date.today().toString("MMMM"),
				items: customer.orders,
				cycle: exports.currentCycle,
				deliveryRoute: customer._id.routeTitle || "Whangarei"
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
				subject: 'Thank you for shopping locally this ' + Date.today().toString("MMM"),
				to: {
					email: customer._id.email,
					name: customer._id.name
				}
			};
			
			var showCredit = 'none';
			if (!isNaN(parseFloat(invoice.credit))) showCredit = 'table-row';
			
			mailData = {
				name: customer._id.name,
				dueDate: invoice.dueDate.toString("ddd dd MMMM yyyy"),
				code: invoice._id,
				items: customer.orders,
				showCredit: showCredit,
				credit: function() {
					if (invoice.credit >= 0) return '$' + invoice.credit.toFixed(2);
					else return "-" + '$' + Math.abs(invoice.credit).toFixed(2);
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
					console.log("Message sent to customer " + customer._id.name);
					done(null);
				}
			});
		}
		
	], function(error) {
		callback(error);
	});
}

exports.orderGoods = function() {
	async.waterfall([
		function(done) {
			models.Order
			.aggregate()
			.match({cycle: exports.currentCycle})
			.group({ _id: "$supplier", orders: { $push : {product: "$product", customer: '$customer', quantity: "$quantity"} }})
			
			.exec(function(e, producers) {
				// producers is a plain javascript document not a special mongoose document.
				done(e, producers);
			});
		},
		function(producers, done) {
			models.Product.populate(producers, {path: 'orders.product', select: 'fullName variety productName price units refrigeration'}
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
		function(producers, done) {
			models.User.populate(producers, [{path: '_id', select: 'name email producerData.bankAccount balance'}, {path: 'orders.customer', select: 'name email routeTitle balance'}]
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
}

// called by orderGoods() for each customer. Creates invoices for producers to
// be paid. Creates invoices for producers to know what to deliver and emails
// them a copy of the invoice. This function is for the producer's 
// convenience and is as a way of invoicing the co-op for orders requested.
exports.invoiceFromProducer = function (producer, callback) {
	var order, items = [];
	
	async.waterfall([
		function(done) {
			var invoice = new models.Invoice({
				dueDate: config.cycle.DeliveryDay.addDays(4).toString("ddd dd MMMM yyyy"),
				invoicee: producer._id._id,
				title: "Products Requested for " + Date.today().toString("MMMM"),
				items: producer.orders,
				cycle: exports.currentCycle,
				toCoop: true,
				bankAccount: producer._id.producerData.bankAccount || "NO ACCOUNT ON RECORD"
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
			invoice.populate('items.product', 'price priceWithMarkup', function(e, invoice) {
				if (e) return done(e);
				done(null, invoice);
			});
		},
		function(invoice, done) {
			var mailOptions, mailData, mail;
			mailOptions = {
				template: 'producer-invoice',
				subject: Date.today().toString("MMMM") + ' Products Requested for ' + config.coopName,
				to: {
					email: producer._id.email,
					name: producer._id.name
				}
			};
			var showCredit = 'none';
			if (!isNaN(parseFloat(invoice.credit))) showCredit = 'table-row';
			
			mailData = {
				name: producer._id.name,
				dueDate: invoice.dueDate.toString("ddd dd MMMM yyyy"),
				deliveryDay: config.cycle.DeliveryDay.toString("ddd dd MMMM yyyy"),
				code: invoice._id,
				items: producer.orders,
				showCredit: showCredit,
				credit: function() {
					if ( invoice.credit*-1 >= 0) return '$' + Math.abs(invoice.credit).toFixed(2);
					else return "-" + '$' + Math.abs(invoice.credit).toFixed(2);
				},
				subtotal: invoice.subtotal,
				total: invoice.total,
				account: producer._id.producerData.bankAccount
			};
			
			mail = new Emailer(mailOptions, mailData);
			
			
			mail.send(function(err, result) {
				if (err) done(err);
				else {
					console.log("Message sent to producer " + producer._id.name);
					done(null);
				}
			});
			
			
		}
		
	],function(error) {
		callback(error);
	});
}

// increment the number of cycles by 1 and set the ID to the total +1 (just like with invoices);
// use Cycle number 0 for testing stuff
function incrementCycle() {
	models.Cycle.findById("orderCycle").exec(function(e, cycle) {
		if (e) console.log(e);
		else {
			if ( cycle && Date.equals(Date.today(), Date.parse(cycle.dateModified).clearTime()) ) console.log("cycle already incremented today");
			else {
				models.Cycle.findOneAndUpdate({_id: 'orderCycle'},{ dateModified: Date.now(), $inc: {seq: 1} }, function(err, cycle){
					console.log(cycle);
					if (!err) {
						config.cycleReset('today');
						exports.currentCycle = cycle.seq;
					}
					else console.log(err);
				});	
			}
		}
	});
}

function findCycle(callback) {
	models.Cycle.findById('orderCycle', function(e, cycle) {
		if (e) {
			console.log(e);
			// Set the CurrentCycle to Something Even if Looking up the Cycle Goes Wrong. That way any Data Created During This Time can be Saved and Changed to the Correct Cycle Later.
			exports.currentCycle = -1; 
		} else {
			exports.currentCycle = cycle.seq;
			console.log("the current cycle is #" + exports.currentCycle);
			if (callback) callback();
		}
	});
}

function disableCycle() {
	exports.canShop = true;
	exports.canUpload = true;
	exports.canChange = true;
}


function writeProductImgToDisk() {
	models.Product.find({}, null, function(err, products){
		console.log(err);
		async.each(products, function(product, done) {
			product.save(function(err) {
				if (err) return done(err);
				done();
			});
		}, function(err) {
			console.log(err);
		});
		
	});
}

function writeProducerImgToDisk() {
	models.User.find({'user_type.name':'Producer'}, null, function(err, users){
		console.log(err);
		async.each(users, function(user, done) {
			user.save(function(err) {
				if (err) return done(err);
				done();
			});
		}, function(err) {
			console.log(err);
		});
	});
}

exports.findCycle = findCycle;

checkConfig();
//disableCycle();
//writeProductImgToDisk();
//writeProducerImgToDisk();

// checkout everyone's purchases
// exports.checkout();
// send order requests to producers
// exports.orderGoods();

// checkOut and orderGoods don't run on initial server launch because exports.currentCycle is undefined by the time they get called. Convenient for now but a more elegant solution should be implemented.


