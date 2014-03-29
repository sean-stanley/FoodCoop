var smtp = require('../');
var test = require('tap').test;
var net = require('net');
var chunky = require('chunky');

test('server accept/reject', function (t) {
    t.plan(4);
    
    var port = Math.floor(Math.random() * 5e4 + 1e4);
    var server = smtp.createServer('localhost', function (req) {
        req.on('to', function (to, ack) {
            var domain = to.split('@')[1];
            if (domain === 'localhost') ack.accept()
            else ack.reject(553, [
                'Recipients must be on these domains:',
                'localhost',
            ])
        });
        
        req.on('message', function (stream, ack) {
            t.equal(req.from, 'beep@localhost');
            t.equal(req.to, 'boop@localhost');
            
            var data = '';
            stream.on('data', function (buf) { data += buf });
            stream.on('end', function () {
                t.equal(data, 'Beep boop.\r\n...I am a computer.\r\n');
            });
            ack.accept();
        });
    });
    server.listen(port, function () {
        var script = '';
        var lines = [
            'helo',
            'mail from: <beep@localhost>',
            'rcpt to: <boop@example.com>',
            'rcpt to: <boop@localhost>',
            'data',
            'Beep boop.',
            '....I am a computer.',
            '.',
            'quit',
        ];
        var c = net.createConnection(port, function () {
            var iv = setInterval(function () {
                var line = lines.shift();
                c.write(line + '\r\n');
                script += line + '\r\n';
                if (lines.length === 0) clearInterval(iv);
            }, 100);
        });
        c.on('data', function (buf) { script += buf });
        
        c.on('end', function () {
            t.equal(script, [
                '250 localhost',
                'helo',
                '250',
                'mail from: <beep@localhost>',
                '250',
                'rcpt to: <boop@example.com>',
                '553-Recipients must be on these domains:',
                '553 localhost',
                'rcpt to: <boop@localhost>',
                '250',
                'data',
                '354',
                'Beep boop.',
                '....I am a computer.',
                '.',
                '250',
                'quit',
                '221 Bye!',
                ''
            ].join('\r\n'));
            t.end();
            server.close();
        });
    });
});
