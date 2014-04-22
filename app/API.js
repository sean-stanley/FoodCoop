var util = require('util'),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    events = require('events'),
	express = require('express');
	mongoose = require('mongoose'),
	models = require('./models.js'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy;

exports.configAPI = function configAPI(app){
	app.configure(function(){
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(express.cookieParser());
		app.use(express.session({ secret: 'Intrinsic Definability' }));
		app.use(passport.initialize());
		app.use(passport.session());
		app.use(app.router);
		app.use(express.static(__dirname));
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	});
	app.get("/api/product", function(req, res, next) {
		models.Product.find(req.query, null, { sort:{ _id : 1 }}, function(e, results){
			res.send(results)
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
				producerCompany: req.producerCompany}).save();
	});
	app.post("/api/product/edit", function(req, res, next) {
		var product = models.Product.findOne({_id : req._id}, function(e, results){
				product.category = req.category,
				product.productName = req.productName,
				product.variety = req.variety,
				product.price = req.price,
				product.quantity = req.quantity,
				product.units = req.units,
				product.refrigeration = req.refrigeration,
				product.ingredients = req.ingredients,
				product.description = req.description,
				product.certification = req.certification,
				product.producer = req.producerName,
				product.producerCompany = req.producerCompany}).save();
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
			month: req.month-ordered,
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
			res.send(results)
		})
	});
	app.post("/api/user", function(req, res, next) {    
		console.log(req.body.name);
		models.User.register(new models.User({
			dateJoined : Date.now(),
			name : req.body.name,
			email : req.body.email,
			phone : req.body.phone,
			address : req.body.address,
			user_type : req.body.user_type,
			customer : req.body._id, 
			password : req.body.password }),
			function(err, account) {
				passport.authenticate('local')(req, res, function () {
				res.redirect('/');
			});
		});
	});
	app.post("/api/user/edit", function(req, res, next) {
		var user = req.user;
			user.email = req.body.email;
			user.phone = req.body.phone;
			user.name = req.body.name;
			user.address = req.body.address;
			user.user_type = req.body.user_type;
			user.save();
			res.send(user);
	});
	app.post("api/user/producer/edit", function (req, res, next) {
		var user = req.user;
			user.producerData.companyName = req.body.companyName;
			user.producerData.companyImg = req.body.companyImg;
			user.producerData.companyLogo = req.body.companyLogo;
			user.producerData.description = req.body.description;
			user.producerData.feedbackScore = req.body.feedbackScore;
			user.save();
	})
	app.post("/api/user/delete", function(req, res, next) { //disabled
		models.User.findOne({_id : req._id}, function(e, results){
			res.send(results)
		})
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