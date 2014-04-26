var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var ProductSchema = new Schema({
			dateUploaded: {type: Date, required: true},
			category: {type: String, required: true},
			productName: {type: String, required: true},
			variety: {type: String, required: true},
			price: {type: Number, required: true},
			quantity: {type: Number, required: true},
			units: {type: String, required: true},
			refrigeration: {type: String, required: true},
			ingredients: {type: String, required: false},
			description: {type: String, required: true},
			certification: {type: String},
			producerName: {type: String, required: true},
			producerCompany: {type: String, required: true}
});
var OrderSchema = new Schema({
		datePlaced: {type: Date, default: Date.now()},
		product: {type: Schema.ObjectId, required: true},
		customer: {type: Schema.ObjectId, required: true},
		quantity: {type: Number, required: true},
		confirmed: {type: Boolean, default : false}
});
var UserSchema = new Schema({
			dateJoined : {type: Date, default: Date.now()},
			email : {type: String, required: true},
			phone : {type: String, required: false},
			address : {type: String, required: true},
			name : {type: String, required: true},
			user_type : {
							name: {type : String, required : true},
							canBuy: {type : Boolean, required : true},
							canSell: {type : Boolean, required : true}
						},
			producerData : {
							companyName : {type: String},
							image : {},
							logo : {},
							description : {type: String},
							certification : {type: String},
							feedbackScore : {type: Number},
							approved : {type: Boolean, default: false}
						}
});
var CategorySchema = new Schema({
			name:{type: String, required: true},
			value:{type: String, required: true},
			placeholderName:{type: String, required: true},
			placeholderVariety:{type: String, required: true},
			availableUnits:{type: Array, required: true},
			ingredients:{type: Boolean}
});
var LocationSchema = new Schema({
			name:{type: String, required: true},
			value:{type: String, required: true},
			fromWhangarei:{type: String, required: true},
			distance:{type: String, required: true},
			maps:{type: String, required: true},
});
var CertificationSchema = new Schema({
			name:{type: String, required: true},
			value:{type: String, required: true},
			img:{type: String},
});
UserSchema.plugin(passportLocalMongoose, {usernameField: 'email'});

exports.Product = mongoose.model('Product', ProductSchema);
exports.Order = mongoose.model('Order', OrderSchema);
exports.User = mongoose.model('User', UserSchema);
exports.Category = mongoose.model('Category', CategorySchema);
exports.Location = mongoose.model('Location', LocationSchema);
exports.Certification = mongoose.model('Certification', CertificationSchema);

