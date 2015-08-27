var gm = require('gm');

// @data is a base64 string
// @coords is an array of the following form [x, y, x2, y2, w, h]
// @resize must be an object like {x: #Number, y:#Number}
function cropImage (data, coords, resize, cb) {
	var base64Data = data.replace(/^data:image\/(jpeg|png);base64,/, '');
	gm(new Buffer(base64Data, 'base64') )
	.crop(coords[4], coords[5], coords[0], coords[1])
	.resize(resize.x, resize.y)
	.toBuffer(cb);
	// .toBuffer(function(err, buffer) {
	// 	cb(err, buffer);
	// });
}

exports.crop = function(req, res, next) {
	cropImage(req.body.src, req.body.selection, req.body.dimensions, function(err, buffer) {
		if (err) return next(err);
		var result = 'data:image/jpeg;base64,' + buffer.toString('base64');
		res.json(result);
	});
};
