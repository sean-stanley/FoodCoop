var Emailer = require('./emailer')
, config = require('./coopConfig')
, moment = require('moment');

require('datejs');
	
	// globals
var mailOptions
, mailData
, mail

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
		subject: Date.today().toString('MMMM') + ' Products Requested for ' + config.coopName,
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