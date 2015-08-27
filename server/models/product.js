var mongoose = require('mongoose'), // middleware for connecting to the mongodb database
	Schema = mongoose.Schema, // mongoose schema object for defining collections.
	_ = require('lodash'), // this creates salted and hashed passwords
	fs = require('fs'),
	path = require('path'),
	config = require('./../coopConfig.js'),
	markup = config.markup,
	meatMarkup = config.meatMarkup,
	gm = require('gm');

function toArray (listString) {
	if (typeof listString === 'string' && listString.length > 0) {
		return listString.split(/,\s*/);
	}
}


// These are the most common properties that a product will have in our co-op.
// The img property is to be filled with a base64 encoded png or jpeg from the
// app.
var ProductSchema = new Schema({
			dateUploaded: {type: Date, required: true, default: new Date()},
			img: {},
			category: {type: Schema.ObjectId, ref: 'Category'},
			productName: {type: String, required: true},
			variety: {type: String, default: ''},
			price: {type: Number, required: true},
			quantity: {type: Number, required: true},
			units: {type: String, required: true},
			minOrder: {type:Number},
			refrigeration: {type: String, required: false, default: 'none'},
			ingredients: {type: Array, required: false, set: toArray},
			description: {type: String, required: false},
			certification: {type: Schema.ObjectId, ref: 'Certification'},
			producer_ID: {type: Schema.ObjectId, required: true, ref: 'User'},
			cycle: {type: Number, ref:'Cycle', index: -1},
			amountSold: {type: Number, default: 0},
			regionID: [{type: Schema.ObjectId, ref: 'Region'}],
			// For Meat Products
			permanent: {type: Boolean, index: 1, default: false},
			butcheryForm: String,
			fixedPrice: Number // used for processing fees that don't change with quantity
}, {
	toObject: { virtuals : true },
	toJSON: { virtuals : true }
});
function convertToArray (value) {
	if (typeof value === 'string' && value.length > 0) {
		req.body.ingredients = req.body.ingredients.split(/,\s*/);
	}
}

ProductSchema.virtual('priceWithMarkup').get(function () {
	if (this.permanent && (this.category._id == '5421e9192ba620071b4cb2a9' || this.category == "5421e9192ba620071b4cb2a9") ) { // meat category
		return (this.price * (meatMarkup/100 + 1));
	}
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

	if (product.isNew) {
		product.amountSold = 0;
		dateUploaded = new Date();
	}


	if (b64reg.test(product.img) ) {
		product.variety = !!product.variety ? product.variety : '';

		var productName = product.productName.replace(/\.+|\/+|\?+|=+/g, '') + '+' + product.variety.replace(/\.+|\/+|\?+|=+/g, '');
		var destination = path.normalize(path.join(__dirname, '../../app', 'upload', 'products', productName+'+id-'+product._id+'.jpg'));
		var base64Data = product.img.replace(/^data:image\/png;base64,/, '');

		gm(new Buffer(base64Data, 'base64')).write(destination, function(err) {
			if (err) return console.log(err);
		});

		product.img = path.normalize(path.join('upload', 'products', productName+'+id-'+product._id+'.jpg'));
	}
	next();
});

// ProductSchema.post('remove', function(product) {
// 	// remove the saved product image from disk asynchronously
// 	// not a good idea as multiple products could share the same original image.
// 	if (product.img) {
// 		console.log('%s was deleted. Now deleting product image saved to disk', product.productName + ' ' + product.variety);
// 		fs.unlink(path.normalize(path.join(__dirname, '../../app', product.img)), function(err) {
// 			if (err) console.log(err);
// 			else console.log('Successfully removed image.');
// 		});
// 	}
// });

module.exports = mongoose.model('Product', ProductSchema);
