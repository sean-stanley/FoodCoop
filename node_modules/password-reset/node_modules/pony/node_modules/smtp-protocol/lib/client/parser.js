module.exports = function (stream) {
    return new ClientParser(stream);
};

function ClientParser (stream) {
    var self = this;
    self.stream = stream;
    self.lines = [];
    self.queue = [];
    
    self.parseData(function (line) {
        if (self.queue.length) {
            self.queue.shift()(line);
        }
        else {
            self.lines.push(line);
        }
    });
}

ClientParser.prototype = require('../parse_data');

ClientParser.prototype.getLine = function (cb) {
    this.queue.push(cb);
};

ClientParser.prototype.getUntil = function getUntil (terminal, target) {
    var self = this;
    self.getLine(function getLine (line) {
        if (line === terminal) target.end()
        else {
            target.write(line + '\r\n');
            self.getLine(getLine);
        }
    });
};

ClientParser.prototype.getCommand = function (cb) {
    this.getLine(function (line) {
        var m = line.match(/^(\S+)(?:\s+(.*))?$/);
        if (!m) cb('syntax error')
        else {
            var cmd = parse(m[1].toLowerCase(), m[2]);
            if (cmd instanceof Error) cb(cmd)
            else cb(null, cmd)
        }
    });
};

function parse (cmd, data) {
    var res = { name : cmd, data : data };
    
    switch (cmd) {
        case 'helo' :
        case 'ehlo' :
        case 'lhlo' :
            res.name = 'greeting';
            res.greeting = cmd;
            res.domain = data;
            break;
        
        case 'mail' :
            if (!data) return error(501, 'incomplete mail command');
            
            var m = data.match(/^from\s*:\s*(\S+)(?:\s+(.*))?/i);
            if (!m) return error(501, 'parse error in mail command');
            res.from = m[1].replace(/^</, '').replace(/>$/, '');
            res.ext = m[2];
            
            break;
        
        case 'rcpt' :
            if (!data) return error(501, 'incomplete rcpt command');
            
            var m = data.match(/^to\s*:\s*(\S+)(?:\s+(.*))?/i);
            if (!m) return error(501, 'parse error in rcpt command');
            res.to = m[1].replace(/^</, '').replace(/>$/, '');
            res.ext = m[2];
            
            break;
        
        case 'quit' :
        case 'data' :
            break;
        
        case 'rset' :
        case 'send' :
        case 'soml' :
        case 'saml' :
        case 'vrfy' :
        case 'expn' :
        case 'help' :
        case 'noop' :
        case 'turn' :
            break;
        
        default :
            return error(500, 'unrecognized command');
    }
    return res;
}

function error (code, msg) {
    var err = new Error(msg);
    err.code = code;
    return err;
}
