var config = require('../coopConfig');
 
exports.checkForDiscount = function(req, res, next) {
	if (req.body.hasOwnProperty('discountCode') && config.discounts.indexOf(req.body.discountCode) > -1) {
		req.body.discount = {customer: 10, producer: 40};
		
		if (req.body.discountCode === 'KAIKOHE') {
			req.body.discount = {customer: 30, producer: 60};
		}
		
		next();
	} else {
		req.body.discount = false;
		next();
	}
	
};