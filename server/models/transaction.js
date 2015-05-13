var mongoose = require('mongoose'), // middleware for connecting to the mongodb database
Schema = mongoose.Schema;


var TransactionSchema = new Schema({
	dateCreated : {type: Date, required: true, default: new Date() },
	title : {type: String, required: true}, // payment or debit usually
	amount: {type: Number, required: true}, //negative if debit, positive if purchase
	account: {type: Schema.ObjectId, ref: 'User', required:true},
	invoice: {type:Number, ref: 'Invoice'},
	reason: String,
	sandbox: {type: Boolean, default: false} // change to false for deployment
});

module.exports = mongoose.model('Transaction', TransactionSchema);