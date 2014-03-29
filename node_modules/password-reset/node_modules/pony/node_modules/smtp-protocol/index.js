var net = require('net');

var proto = exports.protocol = {
    client : require('./lib/client/proto'),
    server : require('./lib/server/proto'),
};

exports.createServer = function (domain, cb) {
    if (typeof domain === 'function') {
        cb = domain;
        domain = undefined;
    }
    
    return net.createServer(function (stream) {
        cb(proto.client(domain, stream));
    });
};

exports.connect = function (port, host, cb) {
    var args = [].slice.call(arguments).reduce(function (acc, arg) {
        acc[typeof arg] = arg;
        return acc;
    }, {});
    var cb = args.function;
    var stream;
    
    if (args.string && args.string.match(/^[.\/]/)) {
        // unix socket
        stream = net.createConnection(args.string);
    }
    else {
        var port = args.number || 25;
        var host = args.string || 'localhost';
        stream = net.createConnection(port, host);
    }
    
    stream.on('connect', function () {
        cb(proto.server(stream));
    });
    return stream;
};
