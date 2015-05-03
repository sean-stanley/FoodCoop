require('datejs');

// Here static variables for the co-op app can be maintained and edited.
// More variables and options to come soon.

// The Co-op's full name
exports.coopName = 'Northland Natural Food Co-op';

// The Co-op's short name
exports.coopShortName = 'NNFC';

// set the co-op's country -- New Zealand! Not used anywhere in the app yet.
exports.country = 'New Zealand';

// set the co-op's region e.g Ottawa Valley or Northland
exports.region = 'Northland';

// Membership prices
// -----------------
// these amounts are in local currency
exports.customerMembership = 30;
exports.producerMembership = 60;

// DISCOUNT CODES
// -----------------
exports.discounts = ['WHOLEFOODHUB15', 'pechakucha', 'technical2015'];


// set the co-op's markup as a whole number e.g. 20 for 20%
exports.markup = 10;
exports.meatMarkup = 5;

// set the co-op's milage rate (for later features). Units are dollars/km one way.
exports.mileage = 0.8;

// CONTACT DETAILS
exports.standardsEmail = [
{name: 'Sean Stanley', email: 'sean@maplekiwi.com'},
{name: 'Klaus Lotz', email: 'klotz@northtec.ac.nz'}
];
exports.adminEmail = {name: 'Sean Stanley', email: 'sean@foodcoop.org.nz'};

// redis session store details
exports.redis = {
			host: '127.0.0.1',
			port: '6379',
			db: 2
		};

// SENSITIVE //
exports.bankAccount = '02-1248-0425752-001';