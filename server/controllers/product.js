var Product = require('./../models/product'),
Order = require('./../models/order'),
scheduler = require('./../scheduler'),
Emailer = require('./../emailer.js'),
async = require('async'),
bunyan = require('bunyan'),
log = bunyan.createLogger({
	name: 'product',
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

exports.product = function(req, res, next, id) {
	Product.findById(id, function(err, product) {
		if (err) return next(err);
		req.product = product;
		next();
	});
};

exports.fromBody = function(req, res, next) {
	Product.findById(req.body._id, function(err, product) {
		if (err) return next(err);
		if ( _.isEqual(req.user._id, product.producer_ID) || req.user.user_type.isAdmin ) {
			req.product = product;
			next();
		} else {
			return res.status(401).send('You can\'t edit someone else\'s product');
		}
	});
};

exports.removeID = function(req, res, next) {
	if (req.body._id) {
		delete req.body._id;
		delete req.body.amountSold;
	} next();
};

exports.create = function(req, res) {
	var lastProduct, p;
	req.body.amountSold = 0;
	if (_.isArray(req.body.cycle) ) {
		async.each(req.body.cycle, function(cycle, done) {
			var data = req.body;
			data.cycle = cycle;
			var product = new Product(data);
			product.save(function(err, product) {
				if (err) return done(err);
				lastProduct = product;
				done();
			});
		}, function(err) {
			if (err) return res.status(500).send(err);
			else res.json(lastProduct);
		});
	} else {
		if (req.body.cycle < scheduler.currentCycle._id) req.body.cycle = scheduler.currentCycle._id;

		p = new Product(req.body);

		p.save(function(err, product) {
			if (err) console.log(err);
			res.json(product);
		});
	}
};

// no longer needed
// exports.changePrice = function(req, res, next) {
// 	if (req.product.price !== req.body.price) {
// 		if (scheduler.canBuy) {
// 			req.body.price = req.product.price;
// 		}
// 	}
// 	next();
// };

exports.updateValidator = function(req, res, next) {
	if (_.isArray(req.body.cycle) ) {
		return res.status(403).send('Sorry you can\'t update your product with more than one delivery day specified.');
	} else if(req.product.cycle !== req.body.cycle && !req.body.permanent) {
		return res.status(403).send('Sorry you can\'t change a product\'s sale date once it\'s been created. Instead try uploading the product for a different sale date.');
	} else next();
};

exports.update = function(req, res) {
	var product = _.merge(req.product, req.body);

	//save product
	product.save(function(err) {
		if (err) return next(err);
		res.json(product);
	});
};

exports.publish = function(req, res) {
  var product = req.product;
  product.active = true;
	product.save(function(err) {
		if (err) return next(err);
		res.json(product);
	});
}

// exports.emailChange = function(req, res, next) {
// 	req.orders = [];
//
// 	Order.find({cycle: scheduler.currentCycle._id, product: new ObjectId(req.product._id) })
// 	.populate('customer', 'name email')
// 	.exec(function(err, orders){
// 		if (err) return next(err);
// 		if (!orders) return next();
// 		var mailData, mailOptions, update;
//
// 		//make orders available to other middleware
// 		req.orders = orders;
// 		next();
// 		async.each(orders, function(order, done) {
// 			mailOptions = {
// 				template: 'product-change',
// 				subject: 'Update to Product you are Ordering',
// 				to: {
// 					email: order.customer.email,
// 					name: order.customer.name
// 				}
// 			};
// 			mailData = {name: order.customer.name, productName: product.fullName, amount: order.quantity};
// 			update = new Emailer(mailOptions, mailData);
//
// 			update.send(function(err, result) {
// 				if (err) return done(err);
// 			});
// 			done();
// 		}, function(err) {
// 			if (err) log.warn(err);
// 		});
// 	});
// };

exports.quantityChange = function(req, res, next) {
	var totalAmount, amountToRemove;
	Order.find({cycle: scheduler.currentCycle._id, product: new ObjectId(req.product._id) })
	.populate('customer', 'name email').sort('-datePlaced quantity')
	.exec(function(err, orders){
		
		if (err) return next(err);
		req.orders = orders;
		// if the product quantity drops and there are orders for it, check if there is sufficient inventory to supply all orders
		if (req.product.quantity > req.body.quantity && req.orders.length > 0) {
			totalAmount = _.sum(_.pluck(req.orders, 'quantity'));
			if (totalAmount <= req.body.quantity) return next();
			else {
				amountToRemove = totalAmount - req.body.quantity;
				req.body.amountSold -= amountToRemove
				
				async.eachSeries(req.orders, function(order, done){
					if (amountToRemove <= 0) done('complete');
					
					else if (amountToRemove > order.quantity) {
						amountToRemove -= order.quantity;
						sendProductNotAvailableEmail(order);
						Order.findByIdAndRemove(order._id, function(err, result) {
							if (err) return done(err);
							log.info('deleted order of %s because of quantity change', product.fullName);
							if (amountToRemove > 0) done();
							else done('complete');

						});
					} else if (amountToRemove < order.quantity) {
						order.quantity -= amountToRemove;
						log.info('changed quantity of %s\'s order to be %s', order.customer.name, order.quantity);

						order.save(function(err, order) {
							if (err) return done(err);
							sendProductChangeAmountEmail(order);
							if (amountToRemove > 0) done();
							else done('complete');
						});
					}
				},function(result) {
					if (result !== 'complete') return next(result);
					log.info('all orders have been adjusted for product quantity change');
				});

			}
		}
		next();
	});
};

function sendProductNotAvailableEmail(order) {
	var mailOptions, mailData, update;
	mailOptions = {
		template: 'product-not-available',
		subject: product.productName + ' No Longer Available',
		to: {
			email: order.customer.email,
			name: order.customer.name
		}
	};
	mailData = {name: order.customer.name,
		productName: order.product.fullName,
		producerID: order.product.producer_ID
	};
	update = new Emailer(mailOptions, mailData);

	update.send(function(err, result) {
		if (err) log.warn(err);
		log.info('message sent about cart item removal to %s', order.customer.email);
	});
}

function sendProductChangeAmountEmail(order) {
	var mailOptions, mailData, update;
	mailOptions = {
		template: 'product-quantity-decreased',
		subject: 'The amount of ' + product.productName + ' in your cart has decreased',
		to: {
			email: order.customer.email,
			name: order.customer.name
		}
	};
	mailData = {
		name: order.customer.name,
		productName: order.product.fullName,
		amount: order.quantity,
		producerID: order.product.producer_ID
	};
	update = new Emailer(mailOptions, mailData);

	update.send(function(err, result) {
		if (err) log.warn(err);
		log.info('message sent about cart decreasing to %s', order.customer.email);
	});
}

exports.show = function(req, res) {
	res.json(req.product);
};
