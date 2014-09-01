var mongoose = require('mongoose'); // middleware for connecting to the mongodb database
var Schema = mongoose.Schema; // mongoose schema object for defining collections.
var passportLocalMongoose = require('passport-local-mongoose');
var _ = require('underscore'); // this creates salted and hashed passwords
var config = require('./coopConfig.js')

var markup = config.markup;

// this is a helpful setter function to return a value as lowercase. It is used
// to keep email addresses as all lowercase.
function toLower (v) {
  return v.toLowerCase();
}
// These are the most common properties that a product will have in our co-op.
// The img property is to be filled with a base64 encoded png or jpeg from the
// app.
var ProductSchema = new Schema({
			dateUploaded: {type: Date, required: true},
			img: {},
			category: {type: Schema.ObjectId, required: false, ref: 'Category'},
			productName: {type: String, required: true},
			variety: {type: String, required: true},
			price: {type: Number, required: true},
			quantity: {type: Number, required: true},
			units: {type: String, required: true},
			refrigeration: {type: String, required: false},
			ingredients: {type: Array, required: false},
			description: {type: String, required: false},
			certification: {type: Schema.ObjectId, required: false, ref: 'Certification'},
			producer_ID: {type: Schema.ObjectId, required: true, ref: 'User'},
			cycle: {type: Number, required: true},
}, {
	toObject: { virtuals : true },
	toJSON: { virtuals : true }
});
ProductSchema.virtual('priceWithMarkup').get(function () {
	return (this.price * (markup/100 + 1)).toFixed(2);
});
ProductSchema.virtual('fullName').get(function () {
	return this.variety + ' ' + this.productName;
});

// for keeping records of all possible cycle codes. Codes are used by products
// and orders to determine what has been bought and uploaded each cycle.
var cycleShema = new Schema({
	_id: String,
	dateModified: {type: Date, default: Date.now(), required: true},
	seq: Number
});

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
	return (this.product.price * (this.markup/100 + 1)).toFixed(2);
});
OrderSchema.virtual('unitPrice').get(function () {
	return this.product.price;
});
OrderSchema.virtual('unitMarkup').get(function () {
	return (this.unitPriceWithMarkup - this.unitPrice).toFixed(2);
});
OrderSchema.virtual('orderPrice').get(function () {
	return this.product.price * this.quantity;
});
OrderSchema.virtual('orderPriceWithMarkup').get(function () {
	return this.unitPriceWithMarkup * this.quantity;
});

// Schema for Invoice Data
var InvoiceSchema = new Schema({
	_id : Number,
	datePlaced: {type: Date, required: true, default: Date.now()},
	dueDate: {type:Date, required: true},
	dateModified: Date,
	invoicee: {type:Schema.ObjectId, ref: 'User'},
	exInvoicee: String,
	toCoop: {type: Boolean, default: false},
	title: String,
	items: {type: Array, required:true},
	bankAccount: {type:String, required: true, default: config.bankAccount},
	//valid types are 'un-paid', 'PAID', 'overdue', 'To Refund', 'refunded' and
	//'CANCELLED'.
	status: {type: String, required: true, default: 'un-paid', set:validStatus},
	cycle: {type: Number, required: true},	
},{
	toObject: { virtuals : true },
	toJSON: { virtuals : true }
});

// sets a virtual property that is the financial total of the invoice.
InvoiceSchema.virtual('total').get(function () {
	var total = 0;
	for (var i = 0; i < this.items.length; i++) {
		// works for membership invoices
		if (this.items[i].hasOwnProperty('cost')) {
			total += this.items[i].cost;
		}
		else if (this.items[i].hasOwnProperty('product')) {
			if (this.toCoop) {
				total += this.items[i].product.price * this.items[i].quantity
			}
			else {
				total += this.items[i].product.priceWithMarkup * this.items[i].quantity
			}
		}
	}
	return total;
});

//setter function for Invoice status that tests the value is in the validOptions range.
function validStatus (val) {
	var validOptions = ['un-paid', 'PAID', 'OVERDUE', 'To Refund', 'Refunded', 'CANCELLED'];
	if ( _.contains(validOptions, val) ) {
		return val
	}
	else {
		throw new Error("Oops, the invoice status is not being set to a proper value.")
	}
}

// occurs just before an invoice is saved. should work with Model.create() shortcut
InvoiceSchema.pre('save', function(next) {
	var doc = this;
	if (doc.isNew) {
		exports.Cycle.findByIdAndUpdate( 'invoiceCount', {$inc : {seq: 1} }, function(e, count) {
			if (e) {
				next(e);
			}
			doc['_id'] = count.seq;
			if (doc._id == count.seq) next();
			else {
				doc['_id'] = count.seq;
			}
		});
	}
	else next();
});

// User schema for all the common user properties. Password is left out as it is
// generated by passportLocalMongoose
var UserSchema = new Schema({
			dateJoined : {type: Date, default: Date.now()},
			email : {type: String, required: true, set: toLower},
			phone : {type: String, required: false},
			address : {type: String, required: true},
			// this is for a future feature that will be a map of all our producers
			geo : {type: Array},
			name : {type: String, required: true},
			user_type : {
				name: {type : String, required : true},
				canBuy: {type : Boolean, required : true},
				canSell: {type : Boolean, required : true},
				isAdmin: Boolean
			},
			producerData : {
				companyName : {type: String},
				logo : {},
				description : {type: String},
				certification : {type: String},
				website : {type: String},
				personalBio : {type: String},
				bankAccount : {type: String, default: "NO ACCOUNT ON RECORD"}
			},
			//amountSpentThisYear is assigned when a user is invoiced for an order and is a
			//record of how much a user has spent in the co-op in the past year. This is
			//used to figure out how much dividend the user should receive. This amount is
			//to be reset every August.
			amountSpentThisYear: Number,
			resetPasswordToken: String,
			resetPasswordExpires: Date
});
// delete the salt and hash from requests for the user objects
if (!UserSchema.options.toObject) UserSchema.options.toObject = {};
UserSchema.options.toObject.transform = function (doc, ret, options) {
	delete ret.salt;
	delete ret.hash;
};

// Produce, Meat, Processed Goods, Dairy, Baked Goods all have properties that
// modify the UI of product uploading. For example, the ingredients boolean
// determines whether the use can upload ingredients for their category or not.
var CategorySchema = new Schema({
			name:{type: String, required: true},
			placeholderName:{type: String, required: true},
			placeholderVariety:{type: String, required: true},
			availableUnits:{type: Array, required: true},
			ingredients:{type: Boolean}
});


// Different methods of certification go here. BioGrow, AssureQuality, Demeter,
// Organic Farms NZ, In transition and of course 'none' are preloaded from
// test-data.js. The img here is a path to an image in the main app not a Base64
// encode of the image like for products and users.
var CertificationSchema = new Schema({
			name:{type: String, required: true},
			img:{type: String}
});

// make this schema have passwords and use the email field for usernames.
UserSchema.plugin(passportLocalMongoose, {usernameField: 'email'});


//export the schema's for use in the API.
exports.Product = mongoose.model('Product', ProductSchema);
exports.Order = mongoose.model('Order', OrderSchema);
exports.Invoice = mongoose.model('Invoice', InvoiceSchema);
exports.User = mongoose.model('User', UserSchema);
exports.Category = mongoose.model('Category', CategorySchema);
exports.Certification = mongoose.model('Certification', CertificationSchema);
exports.Cycle = mongoose.model('Cycle', cycleShema);

