//export the schema's for use in the API.

var badge = require('./models/badge')
		, category = require('./models/category')
		, certification = require('./models/certification')
		, counter = require('./models/counter')
		, cycle = require('./models/cycle')
		, invoice = require('./models/invoice')
		, meatOrder = require('./models/meatOrder')
		, order = require('./models/order')
		, product = require('./models/product')
		, region = require('./models/region')
		, transaction = require('./models/transaction')
		, user = require('./models/user');		

exports.Badge = badge;
exports.Category = category;
exports.Certification = certification;
exports.Cycle = cycle;
exports.Invoice = invoice;
exports.Counter = counter;
exports.MeatOrder = meatOrder;
exports.Order = order;
exports.Product = product;
exports.Region = region;
exports.Transaction = transaction;
exports.User = user;




