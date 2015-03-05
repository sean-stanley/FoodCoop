var mongoose = require('mongoose'); // middleware for connecting to the mongodb database

var badgeSchema = new mongoose.Schema({
			name: {type: String, required: true},
			img: {type: String, required: true},
			quantity: Number,
			details: {type: String, required: true}
});

module.exports = mongoose.model('Badge', badgeSchema);