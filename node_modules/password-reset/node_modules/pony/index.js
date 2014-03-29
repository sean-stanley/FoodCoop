var smtp = require('smtp-protocol');
var seq = require('seq');
var Request = require('./lib/request');

module.exports = function pony (params, cb) {
    if (cb === undefined) {
        // curry the parameters
        return function (params_, cb_) {
            if (typeof params_ === 'function') {
                cb_ = params_;
                params_ = {};
            }
            Object.keys(params_).forEach(function (key) {
                params[key] = params_[key];
            });
            
            return pony(params, cb_);
        };
    }
    
    var finished = false;
    var c = smtp.connect(params.host, params.port, function (mail) {
        
        function error (msg, code, lines) {
            var s = msg + ': ' + lines.join(' ');
            var err = new Error(s);
            err.code = code;
            err.lines = lines;
            err.message = s;
            cb(err);
            
            finished = true;
            mail.quit();
        }
        
        seq()
            .seq(function () {
                mail.on('greeting', this.ok);
            })
            .seq(function (code, lines) {
                if (!(code >= 200 && code < 300)) {
                    error('greeting code not ok', code, lines);
                }
                else mail.helo(params.domain || 'localhost', this);
            })
            .seq(function (code, lines) {
                if (!(code >= 200 && code < 300)) {
                    error('HELO not ok', code, lines);
                }
                else mail.from(params.from, this);
            })
            .seq(function (code, lines) {
                if (!(code >= 200 && code < 300)) {
                    error('FROM not ok', code, lines);
                }
                else mail.to(params.to, this);
            })
            .seq(function (code, lines) {
                if (!(code >= 200 && code < 300)) {
                    error('TO not ok', code, lines);
                }
                else mail.data(this);
            })
            .seq_(function (next, code, lines) {
                if (code != 354) {
                    error('DATA not ok', code, lines);
                }
                else {
                    var req = new Request;
                    mail.message(req, function (err, code, lines) {
                        if (err) {
                            cb(err);
                            finished = true;
                            mail.quit();
                        }
                        else if (!(code >= 200 && code < 300)) {
                            req.emit('error', new Error(
                                'message rejected: '
                                + code + ' ' + lines.join(' ')
                            ));
                        }
                        else next()
                    });
                    cb(null, req);
                }
            })
            .catch(function (err) {
                cb(err);
                finished = true;
                mail.quit();
            })
            .seq(function () {
                mail.quit();
                finished = true;
            })
        ;
    });
    
    c.on('error', cb);
    c.on('end', function () {
        if (!finished) cb('connection terminated early');
    });
    
    return c;
};
