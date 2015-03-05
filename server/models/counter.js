var mongoose = require('mongoose'), // middleware for connecting to the mongodb database
Schema = mongoose.Schema; // mongoose schema object for defining collections.

counterSchema = new Schema({
	_id: String,
	dateModified: Date,
	seq: Number
});

module.exports = mongoose.model('Counter', counterSchema);