var smtp = require('../');
var test = require('tap').test;
var net = require('net');

var seq = require('seq');
var fs = require('fs');

test('bad sequence', function (t) {
    t.plan(8);
    
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
        
        req.on('quit', function () {
            t.ok(true);
        });
    });
    server.listen(port, function () {
        var script = '';
        var c = smtp.connect(port, sendData.bind(null, t));
        
        var _write = c.write;
        c.write = function (buf) {
            script += buf;
            _write.apply(c, arguments);
        };
        
        c.on('data', function (buf) { script += buf });
        
        c.on('end', function () {
            t.equal(script, [
                '250 localhost',
                'HELO localhost',
                '250',
                'MAIL FROM: <beep@localhost>',
                '250',
                'DATA',
                '503 Bad sequence: RCPT expected',
                'RCPT TO: <boop@localhost>',
                '250',
                'DATA',
                '354',
                'Beep boop.',
                '....I am a computer.',
                '.',
                '250',
                'QUIT',
                '221 Bye!',
                ''
            ].join('\r\n'));
            t.end();
            server.close();
        });
    });
});

function sendData (t, mail) {
    seq()
        .seq_(function (next) {
            mail.on('greeting', function (code, lines) {
                next();
            });
        })
        .seq(function (next) {
            mail.helo('localhost', this);
        })
        .seq(function () {
            mail.from('beep@localhost', this);
        })
        .seq_(function (next) {
            mail.data(function (err, code, lines) {
                t.ok(!err);
                t.equal(code, 503);
                t.equal(lines.join(''), 'Bad sequence: RCPT expected');
                next();
            })
        })
        .seq(function () {
            mail.to('boop@localhost', this.ok);
        })
        .seq(function () {
            mail.data(this)
        })
        .seq(function () {
            var stream = new net.Stream;
            setTimeout(function () {
                stream.emit('data', 'Beep boop.\r\n');
            }, 10);
            setTimeout(function () {
                stream.emit('data', '...I am a computer.');
                stream.emit('end');
            }, 20);
            mail.message(stream, this);
        })
        .seq(function () {
            mail.quit(this);
        })
    ;
}
