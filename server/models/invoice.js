var mongoose = require('mongoose'), // middleware for connecting to the mongodb database
	Schema = mongoose.Schema, // mongoose schema object for defining collections.
config = require('./../coopConfig.js'),
Counter = require('./counter.js');

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
		quantity: {type: String}, 
		name: {type: String}, 
		customer: {type:Schema.ObjectId, ref: 'User'}, 
		product: {type:Schema.ObjectId, ref: 'Product'} 
	}],
	credit: Number,
	bankAccount: {type:String, required: true, default: config.bankAccount},
	//valid types are 'un-paid', 'PAID', 'overdue', 'To Refund', 'refunded' and
	//'CANCELLED'.
	status: {type: String, required: true, default: 'un-paid', validator:validStatus},
	cycle: {type: Number, ref: 'Cycle'},
	// only for invoices to customers
	deliveryRoute: String
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
				total += this.items[i].product.price * this.items[i].quantity;
			}
			else {
				total += this.items[i].product.priceWithMarkup * this.items[i].quantity;
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



module.exports = mongoose.model('Invoice', InvoiceSchema);