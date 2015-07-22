var Emailer = require('./emailer')
, config = require('./coopConfig')
, moment = require('moment');

require('datejs');

	// globals
var mailOptions
, mailData
, mail;

// the invoice argument must have the following paths populated:
// 		cycle, items.product, items.customer, invoicee

exports.shopping = function(invoice, done) {
	var customer = invoice.invoicee;
	mailOptions = {
		template: 'shopping-invoice',
		subject: 'Thank you for shopping locally this ' + moment().format('MMM'),
		to: {
			email: customer.email,
			name: customer.name
		}
	};

	mailData = {
		name: customer.name,
		dueDate: moment(invoice.cycle.shoppingStop).add(5, 'd').format('DD MMMM YYYY'),
		deliveryDay: moment(invoice.cycle.deliveryDay).format('DD MMMM YYYY'),
		code: invoice._id,
		items: invoice.items,
		total: invoice.total,
		account: config.bankAccount
	};

	mail = new Emailer(mailOptions, mailData);

	mail.send(function(err, result) {
		if (err) return done(err);
		done(null, result.response);
	});
};

exports.producer = function(invoice, done) {
	var producer = invoice.invoicee;
	mailOptions = {
		template: 'producer-invoice',
		subject: moment().format('MMMM') + ' Products Requested for ' + config.coopName,
		to: {
			email: producer.email,
			name: producer.name
		}
	};

	mailData = {
		name: producer.name,
		dueDate: moment(invoice.cycle.deliveryDay).add(4, 'd').format('DD MMMM YYYY'),
		deliveryDay: moment(invoice.cycle.deliveryDay).format('DD MMMM YYYY'),
		code: invoice._id,
		items: invoice.items,
		total: invoice.total,
		account: producer.producerData.bankAccount
	};

	mail = new Emailer(mailOptions, mailData);

	mail.send(function(err, result) {
		if (err) return done(err);
		done(null, result.response);
	});
};

exports.member = function(invoice, done) {
	user = invoice.invoicee;
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
		password: "*************",
		discountCode: '',
		discount: ''
	};

	memberEmail = new Emailer(memberEmailOptions, memberEmailData);
	memberEmail.send(function(err, result) {
		if (err) return done(err);
		done(null, result.response);
	});
};

exports.meatCustomer = function(invoice, done) {
	var mailOptions, mailData, mail;

	mailOptions = {
		template: 'butchery/customer-meat-invoice',
		subject: 'Invoice for ' + invoice.meatOrder.product.name + ' from the NNFC',
		to: {
			email: invoice.invoicee.email,
			name: invoice.invoicee.name
		},
	};

	mailData = {
		name: invoice.invoicee.name,
		dueDate: moment(invoice.dueDate).format('dddd DD MMMM YYYY'),
		code: invoice._id,
		product: invoice.meatOrder.product.name,
		weight: invoice.meatOrder.weight,
		items: invoice.items,
		total: invoice.meatOrder.totalWithMarkup + (invoice.meatOrder.fixedPrice || 0),
		account: invoice.bankAccount,
		instructions: invoice.meatOrder.instructions,
		deliveryInstructions: invoice.meatOrder.deliveryInstructions
	};

	mail = new Emailer(mailOptions, mailData);

	mail.send(function(err, result) {
		if (err) done(err);
		// a response is sent so the client request doesn't timeout and get an error.
		else {
			done(null);
		}
	});
};

exports.meatProducer = function(invoice, done) {
	var mailOptions, mailData, mail;
	mailOptions = {
		template: 'butchery/producer-meat-invoice',
		subject: 'Confirmed Order for ' + invoice.meatOrder.product.name + ' from the NNFC',
		to: {
			email: invoice.invoicee.email,
			name: invoice.invoicee.name
		},
	};

	mailData = {
		name: invoice.invoicee.name,
		dueDate: moment(invoice.dueDate).format('dddd DD MMMM YYYY'),
		code: invoice._id,
		product: invoice.meatOrder.product.name,
		weight: invoice.meatOrder.weight,
		items: invoice.items,
		total: invoice.meatOrder.total + (invoice.meatOrder.fixedPrice || 0),
		instructions: invoice.meatOrder.instructions,
		account: invoice.bankAccount,
		deliveryInstructions: invoice.meatOrder.deliveryInstructions
	};

	mail = new Emailer(mailOptions, mailData);


	mail.send(function(err, result) {
		if (err) done(err);
		// a response is sent so the client request doesn't timeout and get an error.
		else {
			done(null);
		}
	});
};
