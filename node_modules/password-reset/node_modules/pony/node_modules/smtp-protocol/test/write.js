var test = require('tap').test;
var write = require('../lib/server/write');
var Stream = require('net').Stream;

test('writes', function (t) {
    var output = '';
    var stream = {
        write : function (buf) { output += buf }
    };
    
    var w = write(stream);
    w(200, 'ok');
    t.deepEqual(output, '200 ok\r\n');
    output = '';
    
    w(303, [ 'beep', 'boop' ]);
    t.deepEqual(output, '303-beep\r\n303 boop\r\n');
    output = '';
    
    w(123, 'oh\nhello');
    t.deepEqual(output, '123-oh\r\n123 hello\r\n');
    output = '';
    
    w(555, [ 'abc\r\ndef\nhijkl', 'mno\npq', 'rstuv' ]);
    t.deepEqual(
        output,
        '555-abc\r\n555-def\r\n555-hijkl\r\n555-mno\r\n555-pq\r\n555 rstuv\r\n'
    );
    output = '';
    
    t.end();
});
