var smtp = require('../');
var seq = require('seq');
var fs = require('fs');

smtp.connect('localhost', 25, function (mail) {
    seq()
        .seq_(function (next) {
            mail.on('greeting', function (code, lines) {
                console.dir(lines);
                next();
            });
        })
        .seq(function (next) {
            mail.helo('localhost', this.into('helo'));
        })
        .seq(function () {
            mail.from('substack', this.into('from'));
        })
        .seq(function () {
            mail.to('root', this.into('to'));
        })
        .seq(function () {
            mail.data(this.into('data'))
        })
        .seq(function () {
            mail.message(fs.createReadStream('/etc/issue'), this.into('message'));
        })
        .seq(function () {
            mail.quit(this.into('quit'));
        })
        .seq(function () {
            console.dir(this.vars);
        })
    ;
});
