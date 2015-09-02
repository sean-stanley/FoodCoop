/* jshint -W079 */
'use strict';

 var models = require('./../models.js')
  , Emailer = require('./../emailer.js')
  , moment = require('moment')
  , async = require('async')
  , ObjectId = require('mongoose').Types.ObjectId
  , _ = require('lodash');


var validOrder = {
  datePlaced: new Date(),
  unitPrice: 10,
  fixedPrice: 55,
  markup: 5,
  supplier: "5546bbf9641453ae40d1840d", // John Smith Producer
  customer: {
    id: "53e459a6d08d768e066f4ddc",
    name: 'Phillip Smith',
    email: 'tester-permanent2@testing.com'
  },
  product: {
    id: '55403b4b23d10e9178ee4087', //lamb
    name: 'lamb'
  },
  instructions: {
    "shoulders": "Chops",
    "loin": "Racks",
    "legs": "halved",
    "flaps": "Roasts",
    "special": "Gluten free sausages and gluten free seasoning on shoulders."
  },
}

var order = null;

describe('MeatOrder Collection', function() {
  it('should be able to save valid json to MeatOrder Collection', function(next) {
    models.MeatOrder.create(validOrder, function(err, order) {
      expect(err).toBeNull;
      expect(order.unitPrice).toBe(10);
      expect(order.unitPriceWithMarkup).toBe(10.5);
      next();
      order.remove();
    });
  });
});

