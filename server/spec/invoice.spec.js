/* jshint -W079 */ 
'use strict';

var models = require('./../models.js');

var invoice;

describe('invoice model', function(){
	beforeEach(function(done) {
		var date = Date.today().toString();
		invoice = new models.Invoice({
			dueDate: Date.parse(date).addDays(12).toString('ddd dd MMMM yyyy'),
			invoicee: "5546bbf9641453ae40d1840d", // permanent test user
			title: 'Shopping for ' + Date.today().toString('MMMM'),
			items: [{cost:100, name: 'Test Item'}],
			toCoop: false,
		});
		
		models.User.findByIdAndUpdate("5546bbf9641453ae40d1840d", {balance: 0}, function(err, user) {
			done();
		});
	});
	it('should have defaults already populated', function(done){
    expect(invoice.bankAccount).toEqual('02-1248-0425752-001');
		expect(invoice.status).toEqual('un-paid');
		done();
  });
	it('should be able to save', function(done) {
		invoice.save(function(err, invoice) {
			expect(err).toBeNull();
			expect(invoice.status).toBe('un-paid');
			
			invoice.remove(function(err) {
				expect(err).toBeNull();
				done();
			});
		});
	});
	it('when saved should alter user\'s balance', function(done) {
		invoice.save(function(err, invoice) {
			expect(err).toBeNull();
			expect(invoice.total).toBe(100);
		
			models.User.findById("5546bbf9641453ae40d1840d", function(err, user) {
				expect(err).toBeNull();
				expect(user.balance).toBe(-100);
				
				invoice.remove(function(err) {
					expect(err).toBeNull();
					done();
				});
			});
		});
	});
	it('when marked as paid should re-adjust user\'s balance', function(done) {
		expect(invoice.status).toBe('un-paid');
		
		invoice.save(function(err, invoice) {
			expect(err).toBeNull();
			expect(invoice.total).toBe(100);
			expect(invoice.status).toBe('un-paid');
			
			invoice.set({
				status: 'PAID',
			});
			
			expect(invoice.status).toBe('PAID');
			
			invoice.save(function(err, invoice) {
				models.User.findById("5546bbf9641453ae40d1840d", function(err, user) {
					expect(err).toBeNull();
					expect(user.balance).toBe(0);
				
					invoice.remove(function(err) {
						expect(err).toBeNull();
						done();
					});
				});
			});
		});
	});
	it('when marked as paid with paymentMethod balance should not adjust user\'s balance', function(done) {
		invoice.save(function(err, invoice) {
			expect(err).toBeNull();
			expect(invoice.total).toBe(100);
			expect(invoice.status).toBe('un-paid');
			
			invoice.set({
				status: 'PAID',
				paymentMethod: 'balance'
			});
			
			expect(invoice.status).toBe('PAID');
			expect(invoice.paymentMethod).toBe('balance');
			
			invoice.save(function(err, invoice) {
				models.User.findById("5546bbf9641453ae40d1840d", function(err, user) {
					expect(err).toBeNull();
					expect(user.balance).toBe(-100);
				
					invoice.remove(function(err) {
						expect(err).toBeNull();
						done();
					});
				});
			});
		});
	});
});

describe('invoice model toCoop', function() {
	beforeEach(function(done) {
		var date = Date.today().toString();
		invoice = new models.Invoice({
			dueDate: Date.parse(date).addDays(12).toString('ddd dd MMMM yyyy'),
			invoicee: "5546bbf9641453ae40d1840d", // permanent test user
			title: 'Products Requested for ' + Date.today().toString('MMMM'),
			items: [{cost:100, name: 'Test Item'}],
			toCoop: true,
		});
		
		models.User.findByIdAndUpdate("5546bbf9641453ae40d1840d", {balance: 0}, function(err, user) {
			done();
		});
	});
	it('when saved should alter user\'s balance', function(done) {
		invoice.save(function(err, invoice) {
			expect(err).toBeNull();
			expect(invoice.total).toBe(100);
			expect(invoice.status).toBe('un-paid');
		
			models.User.findById("5546bbf9641453ae40d1840d", function(err, user) {
				expect(err).toBeNull();
				expect(user.balance).toBe(100);
				
				invoice.remove(function(err) {
					expect(err).toBeNull();
					done();
				});
			});
		});
	});
	it('when marked as paid should re-adjust user\'s balance', function(done) {
		invoice.save(function(err, invoice) {
			expect(err).toBeNull();
			expect(invoice.total).toBe(100);
			expect(invoice.status).toBe('un-paid');
			
			invoice.set({
				status: 'PAID',
			});
			
			expect(invoice.status).toBe('PAID');
			
			invoice.save(function(err, invoice) {
				models.User.findById("5546bbf9641453ae40d1840d", function(err, user) {
					expect(err).toBeNull();
					expect(user.balance).toBe(0);
				
					invoice.remove(function(err) {
						expect(err).toBeNull();
						done();
					});
				});
			});
		});
	});
	it('when marked as paid with paymentMethod balance should not adjust user\'s balance', function(done) {
		invoice.save(function(err, invoice) {
			expect(err).toBeNull();
			expect(invoice.total).toBe(100);
			expect(invoice.status).toBe('un-paid');
			
			invoice.set({
				status: 'PAID',
				paymentMethod: 'balance'
			});
			
			expect(invoice.status).toBe('PAID');
			expect(invoice.paymentMethod).toBe('balance');
			
			invoice.save(function(err, invoice) {
				models.User.findById("5546bbf9641453ae40d1840d", function(err, user) {
					expect(err).toBeNull();
					expect(user.balance).toBe(100);
				
					invoice.remove(function(err) {
						expect(err).toBeNull();
						done();
					});
				});
			});
		});
	});
});


