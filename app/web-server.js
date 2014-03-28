#!/usr/bin/env node

var util = require('util'),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    events = require('events'),
	express = require('express');
	mongoose = require('mongoose'),
	models = require('./models.js'),
	API = require('./API.js')
mongoose.connect('mongodb://localhost/mydb');
var db = mongoose.connection;

var app = API.configAPI(express());


app.listen(8080);