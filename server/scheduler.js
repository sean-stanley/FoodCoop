var config = require('./coopConfig.js'),
	cycle = config.cycle,
	async = require('async'),
	nodemail = require('nodemailer'),
	smtpTransport = require('nodemailer-smtp-transport'),
	mail = require('./emailer.js'),
	mongoose = require('mongoose'),
	ObjectId = require('mongoose').Types.ObjectId, 
	models = require('./models.js'),
	fs = require("fs"),
	_ = require("underscore"),
	schedule = require("node-schedule"),
	calHelp = require('./calendarHelper');
	
	require('datejs');

	
var dailyRule = new schedule.RecurrenceRule();
dailyRule.minute = 0;
dailyRule.hour = 0;
	
// check for events in the order cycle every day at 1am
var orderCycleChecker = schedule.scheduleJob({second: [0, 20, 40]}, checkConfig);

// schedule emails to send alerting members that it is delivery day.
// To be executed at 9:15am Wednesday;
function checkConfig() {
	console.log("checking if today is a significant day")
	var today = Date.today(), cycle = config.cycle, key;

	// test for an exact day match and run reminder email functions if it is.
	for (key in cycle) {
		if (cycle.hasOwnProperty(key) && cycle[key] instanceof Date) {
			// check if today is a special day
			if ( today.equals(cycle[key]) ) {
				console.log('Woohoo! Today is %s day', key);
				// find what day it is
				var cycleDay = key;
				// the bools won't work as they just edit a copy of config not config itself as referenced by the rest of the server
				switch (cycleDay) {
				case 'cycleIncrementDay':
					incrementCycle();
					// current cycle equals +1 and that total
				case 'ProductUploadStart':
					exports.canUpload = true;
					// schedule email reminder to producers here.
					// and another reminder in 5 days saying there are only two days left
					break;
				case 'ProductUploadStop':
					exports.canUpload = false;
					// schedule email reminders to producer	here
					break;
				case 'ShoppingStart':
					exports.canShop = true;
					// schedule email reminders to all members here and another in 5 days saying
					// there are only two days left	
					break;
				case 'ShoppingStop':
					exports.canShop = false;
					// checkout everyone's purchases
					checkout();
					// send order requests to producers
					orderGoods();
					break;
				case 'volunteerRecruitment':
					// send messages asking for sorters and drivers.
					break;
				case 'PaymentDueDay':
					// send reminders to those with unpaid invoices
					break;
				case 'DeliveryDay':
					// send reminder emails
					break;
				case 'testDay':
					break;
				default:
					// no functions to execute for this day
					null
				}
			}
			// if the date is between the productUploadStart date and the productUpoad Stop date
			// double check that canShop is false and canUpload is true;
			else if ( today.between(cycle.ProductUploadStart, cycle.ProductUploadStop) ) {
				exports.canShop = false;
				exports.canUpload = true;
			}
		
			// if the date is between the ShoppingStart date and the ShoppingStop Stop date
			// double check that canShop is true and canUpload is false;
			else if ( today.between(cycle.ShoppingStart, cycle.ShoppingStop) ) {
				exports.canShop = true;
				exports.canUpload = false;
			}
			
		}
	}
};

