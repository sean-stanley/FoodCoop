var config = require('./coopConfig.js'),
	cycle = config.cycle,
	async = require('async'),
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

// check for events in the order cycle every day at 1am

var orderCycleChecker = schedule.scheduleJob({hour:1, minute: 0}, checkConfig);

// schedule emails to send alerting members that it is delivery day.
// To be executed at 9:15am Wednesday;
function checkConfig() {
	var today = new Date();
	today.setHours(0, 0, 0, 0);

	checkCycle(today, function(err, cycle) {
		if (err) {
			console.log(err);
		}
		console.log(Date() + '. Constructing cycle object from DB results');
		var shoppingStart = Date.parse(cycle.shoppingStart);
		var shoppingStop = Date.parse(cycle.shoppingStop);
		var deliveryDay = Date.parse(cycle.deliveryDay);

		exports.canShop = false;

		if ( today.equals( shoppingStart ) ) {
			console.log('today is a shopping day');
			exports.canShop = true;
		} else if (today.equals(cycle.shoppingStop) ) {
			console.log('Today everyone is invoiced');
			// checkout everyone's purchases
			exports.checkout();
			// send order requests to producers
			exports.orderGoods();
		} else if (today.between( shoppingStart, shoppingStop) ) {
			console.log('today is a shopping day');
			exports.canShop = true;
		}

		else if (today.equals(deliveryDay) ) {
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
		function(customers, done) {
			models.User.populate(customers, {path: '_id', select: 'name email routeTitle balance user_type.name'}
			, function(e, result){
				done(e, result);
			});
		}
	],function(e, result){
		if (e) console.log(e);
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

			invoice.populate('items.product', 'fullName variety productName priceWithMarkup price units refrigeration', function(e, invoice) {
				if (e) return done(e);
				invoice.save(function(e, invoice){
					done(e, invoice);
					console.log('Invoice #%s saved for %s and has a total of %s', invoice._id, customer._id.name, invoice.total);
				});
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

			mailData = {
				name: customer._id.name,
				dueDate: Date.parse(exports.currentCycle.shoppingStop).addDays(5).toString('ddd dd MMMM yyyy'),
				deliveryDay: Date.parse(exports.currentCycle.deliveryDay).toString('ddd dd MMMM yyyy'),
				code: invoice._id,
				items: invoice.items,
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
	console.log('beginning ordering from producers');
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

		function(producers, done) {
			models.User.populate(producers, {path: '_id', select: 'name email producerData.bankAccount balance'}
			, function(e, result){
				done(e, result);
			});
		}
	],function(e, result){
		if (e) {
			console.log(e);
		} else {
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

			invoice.populate('items.customer', 'name email routeTitle balance')
			.populate('items.product', 'fullName variety productName price units refrigeration', function(e, invoice) {
				if (e) return done(e);
				invoice.save(function(e, invoice) {
					done(e, invoice);
				});
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

			mailData = {
				name: producer._id.name,
				dueDate: Date.parse(exports.currentCycle.deliveryDay).addDays(4).toString('ddd dd MMMM yyyy'),
				deliveryDay: Date.parse(exports.currentCycle.deliveryDay).toString('ddd dd MMMM yyyy'),
				code: invoice._id,
				items: invoice.items,
				total: invoice.total,
				account: producer._id.producerData.bankAccount
			};

			mail = new Emailer(mailOptions, mailData);


			mail.send(function(err, result) {
				if (err) {
					done(err);
				} else {
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

//
function consolidateAmountSold () {
	models.Product.find({amountSold: {$gt: 0 } }, 'quantity amountSold productName variety fullName cycle', function(err, products) {
		if (err) return console.log(err);

		async.each(products, function(product, done) {
			var amount;
			models.Order.find({product: product._id}, 'quantity product', function(err, orders) {
				if (err) return done(err);

				if (orders === null) {
					//console.log(product.fullName + ' has never been ordered for cycle #' + product.cycle);
					product.amountSold = 0;
					product.save(function(err) {
						if (err) return console.log(err);
						done();
					});
				} else {
					var total = _.reduce(orders, function(sum, order) {
						return sum + order.quantity;
					}, 0);
					//console.log(product.fullName + ' has been ordered ' + total + ' times for cycle #' + product.cycle);

					product.amountSold = total;
					product.save(function(err) {
						if (err) return console.log(err);
						done();
					});
				}
			});
		}, function(err) {
			if (err) return console.log(err);
			console.log('consolidation complete');
		});

	});
}

checkConfig();
//consolidateAmountSold();
//disableCycle();
