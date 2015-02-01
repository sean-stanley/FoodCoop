var mongoose = require('mongoose'), // middleware for connecting to the mongodb database
	Schema = mongoose.Schema, // mongoose schema object for defining collections.
	passportLocalMongoose = require('passport-local-mongoose'),
	_ = require('lodash'), // this creates salted and hashed passwords
	fs = require('fs'),
	path = require('path'),
	config = require('./coopConfig.js'),
	markup = config.markup,
	gm = require('gm');

function toArray (listString) {
	if (typeof listString === "string" && listString.length > 0) {
		return listString.split(/,\s*/);
	}
}

var RegionSchema = new Schema({
	dateCreated : {type: Date, required: true},
	title : {type: String, required: true}
});

// These are the most common properties that a product will have in our co-op.
// The img property is to be filled with a base64 encoded png or jpeg from the
// app.
var ProductSchema = new Schema({
			dateUploaded: {type: Date, required: true, default: new Date()},
			img: {},
			category: {type: Schema.ObjectId, required: false, ref: 'Category'},
			productName: {type: String, required: true},
			variety: {type: String, default: ''},
			price: {type: Number, required: true},
			quantity: {type: Number, required: true},
			units: {type: String, required: true},
			refrigeration: {type: String, required: false},
			ingredients: {type: Array, required: false, set: toArray},
			description: {type: String, required: false},
			certification: {type: Schema.ObjectId, ref: 'Certification'},
			producer_ID: {type: Schema.ObjectId, required: true, ref: 'User'},
			cycle: {type: Number, required: true},
			amountSold: Number,
			regionID: [{type: Schema.ObjectId, ref: 'Region'}]
}, {
	toObject: { virtuals : true },
	toJSON: { virtuals : true }
});
function convertToArray (value) {
	if (typeof value === "string" && value.length > 0) {
		req.body.ingredients = req.body.ingredients.split(/,\s*/);
	}
}

ProductSchema.virtual('priceWithMarkup').get(function () {
	return (this.price * (markup/100 + 1));
});
ProductSchema.virtual('fullName').get(function () {
	if (this.variety) return this.variety + ' ' + this.productName;
	else return this.productName;
});

// occurs just before a product is saved. should work with Model.create() shortcut
ProductSchema.pre('save', function(next) {
	var product=this;
	var b64reg = /^data:image\/png;base64,/;
	

	if (b64reg.test(product.img) ) {
		product.variety = !!product.variety ? product.variety : '';
		
		var productName = product.productName.replace(/\.+|\/+|\?+|=+/, "") + "+" + product.variety.replace(/\.+|\/+|\?+|=+/, "");
		var destination = path.normalize(path.join(__dirname, '../app', 'upload', 'products', productName+"+id-"+product._id+".jpg"));
		var base64Data = product.img.replace(/^data:image\/png;base64,/, "");
		
		gm(new Buffer(base64Data, 'base64')).write(destination, function(err) {
			if (err) return console.log(err);
		});
		
		product.img = path.normalize(path.join('upload', 'products', productName+"+id-"+product._id+".jpg"));
	}
	next();
});

ProductSchema.post('remove', function(product) {
	// remove the saved product image from disk asynchronously
	if (product.img) {
		console.log('%s was deleted. Now deleting product image saved to disk', product.productName + " " + product.variety);
		fs.unlink(path.normalize(path.join(__dirname, '../app', product.img)), function(err) {
			if (err) console.log(err);
			else console.log('Successfully removed image.');
		});
	}
});


// for keeping records of all possible cycle codes. Codes are used by products
// and orders to determine what has been bought and uploaded each cycle.
var cycleSchema = new Schema({
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
	return this.product.price ? this.product.price.toFixed(2) : 'Failed to determine price of product ordered';
});
OrderSchema.virtual('unitMarkup').get(function () {
	return (this.unitPriceWithMarkup - this.unitPrice).toFixed(2);
});
OrderSchema.virtual('orderPrice').get(function () {
	return (this.product.price * this.quantity);
});
OrderSchema.virtual('orderPriceWithMarkup').get(function () {
	return (this.unitPriceWithMarkup * this.quantity).toFixed(2);
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
	cycle: Number,
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
	return total.toFixed(2);
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
		exports.Cycle.findByIdAndUpdate( 'invoiceCount', {$inc : {seq: 1} }, function(e, count) {
			if (e) {
				next(e);
			}
			doc._id = count.seq;
			if (doc._id == count.seq) next();
			else {
				doc._id = count.seq;
			}
		});
	}
	else next();
});

var badgeSchema = new Schema({
			name: {type: String, required: true},
			img: {type: String, required: true},
			quantity: Number,
			details: {type: String, required: true}
});

