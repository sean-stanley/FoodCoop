var mongoose = require('mongoose'), // middleware for connecting to the mongodb database
	Schema = mongoose.Schema, // mongoose schema object for defining collections.
	_ = require('lodash'), // this creates salted and hashed passwords
	config = require('./../coopConfig.js'),
markup = config.markup;

// this represents an entry in a cart or producer order. It is made when a user
// add's a product to his or her cart.
var OrderSchema = new Schema({
		datePlaced: {type: Date, default: Date.now()},
		product: {type: Schema.ObjectId, required: true, ref: 'Product'},
		customer: {type: Schema.ObjectId, required: true, ref: 'User'},
		supplier: {type: Schema.ObjectId, required: true, ref: 'User'},
		quantity: {type: Number, required: true},
		markup: {type: Number, required: true, default: markup}, // 20%
		cycle: {type: Number, required: true},
}, {
	toObject: { virtuals : true },
	toJSON: { virtuals : true } 
});

// these functions create virtual properties for common calculations
OrderSchema.virtual('unitPriceWithMarkup').get(function () {
	return (this.product.price * (this.markup/100 + 1));
});
OrderSchema.virtual('unitPrice').get(function () {
	return this.product.price ? this.product.price.toFixed(2) : 'Failed to determine price of product ordered';
});
OrderSchema.virtual('unitMarkup').get(function () {
	return (this.unitPriceWithMarkup - this.unitPrice);
});
OrderSchema.virtual('orderPrice').get(function () {
	return (this.product.price * this.quantity);
});
OrderSchema.virtual('orderPriceWithMarkup').get(function () {
	return (this.unitPriceWithMarkup * this.quantity);
});

module.exports = mongoose.model('Order', OrderSchema);