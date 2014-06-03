#!/usr/bin/env node

var util = require('util'),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    events = require('events'),
	express = require('express'),
	mongoose = require('mongoose'),
	models = require('./models.js'),
	API = require('./API.js'),
	mailer = require('./mailer.js'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy;

var forgot = require('password-reset')({
    uri : 'http://localhost:8080/password_reset',
    from : 'password-robot@localhost',
    host : 'localhost', port : 25,
});

mongoose.connect('mongodb://localhost/mydb');
var db = mongoose.connection;

var app = API.configAPI(express());

app.use(express.static(__dirname));
app.use(forgot.middleware);
passport.use(models.User.createStrategy());
passport.serializeUser(models.User.serializeUser());
passport.deserializeUser(models.User.deserializeUser());



app.listen(8080);