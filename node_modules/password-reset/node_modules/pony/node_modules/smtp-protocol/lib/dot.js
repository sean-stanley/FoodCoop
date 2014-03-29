var es = require('event-stream');
var Stream = require('net').Stream;

exports.dot = function (source) {
    var first = true;
    var dot = es.map(function (buf, map) {
        var data = buf.toString();
        var s = first
            ? data.replace(/(^|\n)\./g, '$1..')
            : data.replace(/\n\./g, '\n..')
        ;
        first = data.charCodeAt(data.length - 1) === 10;
        map(null, s);
    });
    source.writable = true;
    source.readable = true;
    source.pipe(dot);
    return dot;
};

exports.undot = function (target) {
    var first = true;
    var dot = es.map(function (data, map) {
        var s = first
            ? data.replace(/(^|\n)\.\./g, '$1.')
            : data.replace(/\n\.\./g, '\n.')
        ;
        first = data.charCodeAt(data.length - 1) === 10;
        map(null, s);
    });
    target.writable = true;
    target.readable = true;
    return es.connect(dot, target);
};
