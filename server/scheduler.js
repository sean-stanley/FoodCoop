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
					config.cycle.canUpload = true;	
					break;
				case 'ProductUploadStop':
					config.cycle.canUpload = false;	
					break;
				case 'ShoppingStart':
					config.cycle.canShop = true;	
					break;
				case 'ShoppingStop':
					// checkout everyone's purchases
					checkout();	
					break;
				case 'PaymentDueDay':
					
					break;
				case 'DeliveryDay':
					// send reminder emails
					break;
				case 'testDay':
					console.log('Now what do I do on test day?');
					break;
				default:
					// no functions to execute for this day
					null
				}
			
			}
			// if the date is between the productUploadStart date and the productUpoad Stop date
			// double check that canShop is false and canUpload is true;
			else if ( today.between(cycle.ProductUploadStart, cycle.ProductUploadStop) ) {
				config.cycle.canUpload = true;
				config.cycle.canShop = false;
			}
		
			// if the date is between the ShoppingStart date and the ShoppingStop Stop date
			// double check that canShop is true and canUpload is false;
			else if ( today.between(cycle.ShoppingStart, cycle.ShoppingStop) ) {
				config.cycle.canShop = true;
				config.cycle.canUpload = false;
			}
			
		}
	}
};

// looks for all the orders of the cycle and groups them by customer
function checkout() {
	models.Order
	.aggregate().match({cycle: exports.currentCycle})
	.group({ _id: "$customer", orders: { $push : {product: "$product", quantity: "$quantity"} }})
	.exec(function(e, customers) {
		if (!e) {
			console.log(customers);
			// for each customer who has orders this cycle...
			customers.forEach(function(customer) {
				customer.orders.forEach(function(i) {
					console.log(i);
				})
				//invoiceCustomer(customer);
			});
		}
		
		console.log(e);
	})
};

// called by checkout(). Creates 
function invoiceCustomer(customer) {
	async.waterfall([
		function(done) {
			models.Invoice.count(function(e, count) {
				done(e, count);
			});
		},
		function(count, done) {
			customer.orders.forEach(function(order, idx) {
				models.Product.findById(order.product, 'fullName variety productName priceWithMarkup price units refrigeration -_id', function(e, product) {
					if (e) done(e);
					customer.orders[idx].product = product;
					customer.orders[idx].name = product.fullName;
					customer.orders[idx].cost = customer.orders[idx].product.priceWithMarkup * customer.orders[idx].quantity;
					done(null, count);
				});
			})
			
		},
		
		// look up customer name and email and save it to the @customer param
		
		function(count, done) {
			models.Invoice.create({
				_id: count +1,
				dueDate: config.cycle.PaymentDueDay,
				invoicee: customer._id,
				title: "Shopping Order for " + Date.today().toString("MMMM"),
				items: customer.orders,
				cycle: exports.currentCycle,
			}, 
			function(e, invoice) {
				if (e) done(e);
					
			})
		},
		
		// email the customer their invoice
		
	],function(error) {
		console.log(error);
	});
};


// increment the number of cycles by 1 and set the ID to the total +1 (just like with invoices);
// use Cycle number 0 for testing stuff
function incrementCycle() {
	models.Cycle.count(function(e, count){
		if (!e) {
			console.log(count);
			models.Cycle.create({_id: count ++ || 0}, function(err, cycle){
				console.log(cycle);
				if (!err) {
					exports.currentCycle = cycle._id;
				}
				else console.log(err);
			});
		}
		else console.log(e);
		
	});	
};

models.Cycle.count(function(e, count) {
	exports.currentCycle = count;
	checkout();
	console.log(exports.currentCycle);
	if (e) console.log(e);
});


