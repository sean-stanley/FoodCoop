var mongoose = require('mongoose'), // middleware for connecting to the mongodb database
Schema = mongoose.Schema; // mongoose schema object for defining collections.

var RegionSchema = new Schema({
	dateCreated : {type: Date, required: true},
	title : {type: String, required: true}
});

module.exports = mongoose.model('Region', RegionSchema);