// User schema for all the common user properties. Password is left out as it is
// generated by passportLocalMongoose
var UserSchema = new Schema({
			dateJoined : {type: Date, default: Date.now()},
			regionID: [{type: Schema.ObjectId, ref: 'Region'}],
			email : {type: String, required: true, lowercase: true},
			phone : {type: String, required: true},
			address : {type: String, required: true},
			addressPermission : {type: Boolean, default: false},
			// this is for a future feature that will be a map of all our producers
			lat : Number,
			lng : Number,
			name : {type: String, required: true},
			user_type : {
				name: {type : String, required : true},
				canBuy: {type : Boolean, required : true},
				canSell: {type : Boolean, required : true},
				isAdmin: Boolean,
				isRouteManager: Boolean
			},
			producerData : {
				companyName : String,
				logo : {},
				thumbnail: String,
				description : String,
				certification : String,
				website : String,
				personalBio : String,
				chemicalDisclaimer: String,
				bankAccount : {type: String, default: "NO ACCOUNT ON RECORD"}
			},
			routeManager: {
				title: String,
				townsOnRoute: {type: Array, set: toArray},
				pickupLocation: String
			},
			balance: Number,
			badges: [badgeSchema],
			
			routeTitle: String,
			resetPasswordToken: String,
			resetPasswordExpires: Date
});
// delete the salt and hash from requests for the user objects
if (!UserSchema.options.toObject) UserSchema.options.toObject = {};

UserSchema.virtual('firstName').get(function() {
	return this.name.substr(0, this.name.indexOf(' '));
});
UserSchema.virtual('lastName').get(function() {
	return this.name.substr(this.name.indexOf(' ')+1);
});

// occurs just before an invoice is saved. should work with Model.create() shortcut
UserSchema.pre('save', function(next) {
	var user = this;
	// params for updating MailChimp
	if (user.name && user.email) {
		var params = {
			id: 'e481a3338d',
			email: {email: user.email},
			merge_vars : {
				FNAME : user.name.substr(0, user.name.indexOf(" ")),
				LNAME : user.name.substr(user.name.indexOf(" ")+1),
				USER_TYPE : user.user_type.name,
				ADDRESS : user.address,
				PHONE : user.phone
			}
		};
		if (!user.isNew) {
			mc.lists.updateMember(params, function(result) {}, function(err) {
				console.log(err);
			});
		}
	}
	next();
});

UserSchema.pre('save', function(next) {
	if (this.user_type.name === "Producer" && this.producerData.hasOwnProperty('logo')) {
		var b64reg = /^data:image\/(jpeg|png|gif|tiff|webp);base64,/,
			logoName = this.producerData.companyName ? this.producerData.companyName.replace(/\.+|\/+|\?+|=+/, "") : this.name.replace(/\.+|\/+|\?+|=+/, "");
			
		
		if (b64reg.test(this.producerData.logo) ) {
			console.log('base64 logo detected. Beginning conversion.');
			//determine format. the actual string will be format[0]
			var format = b64reg.exec(this.producerData.logo);
			format = "." + format[1];
			if (format === '.jpeg') format = '.jpg';
			
			var base64Data = this.producerData.logo.replace(/^data:image\/(jpeg|png|gif|tiff|webp);base64,/, ""),
				destination = path.normalize(path.join(__dirname, '../app', 'upload', 'producer-logos', logoName+"+id-"+this._id+format)),
				thumbnailDestination = path.normalize(path.join(__dirname, '../app', 'upload', 'producer-logos', 'thumbnails', logoName+ "-thumb" + "+id-"+this._id+format));
				 buff = new Buffer(base64Data, 'base64');
			//create main logo
			gm(buff).resize('450', '450').write(destination, function(err) {
				if (err) console.log(err);
				else console.log('Yay! successfully wrote new jpeg logo');
			});
			
			gm(buff).resize('150', '150').write(thumbnailDestination, function(err) {
				if (err) console.log(err);
				else console.log('Yay! successfully wrote new jpeg logo thumbnail');
			});
			
			this.producerData.logo = path.normalize(path.join('upload', 'producer-logos', logoName+"+id-"+this._id+format));
			this.producerData.thumbnail = path.normalize(path.join('upload', 'producer-logos', 'thumbnails', logoName+ "-thumb" + "+id-"+this._id+format));
		} // else if (this.producerData.logo){
// 			// create thumbnail
// 			gm(destination).resize('150', '150').write(thumbnailDestination, function(err) {
// 				if (err) return console.log(err);
// 				console.log('Yay! successfully wrote new jpeg logo thumbnail');
// 			});
// 			this.producerData.thumbnail = path.normalize(path.join('upload', 'producer-logos', 'thumbnails', logoName+ "-thumb" + "+id-"+this._id+".jpg"));
// 		} else {
// 			console.log('deleting accidental thumbnail creation');
// 			this.producerData.thumbnail = undefined;
// 		}
	}
	next();
});

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
exports.Region = mongoose.model('Region', RegionSchema);
exports.Product = mongoose.model('Product', ProductSchema);
exports.Order = mongoose.model('Order', OrderSchema);
exports.Invoice = mongoose.model('Invoice', InvoiceSchema);
exports.User = mongoose.model('User', UserSchema);
exports.Category = mongoose.model('Category', CategorySchema);
exports.Certification = mongoose.model('Certification', CertificationSchema);
exports.Cycle = mongoose.model('Cycle', cycleSchema);

