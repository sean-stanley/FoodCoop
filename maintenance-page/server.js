var express = require('express');
var path = require('path');
var app = express();

/*
app.get('*', function(req, res){
  res.send('Be back soon!');
});*/


app.use(function(req, res){
	res.sendFile(path.normalize(path.join(__dirname, 'maintenance.html')));
});

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});
