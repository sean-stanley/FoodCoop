var test = require('tap').test;
var parser = require('../lib/server/parser');

var chunky = require('chunky');
var Stream = require('net').Stream;

test('multi-line code parsing', function (t) {
    function check (end) {
        var stream = new Stream;
        var output = [];
        
        parser(stream, function (err, code, lines) {
            if (err) t.fail(err);
            output.push([ code, lines ]);
        });
        
        var chunks = chunky(new Buffer([
            '100 single',
            '200-one',
            '200-two',
            '200 three',
            '45 beep',
            '50 boop',
            '22',
            ''
        ].join('\r\n')));
        
        var iv = setInterval(function () {
            var c = chunks.shift();
            if (c) stream.emit('data', c)
            if (chunks.length === 0) {
                clearInterval(iv);
                t.deepEqual(output, [
                    [ 100, [ 'single' ] ],
                    [ 200, [ 'one', 'two', 'three' ] ],
                    [ 45, [ 'beep' ] ],
                    [ 50, [ 'boop' ] ],
                    [ 22, [] ],
                ]);
                end();
            }
        }, 10);
    }
    
    t.plan(20);
    var times = 0;
    check(function end () {
        if (++times === 20) {
            t.end();
        }
        else check(end);
    });
});
