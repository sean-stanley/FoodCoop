module.exports = function (stream, cb) {
    return new ServerParser(stream, cb);
};

function ServerParser (stream, cb) {
    this.stream = stream;
    this.bytes = 0;
    this.target = null;
    
    this.parseLines(cb);
}

ServerParser.prototype = require('../parse_data');

ServerParser.prototype.getBytes = function (n, target) {
    this.bytes = n;
    this.target = target;
};

ServerParser.prototype.parseLines = function (cb) {
    var self = this;
    var continuation = null;
    
    self.parseData(function (line) {
        var m = line.match(/^(\d+)(?:([- ])(.+))?$/);
        var code = m && parseInt(m[1], 10);
        
        if (!m) {
            cb('syntax error');
        }
        else if (continuation) {
            if (code !== continuation.code) {
                cb('inconsistent code in line continuation');
            }
            else {
                continuation.lines.push(m[3]);
                if (m[2] !== '-') {
                    cb(null, continuation.code, continuation.lines);
                    continuation = null;
                }
            }
        }
        else if (m[2] === '-') {
            continuation = { code : code, lines : [ m[3] ] };
        }
        else if (m[3] === undefined) {
            cb(null, code, []);
        }
        else cb(null, code, [ m[3] ]);
    });
}
