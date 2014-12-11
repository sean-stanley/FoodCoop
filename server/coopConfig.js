require('datejs');

// Here static variables for the co-op app can be maintained and edited.
// More variables and options to come soon.

// The Co-op's full name
exports.coopName = "Northland Natural Food Co-op";

// The Co-op's short name
exports.coopShortName = "NNFC";

// set the co-op's country -- New Zealand! Not used anywhere in the app yet.
exports.country = "New Zealand";

// set the co-op's region e.g Ottawa Valley or Northland
exports.region = "Northland";

// Membership prices
// -----------------
// these amounts are in local currency
exports.customerMembership = 30;
exports.producerMembership = 60;

// DISCOUNT CODES
// -----------------
exports.discounts = ['WHOLEFOODHUB15'];


// set the co-op's markup as a whole number e.g. 20 for 20%
exports.markup = 20;

// set the co-op's milage rate (for later features). Units are dollars/km one way.
exports.mileage = 0.8;

// CONTACT DETAILS
exports.standardsEmail = [
{name: 'Sean Stanley', email: 'sean@maplekiwi.com'},
{name: 'Klaus Lotz', email: 'klotz@northtec.ac.nz'}
];
exports.adminEmail = {name: 'Sean Stanley', email: 'sean@maplekiwi.com'};

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
	volunteerRecruitment: Date.today().third().wednesday(),
	PaymentDueDay		: Date.today().fourth().monday(),
	DeliveryDay			: Date.today().fourth().monday(),
};


// always make sure this data is the same as how the variables are assigned in
// exports.cycle. If i can find a better way to reset the values I'll implement
// it later.
exports.cycleReset = function(date) {
	if (exports.cycle) exports.oldCycle = exports.cycle;
	exports.cycle = {
		cycleIncrementDay	: Date.parse(date).moveToFirstDayOfMonth(), 
		ProductUploadStart 	: Date.parse(date).first().monday(),
		ProductUploadStop 	: Date.parse(date).second().monday(),
		ShoppingStart 		: Date.parse(date).second().monday(),
		ShoppingStop		: Date.parse(date).third().monday(),
		volunteerRecruitment: Date.parse(date).third().wednesday(),
		PaymentDueDay		: Date.parse(date).third().friday(),
		DeliveryDay			: Date.parse(date).fourth().monday(),
	};
	return exports.cycle;
};

// get what the cycle dates will be for a particular month. 
// @date is to be a parsable string for a particluar date.
// common format is 't + 1 month'
exports.getCycleDates = function(date) {
	var start = Date.parse(date);
	if (typeof start.moveToFirstDayOfMonth === 'function') {
		var cycle = {
			cycleIncrementDay	: Date.parse(date).moveToFirstDayOfMonth(), 
			ProductUploadStart 	: Date.parse(date).first().monday(),
			ProductUploadStop 	: Date.parse(date).second().monday(),
			ShoppingStart 		: Date.parse(date).second().monday(),
			ShoppingStop		: Date.parse(date).third().monday(),
			volunteerRecruitment: Date.parse(date).third().wednesday(),
			PaymentDueDay		: Date.parse(date).fourth().monday(),
			DeliveryDay			: Date.parse(date).final().wednesday(),
		};
		return cycle;
	} 
	
};

//exports.cycle.testDay = Date.today();
// redis session store details
exports.redis = {
			host: '127.0.0.1',
			port: '6379',
			db: 2
		}

// SENSITIVE //
exports.bankAccount = "02-1248-0425752-001";