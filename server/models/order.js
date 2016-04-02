var mongoose = require('mongoose'), // middleware for connecting to the mongodb database
	Schema = mongoose.Schema, // mongoose schema object for defining collections.
	_ = require('lodash'), // this creates salted and hashed passwords
	config = require('./../coopConfig.js'),
markup = config.markup/100 +1;

// this represents an entry in a cart or producer order. It is made when a user
// add's a product to his or her cart.
var OrderSchema = new Schema({
	datePlaced: {type: Date, default: Date.now()},
	product: {type: Schema.ObjectId, required: true, ref: 'Product'},
	unitPrice: {type: Number},
	customer: {type: Schema.ObjectId, required: true, ref: 'User'},
	supplier: {type: Schema.ObjectId, required: true, ref: 'User'},
	quantity: {type: Number, required: true, min: 1},
	markup: {type: Number, required: true, default: markup}, // 20%
	cycle: {type: Number, required: true},
	deliveryDay: {type: Date},
	// milk: {type: Boolean, default: false}
}, {
	toObject: { virtuals : true },
	toJSON: { virtuals : true } 
});

// Milk story: click product > determine how many weeks are in the upcoming cycle > select how many litres you want per week > confirm > see order in your cart so it appears on invoice afterwards > 

// these functions create virtual properties for common calculations
OrderSchema.virtual('unitPriceWithMarkup').get(function () {
	return (this.unitPrice * this.markup);
});
// OrderSchema.virtual('unitPrice').get(function () {
// 	return this.product.price ? this.product.price.toFixed(2) : 'Failed to determine price of product ordered';
// });
OrderSchema.virtual('unitMarkup').get(function () {
	return (this.unitPriceWithMarkup - this.unitPrice);
});
OrderSchema.virtual('orderPrice').get(function () {
	return (this.unitPrice * this.quantity);
});
OrderSchema.virtual('orderPriceWithMarkup').get(function () {
	return (this.unitPriceWithMarkup * this.quantity);
});

module.exports = mongoose.model('Order', OrderSchema);