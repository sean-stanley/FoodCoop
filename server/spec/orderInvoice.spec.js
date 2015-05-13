/* jshint -W079 */ 
'use strict';

var async = require('async') 
	, mongoose = require('mongoose')
	, models = require('./../models.js')
	, Emailer = require('./../emailer.js')
	, config = require('./../coopConfig.js')
	, discount = require('./../controllers/discount')
	, _ = require('lodash')
	, moment = require('moment');
		
	require('datejs');
	
	var customers;
	var producers;
	
	
	
	
//
	describe('checkout function', function() {
		beforeEach(function(done) {
			models.Order
			.aggregate()
			.match({cycle: 12})
			.group({ _id: '$customer', orders: { $push : {product: '$product', quantity: '$quantity'} }})
			.exec(function(e, group) {
				// customers is a plain javascript object not a special mongoose document.
				expect(e).toBeNull();
				customers = group;
				//done(e, customers);
				done();
			});
			
		});
		afterEach(function(done) {
			done();
		});
		it('should find the right orders for cycle 12', function(done) {
			
			expect(customers.length).toBe(2);
			expect(customers[0].orders.length).toBe(1);
			expect(customers[0].orders[0].product).not.toBeUndefined();
			
			done();
		});
		it('should be able to populate the product info', function(done) {
			models.Product.populate(customers, {path: 'orders.product', select: 'fullName variety productName priceWithMarkup price units refrigeration'}
			, function(e, result){
				expect(e).toBeNull();
				expect(result[0].orders[0].product.priceWithMarkup).toBeGreaterThan(result[0].orders[0].product.price);
				expect(result[1].orders[0].product.priceWithMarkup).toBeGreaterThan(result[1].orders[0].product.price);
				expect(result[1].orders[0].product.fullName).not.toBeUndefined();
				expect(result[1].orders[0].product.units).not.toBeUndefined();
				expect(result[1].orders[0].product.refrigeration).not.toBeUndefined();
				done();
			});
			
		});
		it('should be able to populate the customer info', function(done) {
			models.User.populate(customers, {path: '_id', select: 'name email routeTitle balance user_type.name'}
			, function(e, result){
				expect(e).toBeNull();
				expect(result[0]._id.name).not.toBeUndefined();
				expect(result[0]._id.email).not.toBeUndefined();
				expect(result[0]._id.user_type.name).not.toBeUndefined();
				
				done();
			});
		});
	});
	
	
	
	
	
	var customer = {
			_id: { 
					_id: '53e459a6d08d768e066f4ddc',
					email: 'sean@maplekiwi.com',
					name: 'Sean Stanley',
					routeTitle: 'West to Ruatangata',
					balance: null,
					routeManager: {},
					producerData: {},
					user_type: { name: 'Producer' } 
				},
					orders: [ { 
						// product: {
// 							_id: '54f28a5af31af0d43c683c37',
// 							price: 4,
// 							productName: 'Bread',
// 							units: 'loaf',
// 							refrigeration: 'none',
// 							variety: 'Gluten Free',
// 							fullName: 'Gluten Free Bread',
// 							priceWithMarkup: 4.4,
// 							id: '54f28a5af31af0d43c683c37' }, 
							product: '54f28a5af31af0d43c683c37',
							quantity: 1 } 
					] 
	};
				
	var invoice;
	
	
	describe('invoiceCustomer function', function() {
		beforeEach(function(done) {
			var date = Date.today().toString();
			invoice = new models.Invoice({
				dueDate: Date.parse(date).addDays(7).toString(),
				invoicee: customer._id._id,
				title: 'Shopping Order for ' + Date.today().toString('MMMM'),
				items: customer.orders,
				cycle: 12, // exports.currentCycle._id,
				deliveryRoute: customer._id.routeTitle || 'Whangarei'
			}); 
			
			done();
			
		});
		afterEach(function(done) {
			invoice.remove(function(err) {
				done();
			})
			
		});
		it('should be able to save an invoice and populate the products', function(done) {			
			invoice.populate('items.product', 'fullName variety productName priceWithMarkup price units refrigeration', function(err, invoice) {
				expect(err).toBeNull();
				expect(invoice.hasOwnProperty('save')).toBeTruthy();
				expect(isNaN(invoice.total)).not.toBeTruthy();
				
				invoice.save(function(err, invoice) {
					expect(err).toBeNull();
					expect(isNaN(invoice.total)).not.toBeTruthy();
					expect(invoice.cycle).toBe(12);
					expect(invoice.dueDate.toString()).toEqual(Date.today().addDays(7).toString());
					expect(invoice.items[0].product.fullName).toEqual('Gluten Free Bread');
					expect(invoice.items[0].product.priceWithMarkup).toBeGreaterThan(invoice.items[0].product.price);
					expect(invoice.items[0].product.units).toEqual('loaf');
					expect(invoice.hasOwnProperty('save')).toBeTruthy();
					done();
				});
			});
		});
		
		it('should be able to generate the data for the email template from the invoice', function(done) {
			invoice.populate('items.product', 'fullName variety productName priceWithMarkup price units refrigeration', function(err, invoice) {
				expect(invoice.hasOwnProperty('save')).toBeTruthy();
				expect(err).toBeNull();
								
			
				var mailData = {
						name: customer._id.name,
						dueDate: Date.parse(Date.today().toString()).addDays(5).toString('ddd dd MMMM yyyy'),
						code: invoice._id,
						items: invoice.items,
						subtotal: invoice.subtotal,
						total: invoice.total,
						account: config.bankAccount
					};
				expect(mailData.name).toBe('Sean Stanley');
				expect(mailData.dueDate).toEqual(Date.today().addDays(5).toString('ddd dd MMMM yyyy'));
				expect(mailData.code).toBeUndefined() // since the invoice is unsaved;
				
				expect(mailData.items.length).toBe(1);
				expect(mailData.items[0].product.fullName).toBe('Gluten Free Bread');
				expect(mailData.items[0].product.price).toBe(4);
				
				expect(mailData.subtotal).toBe(4.4)
				expect(mailData.total).toBe(4.4)
				
				expect(mailData.account).toBe('02-1248-0425752-001');
				
				done();
				
			});
		});
	});
	

	
	describe('orderGoods function', function() {
		beforeEach(function(done) {
			models.Order
			.aggregate()
			.match({cycle: 12})
			.group({ _id: '$supplier', orders: { $push : {product: '$product', customer: '$customer', quantity: '$quantity'} }})
			.exec(function(e, group) {
				// producers is a plain javascript document not a special mongoose document.
				expect(e).toBeNull();
				producers = group;
				done();
			});
		});
		afterEach(function(done) {
			done();
		});
		it('should find the right orders for cycle 12', function(done) {
			
			expect(producers.length).toBe(2);
			expect(producers[0].orders.length).toBe(1);
			expect(producers[0].orders[0].product).not.toBeUndefined();
			
			done();
		});
		it('should be able to populate the supplier info', function(done) {
			models.User.populate(producers, {path: '_id', select: 'name email producerData.bankAccount balance'}
			, function(e, result){
				expect(e).toBeNull();
				expect(result[0]._id.name).not.toBeUndefined();
				expect(result[0]._id.email).not.toBeUndefined();
				expect(result[0]._id.producerData.bankAccount).not.toBeUndefined();
				done();
			});
		});
	});
	
	var producer = { _id: 
   { _id: '53e459a6d08d768e066f4ddc',
     email: 'sean@maplekiwi.com',
     name: 'Sean Stanley',
     balance: null,
     routeManager: {},
     producerData: { bankAccount: '02-1232-0054-205-00' },
     user_type: {} },
  orders: 
   [ { product: '54efecac3434e93531e28524',
       customer: '535e107876dc96914a743e73',
       quantity: 1 } ] }
			 
	
	describe('invoiceFromProducer function', function() {
		beforeEach(function(done) {
			var date = Date.today().toString();
			invoice = new models.Invoice({
				dueDate: Date.parse(date).addDays(12).toString('ddd dd MMMM yyyy'),
				invoicee: producer._id._id,
				title: 'Products Requested for ' + Date.today().toString('MMMM'),
				items: producer.orders,
				cycle: 12,
				toCoop: true,
				bankAccount: producer._id.producerData.bankAccount || 'NO ACCOUNT ON RECORD'
			}); 
			
			done();
			
		});
		afterEach(function(done) {
			invoice.remove(function(err) {
				done();
			});
			
		});
		it('should be able to save an invoice and populate the products', function(done) {			
			invoice
			.populate('items.customer', 'name email routeTitle balance')
			.populate('items.product', 'fullName variety productName price units refrigeration', function(err, invoice) {
				expect(err).toBeNull();
				
				expect(isNaN(invoice.total)).not.toBeTruthy();
				
				expect(invoice.cycle).toBe(12);
				expect(invoice.dueDate.toString()).toEqual(Date.today().addDays(12).toString());
				expect(invoice.hasOwnProperty('save')).toBeTruthy();
				
				expect(invoice.items[0].customer.name).not.toBeUndefined();
				expect(invoice.items[0].customer.email).not.toBeUndefined();
				expect(invoice.items[0].customer.balance).not.toBeUndefined();
				
				expect(invoice.items[0].product.fullName).toEqual('Organic Gala Apples');
				expect(invoice.items[0].product.priceWithMarkup).toBeGreaterThan(invoice.items[0].product.price);
				
				invoice.save(function(err, invoice) {
					expect(err).toBeNull();
					expect(isNaN(invoice.total)).not.toBeTruthy();
					expect(invoice.hasOwnProperty('save')).toBeTruthy();
					expect(invoice.items[0].product.units).toEqual('kg');
					
					done();	
				});
				
				
			});
		});
		 		
		 		it('should be able to generate the data for the email template from the invoice', function(done) {
		 			invoice.populate('items.product', 'fullName variety productName priceWithMarkup price units refrigeration', function(err, invoice) {
		 				expect(invoice.hasOwnProperty('save')).toBeTruthy();
		 				expect(err).toBeNull();
						
						var mailData = {
							name: producer._id.name,
							dueDate: Date.parse(Date.today().toString()).addDays(12).toString('dddd dd MMMM yyyy'),
							deliveryDay: Date.parse(Date.today().toString()).addDays(10).toString('dddd dd MMMM yyyy'),
							code: invoice._id,
							items: invoice.items,
							subtotal: invoice.subtotal,
							total: invoice.total,
							account: producer._id.producerData.bankAccount
						};
		 				expect(mailData.name).toBe('Sean Stanley');
		 				expect(mailData.dueDate).toEqual(Date.today().addDays(12).toString('dddd dd MMMM yyyy'));
		 				expect(mailData.code).toBeUndefined() // since the invoice is unsaved;
				
		 				expect(mailData.items.length).toBe(1);
		 				expect(mailData.items[0].product.fullName).toBe('Organic Gala Apples');
						expect(mailData.items[0].product.units).toBe('kg');
		 				expect(mailData.items[0].product.price).toBe(3);
						expect(mailData.items[0].product.priceWithMarkup).toBe(3 * 1.1);
				
		 				expect(mailData.subtotal).toBe(3)
		 				expect(mailData.total).toBe(3)
				
		 				expect(mailData.account).toBe('02-1232-0054-205-00');
				
		 				done();
				
		 			});
		 		});
		 	});
	