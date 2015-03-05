var mongoose = require('mongoose'), // middleware for connecting to the mongodb database
Schema = mongoose.Schema; // mongoose schema object for defining collections.

// Produce, Meat, Processed Goods, Dairy, Baked Goods, tea and beverages all have properties that
// modify the UI of product uploading. For example, the ingredients boolean
// determines whether the user can upload ingredients for their category or not.
var CategorySchema = new Schema({
			name:{type: String, required: true},
			placeholderName:{type: String, required: true},
			placeholderVariety:{type: String, required: true},
			availableUnits:{type: Array, required: true},
			ingredients:{type: Boolean}
});

module.exports = mongoose.model('Category', CategorySchema);