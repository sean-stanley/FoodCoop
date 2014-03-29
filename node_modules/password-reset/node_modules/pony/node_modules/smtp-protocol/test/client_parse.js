var test = require('tap').test;
var parser = require('../lib/client/parser');

var chunky = require('chunky');
var Stream = require('net').Stream;

test('multi-line code parsing', function (t) {
    function check (end) {
        var stream = new Stream;
        var output = [];
        var data = '';
        
        var p = parser(stream);
        (function next () {
            p.getCommand(function (err, cmd) {
                if (err) t.fail(err);
                output.push(cmd);
                
                if (cmd.name === 'data') {
                    p.getUntil('.', {
                        write : function (buf) { data += buf },
                        end : next,
                    });
                }
                else if (cmd.name === 'quit') {
                    t.equal(output[0].name, 'greeting');
                    t.equal(output[0].greeting, 'ehlo');
                    t.equal(output[0].domain, 'localhost');
                    
                    t.equal(output[1].name, 'mail');
                    t.equal(output[1].from, 'beep@example.com');
                    
                    t.equal(output[2].name, 'rcpt');
                    t.equal(output[2].to, 'boop@example.com');
                    
                    t.equal(output[3].name, 'data');
                    t.equal(data, [
                        'Greetings.',
                        'I am a computer.',
                        'Beep boop.',
                        ''
                    ].join('\r\n'));
                    
                    end();
                }
                else next()
            });
        })();
        
        var chunks = chunky(new Buffer([
            'ehlo localhost',
            'mail from: <beep@example.com>',
            'rcpt to: <boop@example.com>',
            'data',
            'Greetings.',
            'I am a computer.',
            'Beep boop.',
            '.',
            'quit',
            ''
        ].join('\r\n')));
        
        var iv = setInterval(function () {
            var c = chunks.shift();
            if (c) stream.emit('data', c)
            if (chunks.length === 0) {
                clearInterval(iv);
            }
        }, 10);
    }
    
    var times = 20;
    t.plan(times * 9);
    check(function end () {
        if (--times === 0) {
            t.end();
        }
        else check(end);
    });
});
