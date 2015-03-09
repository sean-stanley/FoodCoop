/* jshint -W079 */ 
'use strict';

var async = require('async') 
	, mongoose = require('mongoose')
	, models = require('./../models.js')
	, Emailer = require('./../emailer.js')
	, config = require('./../coopConfig.js')
	, discount = require('./../controllers/discount')
	, _ = require('lodash')
	, moment = require('moment')
	, scheduler = require('./../scheduler');
	
	
	mongoose.connect('mongodb://localhost/nnfc-test');
	
	require('datejs');
	
	var start = moment().startOf('year');
	var dates = [];

	for (var i = 0; i <= 118; i++) {
		dates.push(Date.parse('january 1st 2015').addDays(i));
	}

	console.log(new Date(dates[0]).toISOString())
//
	describe('checkCycle function', function() {
		beforeEach(function(done) {
			start = moment().startOf('year');
			done();
		});
		afterEach(function(done) {
			// dates = [];
			done();
		});
		it('should find a cycle for a variety of dates', function(done) {
			expect(start.month()).toBe(0);
			async.each(dates, function(date, next) {
				scheduler.checkCycle(date, function(err, cycle) {
					if (err) {
						console.log(err);
						console.log(date);
					}
					expect(err).toBe(null);
					expect(cycle).not.toBeNull();
					expect(cycle.deliveryDay).not.toBeUndefined();
					expect(cycle.start).not.toBeUndefined();
					next(err);
				});
			},
			 function(err) {
				expect(err).toBeUndefined();
				done();
			})
			
		});
		it('should be able to find a specific delivery day', function(done) {
			expect(start.month()).toBe(0);
			//done();
			var date = Date.parse('Wednesday January 14 2015');
			
			scheduler.checkCycle(date, function(err, cycle) {
				expect(err).toBe(null);
				expect(cycle).not.toBeNull();
				expect(cycle.deliveryDay).not.toBeUndefined();
				expect(cycle.start).not.toBeUndefined();
				
				var d = Date.parse(cycle.deliveryDay)
				
				expect(date).toEqual(d);
				
				done();
			});
		});
		it('should be able to find a specific cycle start', function(done) {
			expect(start.month()).toBe(0);
			//done();
			var date = Date.parse('Thursday January 15 2015');
			
			scheduler.checkCycle(date, function(err, cycle) {
				expect(err).toBe(null);
				expect(cycle).not.toBeNull();
				expect(cycle.deliveryDay).not.toBeUndefined();
				expect(cycle.start).not.toBeUndefined();
				
				var d = Date.parse(cycle.start)
				
				expect(date).toEqual(d);
				
				done();
			});
		});
		
		
	});
	