#!/usr/bin/env node

var util = require('util'),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    events = require('events'),
	express = require('express');
	mongoose = require('mongoose');
	models = require('./models.js')
mongoose.connect('mongodb://localhost/mydb')
var db = mongoose.connection;

var app = express();

app.configure(function(){
	app.use(express.bodyParser());
	app.use(express.methodOverride());
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
	new models.Product({dateUploaded: Date.now,
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
app.get("/api/order", function(req, res, next) {
	models.Order.find(req.query, null, { sort:{ _id : 1 }}, function(e, results){
		res.send(results)
	})
});
app.post("/api/order", function(req, res, next) {
	new models.Order({datePlaced: Date.now,
		product: req.product._id,
		producer: req.producer._id,
		customer: req.customer._id,
		quantity: req.quantity
	}).save()
});
app.get("/api/user", function(req, res, next) {
	models.User.find(req.query, null, { sort:{ _id : 1 }}, function(e, results){
		res.send(results)
	})
});
app.post("/api/user", function(req, res, next) {
	new models.User({dateJoined : Date.now,
			producerName : req.producerName,
			companyName : req.companyName,
			companyImg : req.companyImg,
			companyLogo : req.companyLogo,
			description : req.description,
			email : req.email,
			phone : req.phone,
			address : req.address,
			certification : req.certification,
			feedbackScore : req.feedbackScore,
			user_type : req.user_type}).save()
});
app.post("/api/user/edit", function(req, res, next) {
	var user = models.User.findOne({_id : req._id}, function(e, results){
		user.producerName = req.producerName;
		user.companyName = req.companyName;
		user.companyImg = req.companyImg;
		user.companyLogo = req.companyLogo;
		user.description = req.description;
		user.email = req.email;
		user.phone = req.phone;
		user.address = req.address;
		user.certification = req.certification;
		user.feedbackScore = req.feedbackScore;
		user.user_type = req.user_type;
		user.save();
		res.send(user);
	})
});

//Static stuff, won't change
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



app.listen(8080);