describe('MeatOrder Object emails', function() {
  beforeEach(function(next) {
    models.MeatOrder.create(validOrder, function(err, o) {
      order = o;
      next();
    });
  });

  it('should go to producer', function(next) {
    var mailOptions, mailData, update;
  	order.populate('supplier', 'name email producerData.companyName', function(err, order) {
  		expect(err).toBeNull;
      expect(order.supplier.name).toBe('John Smith Producer');
      expect(order.supplier.email).toBe("tester-permanent@testing.com");

      mailOptions = {
  			template:'butchery/new-meat-order',
  			subject: 'New order of ' + order.product.name + ' from the NNFC',
  			to: {
  				email: 'sean@maplekiwi.com',// order.supplier.email,
  				name: 'Sean Stanley',// order.supplier.name
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

  		update.send(function(err, result) {
				if (err) log.warn(err);
				log.info('message sent about new item to be %s', order.supplier.email);
			});

      order.remove(function() {
        next();
      });
  	});
  })
});

// // send invoice if param invoice is truthy
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
//
// exports.delete = function(req, res, next) {
// 	var order = req.meatOrder;
// 	//delete product
// 	order.remove(function(err) {
// 		if (err) return next(err);
// 		res.status(200).end();
// 	});
// };
//
//
// exports.show = function(req, res) {
// 	res.json(req.meatOrder);
// };
//
// function alertProducer(order) {
// 	var mailOptions, mailData, update;
// 	order.populate('supplier', 'name email producerData.companyName', function(err, order) {
// 		if (err) {
// 			order.remove();
// 			log.err('Meat Order Supplier not found. Error.')
// 			return
// 		}
// 		mailOptions = {
// 			template:'butchery/new-meat-order',
// 			subject: 'New order of ' + order.product.name + ' from the NNFC',
// 			to: {
// 				email: order.supplier.email,
// 				name: order.supplier.name
// 			}
// 		};
// 		mailData = {
// 			datePlaced: moment(order.datePlaced).format('MMMM Do YYYY, h:mm:ss a'),
// 			name: order.supplier.name,
// 			customer: order.customer,
// 			productName: order.product.name,
// 			unitPrice: '$' + order.unitPrice.toFixed(2),
// 			instructions: order.instructions
// 		};
// 		update = new Emailer(mailOptions, mailData);
//
// 		if (process.env.NODE_ENV==='production') {
// 			update.send(function(err, result) {
// 				if (err) log.warn(err);
// 				log.info('message sent about new item to be %s', order.supplier.email);
// 			});
// 		} else log.info({update: update});
// 	});
// }
//
// function emailCustomer(order) {
// 	var mailOptions, mailData, mail;
// 	mailOptions = {
// 		template: 'butchery/customer-meat-order',
// 		subject: 'Bulk ' + order.product.name + ' order',
// 		to: {
// 			email: order.customer.email,
// 			name: order.customer.name
// 		}
// 	};
// 	mailData = {
// 		datePlaced: moment(order.datePlaced).format('MMMM Do YYYY, h:mm:ss a'),
// 		name: order.customer.name,
// 		productName: order.product.name,
// 		unitPrice: '$' + order.unitPriceWithMarkup.toFixed(2),
// 		instructions: order.instructions
// 	};
// 	mail = new Emailer(mailOptions, mailData);
//
// 	if (process.env.NODE_ENV==='production') {
// 		mail.send(function(err, result) {
// 			if (err) log.warn(err);
// 			log.info('message sent about bulk meat order to %s', order.customer.email);
// 		});
// 	} else log.info({mail: mail});
// }
//
// function invoiceCustomer(order) {
// 	async.waterfall([
// 		function (done) {
// 			var invoice = new Invoice({
// 				dueDate: moment().add(7, 'd').format(),
// 				meatOrder: order._id,
// 				invoicee: order.customer.id,
// 				title: order.product.name + ' order from the NNFC',
// 				items: [{
// 					cost: order.totalWithMarkup,
// 					name: order.product.name + ' @ $' + order.unitPriceWithMarkup.toFixed(2) + '/ kg (' + order.weight + ' kg)'
// 				}],
// 			});
//
// 			if (order.fixedPrice) {
// 				invoice.items.push({
// 					cost: order.fixedPrice,
// 					name: 'Processing Fee',
// 				});
// 			}
//
// 			invoice.save(function(err, invoice){
// 				done(err, invoice);
// 			});
// 		},
// 		function(invoice, done) {
// 			var mailOptions, mailData, mail;
// 			mailOptions = {
// 				template: 'butchery/customer-meat-invoice',
// 				subject: 'Invoice for ' + order.product.name + ' from the NNFC',
// 				to: {
// 					email: order.customer.email,
// 					name: order.customer.name
// 				},
// 			};
//
// 			mailData = {
// 				name: order.customer.name,
// 				dueDate: moment(invoice.dueDate).format('dddd DD MMMM YYYY'),
// 				code: invoice._id,
// 				product: order.product.name,
// 				weight: order.weight,
// 				items: invoice.items,
// 				total: order.totalWithMarkup + (order.fixedPrice || 0),
// 				account: invoice.bankAccount,
// 				instructions: order.instructions,
// 				deliveryInstructions: order.deliveryInstructions
// 			};
//
// 			mail = new Emailer(mailOptions, mailData);
//
// 			mail.send(function(err, result) {
// 				if (err) done(err);
// 				// a response is sent so the client request doesn't timeout and get an error.
// 				else {
// 					done(null);
// 				}
// 			});
// 		}
//
// 	], function(error) {
// 		log.warn(error);
// 	});
// }
//
// function invoiceProducer(order) {
// 	async.waterfall([
// 		function(done) {
// 			order.populate('supplier', 'producerData.bankAccount name email', function(err, order) {
// 				if (err) return done(err);
// 				if (!order) return done('No producer exists for that order');
// 				done(null);
// 			});
// 		},
// 		function (done) {
// 			var invoice = new Invoice({
// 				dueDate: moment().add(14, 'd').format(),
// 				meatOrder: order._id,
// 				toCoop: true,
// 				invoicee: order.supplier,
// 				title: order.product.name + ' order for ' + order.customer.name + ' at the NNFC',
// 				items: [{
// 					cost: order.total,
// 					name: order.product.name + ' @ $' + order.unitPrice.toFixed(2) + '/ kg (' + order.weight + ' kg)'
// 				}],
// 				bankAccount: order.supplier.producerData.bankAccount
// 			});
//
// 			if (order.fixedPrice) {
// 				invoice.items.push({
// 					cost: order.fixedPrice,
// 					name: 'Processing Fee',
// 				});
// 			}
//
// 			invoice.save(function(err, invoice){
// 				done(err, invoice);
// 			});
// 		},
// 		function(invoice, done) {
// 			var mailOptions, mailData, mail;
// 			mailOptions = {
// 				template: 'butchery/producer-meat-invoice',
// 				subject: 'Confirmed Order for ' + order.product.name + ' from the NNFC',
// 				to: {
// 					email: order.supplier.email,
// 					name: order.supplier.name
// 				},
// 			};
//
// 			mailData = {
// 				name: order.supplier.name,
// 				dueDate: moment(invoice.dueDate).format('dddd DD MMMM YYYY'),
// 				code: invoice._id,
// 				product: order.product.name,
// 				weight: order.weight,
// 				items: invoice.items,
// 				total: order.total + (order.fixedPrice || 0),
// 				instructions: order.instructions,
// 				account: invoice.bankAccount,
// 				deliveryInstructions: order.deliveryInstructions
// 			};
//
// 			mail = new Emailer(mailOptions, mailData);
//
//
// 			mail.send(function(err, result) {
// 				if (err) done(err);
// 				// a response is sent so the client request doesn't timeout and get an error.
// 				else {
// 					done(null);
// 				}
// 			});
// 		}
// 	], function(error) {
// 		if (error) log.warn(error);
// 	});
// }
