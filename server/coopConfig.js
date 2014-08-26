require('datejs');

// Here static variables for the co-op app can be maintained and edited.
// More variables and options to come soon.

// The Co-op's full name
exports.coopName = "Northland Natural Food Co-op";

// The Co-op's short name
exports.coopShortName = "NNFC"

// set the co-op's country -- New Zealand! Not used anywhere in the app yet.
exports.country = "New Zealand";

// set the co-op's region e.g Ottawa Valley or Northland
exports.region = "Northland";

// Membership prices
// -----------------
// these amounts are in local currency
exports.customerMembership = 60;
exports.producerMembership = 120;

// set the co-op's markup as a whole number e.g. 20 for 20%
exports.markup = 20;

// set the co-op's milage rate (for later features). Units are dollars/km one way.
exports.mileage = 0.8;


// CALENDAR CYCLE

// this file contains static useful dates for the co-op through-out the ordering
// cycle. Different ordering cycles will require changes to these values. The
// datejs module is crucial for calculating these dates. If you wish to change
// the cycle, look at the documentation and examples here
// https://code.google.com/p/datejs/

// At the moment these values are set once each time the server is started up.
// Later an event will be scheduled to update these values every time the month
// changes

// Date.today() means the time for these events is set to midnight.

// set the order cycle variables here.
// use datejs syntax to find the right date ranges.
// the cycle object contains the date patterns for the co-op ordering cycle.
exports.cycle = {
	cycleIncrementDay	: Date.today().moveToFirstDayOfMonth(), 
	ProductUploadStart 	: Date.today().first().monday(),
	ProductUploadStop 	: Date.today().second().monday(),
	ShoppingStart 		: Date.today().second().monday(),
	ShoppingStop		: Date.today().third().monday(),
	PaymentDueDay		: Date.today().final().monday(),
	DeliveryDay			: Date.today().final().wednesday(),
	
	
};


exports.cycle.testDay = Date.today();



// SENSITIVE //
exports.bankAccount = "01-0000-0000000-0000-000";