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
		
		done();
	});
	it('should have defaults already populated', function(done){
    expect(invoice.bankAccount).toEqual('02-1248-0425752-001');
		expect(invoice.status).toEqual('un-paid');
		done();
  });
	it('should be able to save', function(done) {
		invoice.save(function(err, invoice) {
			expect(err).toBeNull();
			
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
		
		done();
	});
	it('when saved should alter user\'s balance', function(done) {
		invoice.save(function(err, invoice) {
			expect(err).toBeNull();
			expect(invoice.total).toBe(100);
		
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


