var mongoose = require('mongoose') // middleware for connecting to the mongodb database
	, Schema = mongoose.Schema // mongoose schema object for defining collections.
	, config = require('./../coopConfig.js')
	, Transaction = require('./transaction')
	, User = require('./user')
	, Counter = require('./counter.js');

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
	items: [{
		cost: Number,
		name: {type: String}, 
		quantity: {type: String}, 
		customer: {type:Schema.ObjectId, ref: 'User'}, 
		product: {type:Schema.ObjectId, ref: 'Product'}
	}],
	credit: Number,
	bankAccount: {type:String, required: true, default: config.bankAccount},
	//valid types are 'un-paid', 'PAID', 'overdue', 'To Refund', 'refunded' and
	//'CANCELLED'.
	status: {type: String, required: true, default: 'un-paid', validator:validStatus},
	
	paymentMethod: {type: String, validator:validPaymentMethod},
	
	cycle: {type: Number, ref: 'Cycle'},
	meatOrder: {type:Schema.ObjectId, ref: 'MeatOrder'},
	// only for invoices to customers
	deliveryRoute: String,
	notes: String,
},{
	toObject: { virtuals : true },
	toJSON: { virtuals : true }
});

// sets a virtual property that is the financial total of the invoice.
InvoiceSchema.virtual('subtotal').get(function () {
	var total = 0;
	for (var i = 0; i < this.items.length; i++) {
		// works for membership invoices
		if (this.items[i].cost) {
			total += this.items[i].cost;
		}
		
		else if (this.items[i].product) {
			if (this.toCoop) {
				total += this.items[i].cost || this.items[i].product.price * this.items[i].quantity;
			}
			else {
				total += this.items[i].cost || this.items[i].product.priceWithMarkup * this.items[i].quantity;
			}
		}
	}
	return total;
});

InvoiceSchema.virtual('total').get(function() {
		if (this.credit >= 0 || this.credit <= 0) return this.subtotal -= this.credit;
		return this.subtotal;
});

//setter function for Invoice status that tests the value is in the validOptions range.
function validStatus (val) {
	var validOptions = ['un-paid', 'PAID', 'OVERDUE', 'To Refund', 'Refunded', 'CANCELLED'];
	return /un-paid|PAID|OVERDUE|To Refund|Refunded|CANCELLED/i.test(val);
}

function validPaymentMethod (val) {
	return /credit card|bank transfer|balance|direct deposit|cash/i.test(val);
}

// occurs just before an invoice is saved. should work with Model.create() shortcut
InvoiceSchema.pre('save', function(next) {
	var doc = this;
	if (doc.isNew) {
		Counter.findByIdAndUpdate( 'invoiceCount', {$inc : {seq: 1} }, function(e, count) {
			if (e) return next(e);
			doc._id = count.seq;
			next();
		});
	}
	else next();
});

InvoiceSchema.pre('save', function(next) {
	
	var doc = this
	, amount = doc.toCoop ? doc.total : doc.total * -1 //add or subtract payment
	, businessBalance = doc.toCoop; // if true, must be a payment
	
	if (doc.isNew) {
		User.transaction(doc.invoicee, amount, {title: doc.title, invoice: doc._id, businessBalance: businessBalance}, function(err) {
			if (err) return next(err);
			next();
		});
	} else if (doc.isModified('status') && doc.status === 'PAID' && doc.paymentMethod !== "balance") {
		User.transaction(doc.invoicee, amount * -1, {title: doc.title + ' PAID', invoice: doc._id, businessBalance: businessBalance}, function(err) {
			if (err) return next(err);
			next();
		});
	} else if (doc.isModified('status') && doc.status === 'un-paid') {
		User.transaction(doc.invoicee, amount, {title: doc.title + doc.status, invoice: doc._id, businessBalance: businessBalance}, function(err) {
			if (err) return next(err);
			next();
		});
	} else if (doc.isModified('status') && doc.status === 'CANCELLED') {
		User.transaction(doc.invoicee, amount * -1, {title: doc.title + ' CANCELLED', invoice: doc._id, businessBalance: businessBalance}, function(err) {
			if (err) return next(err);
			next();
		});
	} else next();
});

InvoiceSchema.post('remove', function(invoice) {
	var amount = invoice.toCoop ? invoice.total : invoice.total * -1
	, businessBalance = invoice.toCoop;
	
	if (invoice.status !== 'PAID') amount = amount * -1;
	
	User.transaction(invoice.invoicee, amount, {title: 'DELETED INVOICE ' + invoice._id, businessBalance: businessBalance}, function(err) {
		if (err) console.error(err);
	});
});


module.exports = mongoose.model('Invoice', InvoiceSchema);