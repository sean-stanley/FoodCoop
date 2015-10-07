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
		// Deprecated
		// alertProducer(order);
		// emailCustomer(order);
		invoiceCustomer(order);
		invoiceProducer(order);
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


// deprecated. Orders cannot be edited
// exports.update = function(req, res, next) {
// 	MeatOrder.findById(req.body._id, function(err, order) {
// 		order = _.merge(order, req.body);
// 		//save product
// 		order.save(function(err, order) {
// 			if (err) return next(err);
// 			if (req.query.invoice && order.weight > 0 && order.deliveryInstructions) {
// 					invoiceCustomer(order);
// 					invoiceProducer(order);
// 					res.json(order);
// 			} else if (req.query.invoice) {
// 				order.invoice = false;
// 				order.save();
// 				res.status(403).send("Could not send invoice, weight or delivery instructions are missing");
// 			} else res.json(order);
// 		});
// 	});
// };

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

function invoiceCustomer(order) {
	async.waterfall([
		function (done) {
			var invoice = new Invoice({
				dueDate: moment().add(7, 'd').format(),
				meatOrder: order._id,
				invoicee: order.customer.id,
				title: order.product.name + ' order through the NNFC',
				items: [{
					cost: order.priceWithMarkup,
					name: order.product.name
				}],
			});

			// Deprecated
			// if (order.fixedPrice) {
			// 	invoice.items.push({
			// 		cost: order.fixedPrice,
			// 		name: 'Processing Fee',
			// 	});
			// }

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
				items: invoice.items,
				total: order.priceWithMarkup,
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
			var produce
			var invoice = new Invoice({
				dueDate: moment().add(28, 'd').format(),
				meatOrder: order._id,
				toCoop: true,
				invoicee: order.supplier,
				title: order.product.name + ' order for ' + order.customer.name + ' at the NNFC',
				items: [{
					cost: order.price,
					name: order.product.name
				}],
				bankAccount: order.supplier.producerData.bankAccount
			});

			// Not using Fixed Costs any more
			// if (order.fixedPrice) {
			// 	invoice.items.push({
			// 		cost: order.fixedPrice,
			// 		name: 'Processing Fee',
			// 	});
			// }

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
				items: invoice.items,
				total: order.price,
				instructions: order.instructions,
				account: invoice.bankAccount,
				deliveryInstructions: order.deliveryInstructions
			};

			mail = new Emailer(mailOptions, mailData);


			mail.send(function(err, result) {
				if (err) log.error(err);
				else {
					log.info(result);
				}
			});
			done(); //send response right away instead of waiting for emails
		}
	], function(error) {
		if (error) log.error(error);
	});
}
