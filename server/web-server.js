#!/usr/bin/env node

var util = require('util'),
    http = require('http'),
    fs = require('fs'),
    path = require('path'),
    url = require('url'),
    events = require('events'),
	express = require('express'),
	mongoose = require('mongoose'),
	models = require('./models.js'),
	API = require('./API.js'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	bunyan = require('bunyan'),
	mcapi = require('mailchimp-api'),
    config = require('./config').Config;
	
	
var log = bunyan.createLogger({
	name: 'API', 
	serializers: {
		req: bunyan.stdSerializers.req,
		err: bunyan.stdSerializers.err,
		e: bunyan.stdSerializers.err,
		res: bunyan.stdSerializers.res,
		error: bunyan.stdSerializers.err
	}
});

var forgot = require('password-reset')({
    uri : 'http://localhost:8080/password_reset',
    from : 'password-robot@localhost',
    host : 'localhost', port : 25,
});

var options = {server: {}, replset: {}};
options.server.socketOptions = options.replset.socketOptions = { keepAlive: 1 };

mongoose.connect('mongodb://localhost/mydb', options);
var db = mongoose.connection;

// set MailChimp API key here
mc = new mcapi.Mailchimp('106c008a4dda3fa2fe00cae070e178b9-us9');

var app = API.configAPI(express());

// app options
//app.set('etag', false);
app.set('trust proxy', 'loopback');
app.set('env', 'production');


// Passport Authentication Setup
passport.use(models.User.createStrategy());
passport.serializeUser(models.User.serializeUser());
passport.deserializeUser(models.User.deserializeUser());
function loggedIn(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/');
  }
}

// SEO
app.use(require('prerender-node').set('prerenderToken', 'AyY6GHZSR0aiwAuXqDzm'));


// for deployment

var server_port = config.deploy.port || 8081,
	server_ip_address = 'localhost';

/*
app.listen(server_port, server_ip_address, function() {
	console.log("Listening on " + server_ip_address + ", " + server_port);
});*/

app.listen(server_port, server_ip_address, function() {
	console.log("Listening on " + server_ip_address + ", " + server_port);
});

