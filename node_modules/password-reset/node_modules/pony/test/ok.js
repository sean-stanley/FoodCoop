var smtp = require('smtp-protocol');
var test = require('tap').test;
var pony = require('../');

test('send ok', function (t) {
    t.plan(3);
    var port = Math.floor(Math.random() * 5e4 + 1e4);
    
    var server = smtp.createServer(function (req) {
        req.on('message', function (stream, ack) {
            t.equal(req.from, 'bad@horse.org');
            t.equal(req.to, 'doctor@horrible.net');
            
            var data = '';
            stream.on('data', function (buf) { data += buf });
            stream.on('end', function () {
                t.equal(data, [
                    'content-type: text/plain',
                    'subject: greetings applicant',
                    '',
                    'Your application has been accepted.',
                    ''
                ].join('\r\n'));
            });
            
            ack.accept();
        });
        
        req.on('quit', function () {
            t.end();
            server.close();
        });
    });
    
    server.listen(port, function () {
        sendMessage(t, port);
    });
});

function sendMessage (t, port) {
    var opts = {
        host : 'localhost',
        port : port,
        from : 'bad@horse.org',
        to : 'doctor@horrible.net',
    };
    
    pony(opts, function (err, req) {
        if (err) t.fail(err)
        else {
            req.setHeader('content-type', 'text/plain');
            req.setHeader('subject', 'greetings applicant');
            req.end('Your application has been accepted.');
        }
    });
}
