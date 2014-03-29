exports.parseData = function (cb) {
    var self = this;
    var line = '';
    
    self.stream.on('data', function ondata (buf, offset) {
        if (offset === undefined) offset = 0;
        
        if (self.bytes) {
            var ix = Math.min(buf.length, offset + self.bytes);
            var chunk = buf.slice(offset, ix);
            self.target.write(chunk);
            
            self.bytes -= chunk.length;
            if (self.bytes === 0) {
                if (buf.length > offset + chunk.length) {
                    ondata(buf, offset + chunk.length);
                }
                self.target.end();
            }
        }
        else {
            for (var i = offset; i < buf.length; i++) {
                if (buf[i] === 10) {
                    cb(line.replace(/\r$/, ''));
                    line = '';
                    if (buf.length > i + 1) ondata(buf, i + 1);
                    break;
                }
                else line += String.fromCharCode(buf[i])
            }
        }
    });
}

exports.getBytes = function (n, target) {
    this.bytes = n;
    this.target = target;
};
