// this file contains static useful dates for the co-op through-out the ordering
// cycle. Different ordering cycles will require changes to these values. The
// datejs module is crucial for calculating these dates. If you wish to change
// the cycle, look at the documentation and examples here
// https://code.google.com/p/datejs/

// At the moment these values are set once each time the server is started up.
// Later an event will be scheduled to update these values every time the month
// changes
var config = require('./coopConfig.js');
var cycle = config.cycle;

require('datejs');

// sets date locality and formats to be for new zealand.
Date.i18n.setLanguage("en-NZ");


// Delivery Day is set here. By default I've made it the last Wednesday of every month.
exports.DeliveryDay = cycle.DeliveryDay;
console.log(exports.DeliveryDay);

// 
exports.ProductUploadStart = cycle.ProductUploadStart;
console.log(exports.ProductUploadStart);

exports.ProductUploadStop = cycle.ProductUploadStop;
console.log(exports.ProductUploadStop);

exports.ShoppingStart = cycle.ShoppingStart;
console.log(exports.ShoppingStart);

exports.ShoppingStop = cycle.ShoppingStop;
console.log(exports.ShoppingStop);

exports.startOfMonth = Date.today().moveToFirstDayOfMonth();
exports.endOfMonth = Date.today().moveToLastDayOfMonth();

// useful methods (using config data)

exports.daysUntil = function(cycle) {
	var result, a, today, date, cycle;
	today = new Date();
	
	result = {};
	if (typeof cycle === 'object') {
		for (date in cycle) {
			if (cycle.hasOwnProperty(date)) {
				a = new Date(cycle[date]);
				result[date] = Math.floor( 
					(Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) -
					Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) ) /
					(1000 * 60 * 60 * 24) );
			}
		}
	}
	return result;
};