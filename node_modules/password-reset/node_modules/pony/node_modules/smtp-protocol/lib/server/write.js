module.exports = function (stream) {
    return function (code, lines, defaultCode) {
        if (typeof code === 'string' && code.match(/^\d+$/)) {
            code = parseInt(code, 10);
        }
        else if (typeof code !== 'number' && !lines) {
            msg = code;
            code = undefined;
        }
        if (code === undefined) code = defaultCode;
        
        if (lines === undefined) lines = [];
        if (lines.length === 0) lines = [ '' ];
        
        if (typeof lines === 'string') lines = [ lines ];
        lines = lines.reduce(function (acc, line) {
            return acc.concat(line.split(/\r?\n/));
        }, []);
        
        lines.forEach(function (line, i) {
            var blank = line.length === 0 ? '' : ' ';
            stream.write(
                code
                + (i === lines.length - 1 ? blank : '-')
                + line
                + '\r\n'
            );
        });
    };
};
