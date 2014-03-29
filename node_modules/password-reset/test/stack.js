var tap = require('tap');
var test = tap.test;

var express = require('express');
var request = require('request');
var smtp = require('smtp-protocol');
var passwordReset = require('../');

var ports = {
    smtp : Math.floor(Math.random() * 5e5 + 1e5),
    http : Math.floor(Math.random() * 5e5 + 1e5),
};

var server = smtp.createServer(function (req) {
    req.on('message', function (stream, ack) {
        var data = '';
        stream.on('data', function (buf) { data += buf });
        stream.on('end', function () {
            server.emit(req.to, data.match(/(http:\/\/[^"]+)/)[1]);
        });
        ack.accept();
    });
});
server.listen(ports.smtp);

var app = express.createServer();
app.listen(ports.http);
app.use(require('sesame')());

var forgot = passwordReset({
    uri : 'http://localhost:' + ports.http + '/password_reset',
    from : 'password-robot@localhost',
    host : 'localhost', port : ports.smtp,
});
app.use(forgot.middleware);

app.post('/forgot', express.bodyParser(), function (req, res) {
    var email = req.body.email;
    
    var reset = forgot(email, function (err) {
        if (err) {
            res.statusCode = 500;
            res.end(err.toString());
        }
        else res.end('sent')
    });
    
    reset.on('request', function (req_, res_) {
        req_.session.reset = { email : email, id : reset.id };
        res_.end('forgot');
    });
});

app.post('/reset', express.bodyParser(), function (req, res) {
    res.statusCode = 401;
    if (!req.session.reset) return res.end('reset token not set');
    
    var password = req.body.password;
    var confirm = req.body.confirm;
    if (password !== confirm) return res.end('passwords do not match');
    
    // update the user db here
    
    forgot.expire(req.session.reset.id);
    delete req.session.reset;
    res.statusCode = 200;
    res.end('password reset');
});

test('reset success', function (t) {
    var uri = 'http://localhost:' + ports.http;
    var to = t.conf.name.replace(/ /g, '.') + '@localhost';
    
    var opts = {
        uri : uri + '/forgot',
        headers : {
            'content-type' : 'application/x-www-form-urlencoded',
        },
    };
    var cookie;
    var req = request.post(opts, function (e, r, b) {
        if (e) t.fail(e);
        
        cookie = r.headers['set-cookie'];
        t.equal(b, 'sent');
    });
    req.end('email=' + to);
    
    server.on(to, function (link) {
        request.get(
            { uri : link, headers : { cookie : cookie } },
            function (e, r, b) {
                t.equal(b, 'forgot');
                reset(function (e, b) {
                    if (e) t.fail(e);
                    t.equal(b, 'password reset');
                    reset(function (e, b) {
                        if (e) t.fail(e);
                        t.equal(b, 'reset token not set', 'expiry check');
                        t.end();
                    });
                });
            }
        );
    });
    
    function reset (cb) {
        request.post(
            { uri : uri + '/reset', headers : { cookie : cookie } },
            function (e, r, b) { cb(e, b) }
        );
    }
});

test('invalid token', function (t) {
    var opts = {
        uri : 'http://localhost:' + ports.http + '/password_reset?beepboop==',
    }
    request(opts, function (e, r, b) {
        t.equal(b, 'auth token expired');
        t.end();
    });
});

tap.on('end', function () {
    app.close();
    server.close();
});
