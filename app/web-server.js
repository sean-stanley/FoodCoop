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
	models.Product.find(req.query, function(e, results){
		res.send(results)
	})
});
app.get("/api/order", function(req, res, next) {
	models.Order.find(req.query, function(e, results){
		res.send(results)
	})
});
app.get("/api/user", function(req, res, next) {
	models.User.find(req.query, function(e, results){
		res.send(results)
	})
});
app.get("/api/category", function(req, res, next) {
	models.Category.find(req.query, function(e, results){
		res.send(results)
	})
});
app.get("/api/location", function(req, res, next) {
	models.Location.find(req.query, function(e, results){
		res.send(results)
	})
});
app.get("/api/certification", function(req, res, next) {
	models.Certification.find(req.query, function(e, results){
		res.send(results)
	})
});



app.listen(8080);