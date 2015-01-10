// Express Middleware for checking if users are logged in and have permission to use different API features.
exports.isLoggedIn = function isLoggedIn(req, res, next) {
	if (req.user) next();
	else res.status(401).end();
};

exports.isAdmin = function isAdmin(req, res, next) {
	if (req.user && req.user.user_type.isAdmin) next();
	else res.status(401).end();
};

exports.canSell = function canSell(req, res, next) {
	if (req.user && req.user.user_type.canSell) {
		next();
	} else res.status(401).end();
};

exports.isMe = function isMe(req, res, next) {
	if (req.user && req.user._id == req.params.user || req.user && req.user.user_type.isAdmin) next();
	else res.status(401).end(); 
};