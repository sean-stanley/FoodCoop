var util = require('util'),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    events = require('events'),
	flash = require('connect-flash'),
	express = require('express');
	mongoose = require('mongoose'),
	models = require('./models.js'),
	//mail = require('./mailer.js'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy;

exports.configAPI = function configAPI(app){
	app.configure(function(){
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(express.cookieParser());
		app.use(flash());
		app.use(express.session({ secret: 'Intrinsic Definability' }));
		app.use(passport.initialize());
		app.use(passport.session());
		app.use(app.router);
		app.use(express.static(__dirname));
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	});
	app.post("/api/email", function(req, res, next) {
		
	});
	
	app.get("/api/product", function(req, res, next) {
		models.Product.find(req.query, null, { sort:{ _id : 1 }}, function(e, results) {
			res.send(results);
		})
	});
	app.post("/api/product", function(req, res, next) {
		new models.Product({
				dateUploaded: Date.now(),
				category: req.category,
				productName: req.productName,
				variety: req.variety,
				price: req.price,
				quantity: req.quantity,
				units: req.units,
				refrigeration: req.refrigeration,
				ingredients: req.ingredients,
				description: req.description,
				certification: req.certification,
				producer: req.producerName,
				producerCompany: req.producerCompany
			}).save();
	});
	app.post("/api/product/edit", function(req, res, next) {
		var product = models.Product.findOne({_id : req._id}, function(e, results){
				product.category = req.body.category,
				product.productName = req.body.productName,
				product.variety = req.body.variety,
				product.price = req.body.price,
				product.quantity = req.body.quantity,
				product.units = req.body.units,
				product.refrigeration = req.body.refrigeration,
				product.ingredients = req.body.ingredients,
				product.description = req.body.description,
				product.certification = req.body.certification,
				product.producer = req.body.producerName,
				product.producerCompany = req.body.producerCompany
			}).save();
	});
	app.post("/api/product/delete", function(req, res, next) {
		models.Product.findOne({_id : req._id}, function(e, results){
			res.send(results)
		})
	});
	app.get("/api/order", function(req, res, next) {
		models.Order.find(req.query, null, { sort:{ _id : 1 }}, function(e, results){
			res.send(results)
		})
	});
	app.post("/api/order", function(req, res, next) {
		new models.Order({
			product: req.product._id,
			customer: req.customer._id,
			quantity: req.quantity,
			datePlaced: Date.now()
		}).save()
	});
	app.post("/api/order/delete", function(req, res, next) {
		models.Order.findOne({_id : req._id}, function(e, results){
			res.send(results)
		})
	});
	app.post("/api/order/confirm", function(req, res, next) { 
		models.Order.update({customer : req.customer._id, confirmed : false}, 
							{datePlaced : Date.now(), confirmed : true},
							{multi: true}, function(err,num,raw){
							})
		});
	app.get("/api/user", function(req, res, next) {
		models.User.find(req.query, null, { sort:{ _id : 1 }}, function(e, results){
			if (!e) {
				res.send(results);
			}
			else {
				console.log(e)
			}
		});
	});
	
	
	app.post("/api/user", function(req, res, next) {    
		models.User.register(new models.User({
			dateJoined : Date.now(),
			name : req.body.name,
			email : req.body.email,
			phone : req.body.phone,
			address : req.body.address,
			user_type : req.body.user_type}),
			req.body.password,
			function(err, account) {
				passport.authenticate('local')(req, res, function () {
				res.redirect('/');
			});
		});
	});
	app.post("/api/user/:id", function(req, res, next) {
		models.User.findById(req.params.id, function(e, user) {
			if (!e) {
				var userObject = user.toObject();
				for (key in req.body) {
					if (userObject[key] !== req.body[key]) {
						console.log("we are now replacing the old user's "+key+" which evaluates to: "+userObject[key]+" with the new value of: "+req.body[key]);
						user[key] = req.body[key];
					}
				}
				user.save();
				res.send(user);
			}
			else {
				console.log(e)
			}
		});
	});
	app.get("/api/user/:id", function(req, res, next) {
		models.User.findById(req.params.id, function(e, results){
			if (!e) {
				res.send(results);
			}
			else {
				console.log(e)
			}
		});
	});
	app.get("/api/user/producer/:producerName", function(req, res, next) {
		models.User.findOne({name: req.params.producerName}, null, { sort:{ _id : 1 }}, function(e, results){
			if (!e) {
				res.send(results);
			}
			else {
				console.log(e)
			}
		});
	});
	
	app.get("/api/user/:id/producer/logo", function(req, res, next) {
		models.User.findById(req.params.id, 'producerData.logo', function(e, results){
			if (!e) {
				res.send(results);
			}
			else {
				console.log(e)
			}
		});
	});
	app.post("/api/user/:id/producer/edit", function (req, res, next) {
		var user = models.User.findByIdAndUpdate(req.params.id, {producerData : req.body.producerData}, function (err, raw){
			if (err) return handleError(err);
			  console.log('The raw response from Mongo was ', raw);
			});
	})
	app.post("/api/user/delete", function(req, res, next) { //disabled
		models.User.findOne({_id : req._id}, function(e, results){
			res.send(results)
		})
	});
	app.get('/auth/session', function ensureAuthenticated(req, res, next) {
		if (req.isAuthenticated()) { return next(); }
		res.send(401);},
		function (req, res) {
			res.json(req.user.user_info);
	});
	app.post('/auth/session', function (req, res, next) {
		passport.authenticate('local', function(err, user, info) {
			var error = err || info;
			if (error) { return res.json(400, error); }
			req.logIn(user, function(err) {
				var userObject;
                
				if (req.user) {
					userObject = req.user.toObject();
				} 
                
				if (err) { 
					return res.send(err); 
				} else {
					if (userObject) {
						delete userObject.salt;
						delete userObject.hash;
						res.json(userObject);
					}
				}
			});
		})(req, res, next);
	});
	app.del('/auth/session', function (req, res) {
	  if(req.user) {
		req.logout();
		res.send(200);
	  } else {
		res.send(400, "Not logged in");
	  }
	});
 
	//Static stuff, won't be changed by users.
	app.get("/api/category", function(req, res, next) {
		models.Category.find(req.query, null, { sort:{ _id : 1 }}, function(e, results){
			res.send(results)
		})
	});
	app.get("/api/location", function(req, res, next) {
		models.Location.find(req.query, null, { sort:{ _id : 1 }}, function(e, results){
			res.send(results)
		})
	});
	app.get("/api/certification", function(req, res, next) {
		models.Certification.find(req.query, null, { sort:{ _id : 1 }}, function(e, results){
			res.send(results)
		})
	});
	return app;
}