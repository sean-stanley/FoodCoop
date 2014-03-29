#!/usr/bin/env node

var util = require('util'),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    events = require('events'),
	express = require('express');
	mongoose = require('mongoose'),
	models = require('./models.js'),
	API = require('./API.js'),
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
app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true })
);

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});
app.use(forgot.middleware);


passport.use(new LocalStrategy({usernameField: 'email'},models.User.createStrategy()));
passport.serializeUser(models.User.serializeUser());
passport.deserializeUser(models.User.deserializeUser());




app.listen(8080);