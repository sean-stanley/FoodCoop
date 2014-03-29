var smtp = require('smtp-protocol');
var test = require('tap').test;
var pony = require('../');

test('send reject', function (t) {
    t.plan(3);
    var port = Math.floor(Math.random() * 5e4 + 1e4);
    
    var server = smtp.createServer(function (req) {
        req.on('from', function (from, ack) {
            t.equal(from, 'bad@horse.org');
            ack.reject(553, 'ACCESS DENIED');
        });
        
        req.on('message', function (stream, ack) {
            t.fail('no message should emit');
        });
    });
    
    server.listen(port, function () {
        sendMessage(t, server, port);
    });
});

function sendMessage (t, server, port) {
    var opts = {
        host : 'localhost',
        port : port,
        from : 'bad@horse.org',
        to : 'doctor@horrible.net',
    };
    
    pony(opts, function (err, req) {
        if (err) {
            t.equal(err.code, 553);
            t.equal(err.message, 'FROM not ok: ACCESS DENIED');
            t.end();
            server.close();
        }
        else t.fail('should have blown up')
    });
}
