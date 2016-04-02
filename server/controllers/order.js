var models = require('./../models')
, scheduler = require('./../scheduler')
, async = require('async')
, moment = require('moment')
, _ = require('lodash')
;

//middleware
exports.isArray = function(req, res, next) {
	if (_.isArray(req.body)) req.orders = req.body;
	else req.order = req.body;
	next();
};

exports.validateOrder = function(req, res, next) {
	if (req.orders) {
		async.each(req.orders, function(order, next) {
			if (order.customer == order.supplier) {
				next(1);
			} else next();
		}, function(err) {
			if (err) return res.status(403).send('Sorry, you can\'t try to buy your own products');
			next();
		});
	} else {
		if (req.order.customer == req.order.supplier) return res.status(403).send('Sorry, you can\'t try to buy your own products');
		//all good
		next();
	}
};

exports.quantityValidator = function(req, res, next) {
	if (req.orders) {
		async.each(req.orders, product, function(err) {
			next(err);
		});
	} else product(req.order, next);
};

exports.addCycle = function(req, res, next) {
	if (req.orders) {
		async.map(req.orders, orderMap, function(err, result) {
			req.orders = result;
			next();
		});
	} else {
		req.order.cycle = scheduler.currentCycle._id;
		next();
	}
};

exports.create = function(req, res, next) {
	var order = req.hasOwnProperty('order') ? req.order : req.orders;
	models.Order.create(order, function(err, newOrder) {
		if (err) return next(err);
		models.Order.populate(newOrder, [
			{path:'product', select: 'units fullName productName variety'},
			{path: 'supplier', select: 'name email producerData.companyName'}
		]
		, function(e, result) {
			if (e) return next(e);
			res.json(result);
		});
	});
};

function product(order, callback) {
	models.Product.findByIdAndUpdate(order.product,
		{
			$inc: {
				amountSold : order.quantity,
				quantity: -order.quantity
			}
		}
	)
	.select('amountSold quantity variety productName fullName')
	.exec(function(e, product) {
		if (e) return callback(e);
		if (product.quantity >= 0) {
			callback(null);
		}
		else {
			product.amountSold -= order.quantity;
			product.quantity += order.quantity;
			product.save(function(err) {
				if (err) log.info(err);
				var error = new Error('you can\'t buy that many. Insufficient quantity available.');
				callback(error);
			});
		}
	});
}

function orderMap(order, callback) {
	order.cycle = scheduler.currentCycle._id;
	callback(null, order);
}
