var mongoose = require('mongoose'), // middleware for connecting to the mongodb database
Schema = mongoose.Schema, // mongoose schema object for defining collections.
Counter = require('./counter');

// for keeping records of all possible cycle codes. Codes are used by products, carts
// and orders to determine what has been bought and uploaded each cycle.
var cycleSchema = new Schema({
	_id: Number,
	title: String,
	dateModified: {type: Date, default: Date.now(), required: true},
	start: {type: Date, required: true, unique: true},
	shoppingStart: {type: Date, required: true},
	shoppingStop: {type: Date, required: true},
	deliveryDay: {type: Date, required: true, unique: true},
});

cycleSchema.pre('save', function(next) {
	var doc = this;
	if (doc.isNew) {
		Counter.findOneAndUpdate({_id: 'orderCycle'},{ dateModified: Date.now(), $inc: {seq: 1} }, function(err, cycle){
			if (err) return next(err);
			console.log(cycle.seq);
			doc._id = cycle.seq;
			next();
		});
	} else next();
});

module.exports = mongoose.model('Cycle', cycleSchema);