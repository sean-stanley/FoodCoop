var Invoice = require('./../models/invoice'),
MeatOrder = require('./../models/meatOrder'),
User = require('./../models/user'),
Emailer = require('./../emailer.js'),
moment = require('moment'),
async = require('async'),
bunyan = require('bunyan'),
log = bunyan.createLogger({
	name: 'meat orders',
	serializers: {
		req: bunyan.stdSerializers.req,
		err: bunyan.stdSerializers.err,
		e: bunyan.stdSerializers.err,
		res: bunyan.stdSerializers.res,
		error: bunyan.stdSerializers.err
	}
}),
ObjectId = require('mongoose').Types.ObjectId,
_ = require('lodash');

//missing invoice

// MeatOrder.findById("555d568b424e806d3ae2922d", function(err, order) {
// 	if (err) log.warn(err);
// 	invoiceCustomer(order);
// 	invoiceProducer(order);
// });


exports.meatOrder = function(req, res, next, id) {
	MeatOrder.findById(id, function(err, order) {
		if (err) return next(err);
		req.meatOrder = order;
		next();
	});
};

exports.create = function(req, res, next) {
	var order;
	order = new MeatOrder(req.body);
	order.save(function(err, order) {
		if (err) {
			log.info(err);
			return res.status(403).send(err.message);
		}
		log.info({success: true, order: order._id});
		alertProducer(order);
		emailCustomer(order);
		res.json(order);
	});
};

exports.me = function(req, res, next) {
	MeatOrder.find({supplier: new ObjectId(req.user._id)})
	.exec(function(err, orders) {
		if (err) return next(err);
		res.json(orders);
	});
};

exports.cart = function(req, res, next) {
	MeatOrder.find({'customer.id': new ObjectId(req.user._id)})
	.exec(function(err, orders) {
		if (err) return next(err);
		res.json(orders);
	});
};


// send invoice if param invoice is truthy
exports.update = function(req, res, next) {
	MeatOrder.findById(req.body._id, function(err, order) {
		order = _.merge(order, req.body);
		//save product
		order.save(function(err, order) {
			if (err) return next(err);
			if (req.query.invoice && order.weight > 0 && order.deliveryInstructions) {
					invoiceCustomer(order);
					invoiceProducer(order);
					res.json(order);
			} else if (req.query.invoice) {
				order.invoice = false;
				order.save();
				res.status(403).send("Could not send invoice, weight or delivery instructions are missing");
			} else res.json(order);
		});
	});
};

exports.delete = function(req, res, next) {
	var order = req.meatOrder;
	//delete product
	order.remove(function(err) {
		if (err) return next(err);
		res.status(200).end();
	});
};


exports.show = function(req, res) {
	res.json(req.meatOrder);
};

function alertProducer(order) {
	var mailOptions, mailData, update;
	order.populate('supplier', 'name email producerData.companyName', function(err, order) {
		mailOptions = {
			template:'butchery/new-meat-order',
			subject: 'New order of ' + order.product.name + ' from the NNFC',
			to: {
				email: order.supplier.email,
				name: order.supplier.name
			}
		};
		mailData = {
			datePlaced: moment(order.datePlaced).format('MMMM Do YYYY, h:mm:ss a'),
			name: order.supplier.name,
			customer: order.customer,
			productName: order.product.name,
			unitPrice: '$' + order.unitPrice.toFixed(2),
			instructions: order.instructions
		};
		update = new Emailer(mailOptions, mailData);

		if (process.env.NODE_ENV==='production') {
			update.send(function(err, result) {
				if (err) log.warn(err);
				log.info('message sent about new item to be %s', order.customer.email);
			});
		} else log.info({update: update});


	});
}

function emailCustomer(order) {
	var mailOptions, mailData, mail;
	mailOptions = {
		template: 'butchery/customer-meat-order',
		subject: 'Bulk ' + order.product.name + ' order',
		to: {
			email: order.customer.email,
			name: order.customer.name
		}
	};
	mailData = {
		datePlaced: moment(order.datePlaced).format('MMMM Do YYYY, h:mm:ss a'),
		name: order.customer.name,
		productName: order.product.name,
		unitPrice: '$' + order.unitPriceWithMarkup.toFixed(2),
		instructions: order.instructions
	};
	mail = new Emailer(mailOptions, mailData);

	if (process.env.NODE_ENV==='production') {
		mail.send(function(err, result) {
			if (err) log.warn(err);
			log.info('message sent about bulk meat order to %s', order.customer.email);
		});
	} else log.info({mail: mail});
}