// looks for all the orders of the cycle and groups them by customer
function checkout() {
	async.waterfall([
		function(done) {
			models.Order
			.aggregate()
			//.match({cycle: exports.currentCycle})
			.group({ _id: "$customer", orders: { $push : {product: "$product", quantity: "$quantity"} }})
			.exec(function(e, customers) {
				// customers is a plain javascript object not a special mongoose document.
				done(e, customers)
			})
		},
		function(customers, done) {
			models.Product.populate(customers, {path: 'orders.product', select: 'fullName variety productName priceWithMarkup price units refrigeration -_id'}
			, function(e, result){
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
		}
		else {
			for (var i = 0; i < result.length; i++) {
				invoiceCustomer(result[i]);
			}
		}
	});
};

// called by checkout() for each customer. Creates invoices for customers to pay
// and emails them a copy
function invoiceCustomer(customer) {
	async.waterfall([
		function (done) {
			customer
			
			var invoice = new models.Invoice({
				dueDate: config.cycle.PaymentDueDay.toString(),
				invoicee: customer._id._id,
				title: "Shopping Order for " + Date.today().toString("MMMM"),
				items: customer.orders,
				cycle: exports.currentCycle
			})
			
			.save(function(e, invoice){
				console.log(invoice.total);
				if (e) done(e);
				else done(null, invoice)
			});
			
		},
		function(invoice, done) {
			var mailOptions, mailData, mail;
			mailOptions = {
				template: 'shopping-invoice',
				subject: Date.today().toString("MMM") + ' Shopping Bill for ' + customer._id.name,
				to: {
					email: customer._id.email,
					name: customer._id.name
				}
			};

			mailData = {
				name: customer._id.name,
				dueDate: invoice.dueDate,
				code: invoice._id,
				items: invoice.items,
				total: invoice.total,
				account: config.bankAccount
			};
			
			mail = new Emailer(mailOptions, mailData);

			mail.send(function(err, result) {
				if (err) done(err);
				// a response is sent so the client request doesn't timeout and get an error.
				console.log("Message sent to customer " + customer._id.name);
				
				done(null, result);
			});
		}
		
	], function(error) {
		console.log(error);
	});
};

function orderGoods() {
	async.waterfall([
		function(done) {
			models.Order
			.aggregate()
			//.match({cycle: exports.currentCycle})
			.group({ _id: "$supplier", orders: { $push : {product: "$product", customer: '$customer', quantity: "$quantity"} }})
			
			.exec(function(e, producers) {
				// customers is a plain javascript document not a special mongoose document.
				done(e, producers)
			})
		},
		function(producers, done) {
			models.Product.populate(producers, {path: 'orders.product', select: 'fullName variety productName price units refrigeration -_id'}
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
		function(producers, done) {
			models.User.populate(producers, [{path: '_id', select: 'name email producerData.bankAccount'}, {path: 'orders.customer', select: 'name email'}]
			, function(e, result){
				done(null, result)
			});
		}
	],function(e, result){
		if (e) {
			console.log(e)
		}
		else {
			for (var i = 0; i < result.length; i++) {
				invoiceFromProducer(result[i]);
			}
		}
	});
};

// called by orderGoods() for each customer. Creates invoices for producers to
// be paid. Creates invoices for producers to know what to deliver and emails
// them a copy of the invoice. This function is for the producer's 
// convenience and is as a way of invoicing the co-op for orders requested.
function invoiceFromProducer(producer) {
	async.waterfall([
		function(done) {
			var invoice = new models.Invoice({
				dueDate: config.cycle.DeliveryDay.toString(),
				title: "Products Requested for " + Date.today().toString("MMMM"),
				items: producer.orders,
				cycle: exports.currentCycle,
				toCoop: true
			})
			
			.save(function(e, invoice) {
							console.log(invoice.total)
							if (e) done(e);
							else done(null, invoice);
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

			mailData = {
				name: producer._id.name,
				dueDate: invoice.dueDate,
				code: invoice._id,
				items: invoice.items,
				total: invoice.total,
				account: producer._id.producerData.bankAccount
			};
			
			mail = new Emailer(mailOptions, mailData);

			mail.send(function(err, result) {
				if (err) done(err);
				else {
					console.log("Message sent to producer " + producer._id.name);
					done(null, result);
				}
			});
		}
		
	],function(error) {
		console.log(error);
	});
};



// increment the number of cycles by 1 and set the ID to the total +1 (just like with invoices);
// use Cycle number 0 for testing stuff
function incrementCycle() {
	models.Cycle.findById("orderCycle").exec(function(e, cycle) {
		if (e) console.log(e) 
		else {
			if ( cycle && Date.equals(Date.today(), Date.parse(cycle.dateModified).clearTime()) ) console.log("cycle already incremented today")
			else {
				models.Cycle.findByIdAndModify({_id: 'orderCycle'},{ dateModified: Date.now(), $inc: {seq: 1} }, function(err, cycle){
					console.log(cycle);
					if (!err) {
						config.cycleReset('today');
						exports.currentCycle = cycle.seq;
					}
					else console.log(err);
				});	
			}
		}
	})
	
};

function findCycle() {
	models.Cycle.findById('orderCycle', function(e, cycle) {
		exports.currentCycle = cycle.seq;
		console.log("the current cycle is #" + exports.currentCycle);
		if (e) console.log(e);
	});
};

findCycle();


