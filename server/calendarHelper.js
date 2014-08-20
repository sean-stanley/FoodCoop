// this file contains static useful dates for the co-op through-out the ordering
// cycle. Different ordering cycles will require changes to these values. The
// datejs module is crucial for calculating these dates. If you wish to change
// the cycle, look at the documentation and examples here
// https://code.google.com/p/datejs/

// At the moment these values are set once each time the server is started up.
// Later an event will be scheduled to update these values every time the month
// changes


require('datejs');

// sets date locality and formats to be for new zealand.
Date.i18n.setLanguage("en-NZ");


// Delivery Day is set here. By default I've made it the last Wednesday of every month.
exports.DeliveryDay = Date.today().final().wednesday();
console.log(exports.DeliveryDay);

// 
exports.ProductUploadStart = Date.today().first().monday();
console.log(exports.ProductUploadStart);

exports.ProductUploadStop = Date.today().second().monday();
console.log(exports.ProductUploadStop);

exports.ShoppingStart = Date.today().second().monday();
console.log(exports.ShoppingStart);

exports.ShoppingStop = Date.today().third().monday();
console.log(exports.ShoppingStop);

exports.startOfMonth = Date.today().moveToFirstDayOfMonth();
exports.endOfMonth = Date.today().moveToLastDayOfMonth();