function invoiceCustomer(order) {
	async.waterfall([
		function (done) {
			var invoice = new Invoice({
				dueDate: moment().add(7, 'd').format(),
				meatOrder: order._id,
				invoicee: order.customer.id,
				title: order.product.name + ' order from the NNFC',
				items: [{
					cost: order.totalWithMarkup,
					name: order.product.name + ' @ $' + order.unitPriceWithMarkup.toFixed(2) + '/ kg (' + order.weight + ' kg)'
				}],
			});

			if (order.fixedPrice) {
				invoice.items.push({
					cost: order.fixedPrice,
					name: 'Processing Fee',
				});
			}

			invoice.save(function(err, invoice){
				done(err, invoice);
			});
		},
		function(invoice, done) {
			var mailOptions, mailData, mail;
			mailOptions = {
				template: 'butchery/customer-meat-invoice',
				subject: 'Invoice for ' + order.product.name + ' from the NNFC',
				to: {
					email: order.customer.email,
					name: order.customer.name
				},
			};

			mailData = {
				name: order.customer.name,
				dueDate: moment(invoice.dueDate).format('dddd DD MMMM YYYY'),
				code: invoice._id,
				product: order.product.name,
				weight: order.weight,
				items: invoice.items,
				total: order.totalWithMarkup + (order.fixedPrice || 0),
				account: invoice.bankAccount,
				instructions: order.instructions,
				deliveryInstructions: order.deliveryInstructions
			};

			mail = new Emailer(mailOptions, mailData);

			mail.send(function(err, result) {
				if (err) done(err);
				// a response is sent so the client request doesn't timeout and get an error.
				else {
					done(null);
				}
			});
		}

	], function(error) {
		log.warn(error);
	});
}

function invoiceProducer(order) {
	async.waterfall([
		function(done) {
			order.populate('supplier', 'producerData.bankAccount name email', function(err, order) {
				if (err) return done(err);
				if (!order) return done('No producer exists for that order');
				done(null);
			});
		},
		function (done) {
			var invoice = new Invoice({
				dueDate: moment().add(14, 'd').format(),
				meatOrder: order._id,
				toCoop: true,
				invoicee: order.supplier,
				title: order.product.name + ' order for ' + order.customer.name + ' at the NNFC',
				items: [{
					cost: order.total,
					name: order.product.name + ' @ $' + order.unitPrice.toFixed(2) + '/ kg (' + order.weight + ' kg)'
				}],
				bankAccount: order.supplier.producerData.bankAccount
			});

			if (order.fixedPrice) {
				invoice.items.push({
					cost: order.fixedPrice,
					name: 'Processing Fee',
				});
			}

			invoice.save(function(err, invoice){
				done(err, invoice);
			});
		},
		function(invoice, done) {
			var mailOptions, mailData, mail;
			mailOptions = {
				template: 'butchery/producer-meat-invoice',
				subject: 'Confirmed Order for ' + order.product.name + ' from the NNFC',
				to: {
					email: order.supplier.email,
					name: order.supplier.name
				},
			};

			mailData = {
				name: order.supplier.name,
				dueDate: moment(invoice.dueDate).format('dddd DD MMMM YYYY'),
				code: invoice._id,
				product: order.product.name,
				weight: order.weight,
				items: invoice.items,
				total: order.total + (order.fixedPrice || 0),
				instructions: order.instructions,
				account: invoice.bankAccount,
				deliveryInstructions: order.deliveryInstructions
			};

			mail = new Emailer(mailOptions, mailData);


			mail.send(function(err, result) {
				if (err) done(err);
				// a response is sent so the client request doesn't timeout and get an error.
				else {
					done(null);
				}
			});
		}
	], function(error) {
		if (error) log.warn(error);
	});
}
