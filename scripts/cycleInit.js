#!/usr/bin/env node
var mongoose = require('mongoose');
var Cycle = require('../server/models/cycle.js');
mongoose.connect('mongodb://localhost/mydb');
var db = mongoose.connection;

require('datejs');

function saveEnd(err) {
	if (err) console.log(err);
	else console.log('Cycle saved successfully');
}

function defaultCycle (date, callback) {
	if (!date) date = Date.today();
	else date = Date.parse(date);
	
	var cycle1 = new Cycle({
		start: date.addMonths(-1).final().wednesday().addDays(1).toString(),
		shoppingStart: date.first().monday().toString(),
		shoppingStop: date.second().monday().toString(),
		deliveryDay:  date.second().monday().addDays(2).toString()
	});
	
	var cycle2 = new Cycle({
		start: date.second().monday().addDays(3).toString(),
		shoppingStart: date.third().monday().toString(),
		shoppingStop: date.final().monday().toString(),
		deliveryDay: date.final().wednesday().toString()
	});
	
	//console.log(cycle1);
	//console.log(cycle2);
	cycle1.save(saveEnd);
	cycle2.save(saveEnd);
	
};

defaultCycle();
defaultCycle(Date.today().addMonths(1).toString());
defaultCycle(Date.today().addMonths(2).toString());

