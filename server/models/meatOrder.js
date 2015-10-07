var mongoose = require('mongoose'), // middleware for connecting to the mongodb database
	Schema = mongoose.Schema, // mongoose schema object for defining collections.
	_ = require('lodash'), // this creates salted and hashed passwords
	config = require('./../coopConfig.js'),
	markup = config.meatMarkup;

// this represents an entry in a cart or producer order. It is made when a user
// add's a product to his or her cart.
var MeatOrderSchema = new Schema({
		datePlaced: {type: Date, default: Date.now()},
	// deprecated	unitPrice: {type: Number, required: true}, // e.g. 7 for $7/kg
		price: {type: Number, required: true},
		fixedPrice: {type:Number},
		product: {
			id: {type: Schema.ObjectId, required: true, ref: 'Product'},
			name: String,
		},
		customer: {
			id: {type: Schema.ObjectId, required: true, ref: 'User'},
			name: String,
			email: String,
		},
		supplier: {type: Schema.ObjectId, required: true, ref: 'User'},
		instructions: {},
		deliveryInstructions: String,
		weight: Number,
		markup: {type: Number, required: true, default: markup}, // 5%
		invoiced: Boolean,
}, {
	toObject: { virtuals : true },
	toJSON: { virtuals : true }
});

// MeatOrderSchema.pre('save', function(next) {
// 	if (_.isEqual(this.supplier, this.customer.id) ) return next(new Error('no ordering your own products'));
// 	else next();
// });

// these functions create virtual properties for common calculations
MeatOrderSchema.virtual('priceWithMarkup').get(function () {
	return (this.price * (this.markup/100 + 1));
});
// MeatOrderSchema.virtual('unitMarkup').get(function () {
// 	return (this.unitPriceWithMarkup - this.unitPrice);
// });
// MeatOrderSchema.virtual('total').get(function () {
// 	if (this.weight) return (this.unitPrice * this.weight);
// });
// MeatOrderSchema.virtual('totalWithMarkup').get(function () {
// 	if (this.weight) return (this.price * this.weight);
// });

module.exports = mongoose.model('MeatOrder', MeatOrderSchema);
