var test = require('tap').test;
var parser = require('../lib/server/parser');

var chunky = require('chunky');
var Stream = require('net').Stream;

test('byte parsing', function (t) {
    function check (end) {
        var stream = new Stream;
        var output = [];
        var data = '', ended = 0;
        
        var p = parser(stream, function (err, code, lines) {
            if (err) t.fail(err);
            output.push([ code, lines ]);
            if (code === 200) {
                var target = {
                    write : function (buf) { data += buf },
                    end : function () { ended ++ }
                }
                p.getBytes(32, target);
            }
        });
        
        var chunks = chunky(new Buffer([
            '100 single',
            '200-one',
            '200-two',
            '200 three',
            'abcdefghi\njkl\nmno\npqrs\ntuvwxyz',
            '45 beep',
            '50 boop',
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
                ]);
                t.equal(data, 'abcdefghi\njkl\nmno\npqrs\ntuvwxyz\r\n');
                t.equal(ended, 1);
                end();
            }
        }, 10);
    }
    
    var times = 1;
    t.plan(3 * times);
    check(function end () {
        if (--times === 0) {
            t.end();
        }
        else check(end);
    });
});
