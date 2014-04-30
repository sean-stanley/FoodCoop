"use strict";

module.exports = {
	reporter: function (results, data, opts) {
		var len = results.length;
		var str = '';
		var prevfile;
        var type;

		opts = opts || {};

		results.forEach(function (result) {
			var file = result.file;
			var error = result.error;

			if (prevfile && prevfile !== file) {
				str += "\n";
			}
			prevfile = file;

            if (error.code[0] === 'W' || error.code[0] === 'I') {
                type = 'warning';
            } else {
                type = 'error';
            }

			str += file  + ':' + error.line + ':' +
				error.character + ': ' + type + ': ' + error.reason;

			if (opts.verbose) {
				str += ' (' + error.code + ')';
			}

			str += '\n';
		});

		if (str) {
			process.stdout.write(str + "\n" + len + ' error' + ((len === 1) ? '' : 's') + "\n");
		}
	}
};
