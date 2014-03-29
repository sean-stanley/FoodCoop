password-reset
==============

middleware for managing password reset emails

example
-------

``` js
var fs = require('fs');
var express = require('express');
var app = express.createServer();

app.use(express.static(__dirname));
app.use(require('sesame')()); // for sessions

var forgot = require('password-reset')({
    uri : 'http://localhost:8080/password_reset',
    from : 'password-robot@localhost',
    host : 'localhost', port : 25,
});
app.use(forgot.middleware);

app.post('/forgot', express.bodyParser(), function (req, res) {
    var email = req.body.email;
    var reset = forgot(email, function (err) {
        if (err) res.end('Error sending message: ' + err)
        else res.end('Check your inbox for a password reset message.')
    });
    
    reset.on('request', function (req_, res_) {
        req_.session.reset = { email : email, id : reset.id };
        fs.createReadStream(__dirname + '/forgot.html').pipe(res_);
    });
});

app.post('/reset', express.bodyParser(), function (req, res) {
    if (!req.session.reset) return res.end('reset token not set');
    
    var password = req.body.password;
    var confirm = req.body.confirm;
    if (password !== confirm) return res.end('passwords do not match');
    
    // update the user db here
    
    forgot.expire(req.session.reset.id);
    delete req.session.reset;
    res.end('password reset');
});

app.listen(8080);
console.log('Listening on :8080');
```

methods
=======

var forgot = require('password-reset')(opts)
--------------------------------------------

Create a new password reset session `forgot` with some options `opts`.

`opts.uri` must be the location of the password reset route, such as
`'http://localhost:8080/_password_reset'`. A query string is appended to
`opts.uri` with a unique one-time hash.

`opts.body(uri)` can be a function that takes the password reset link `uri` and
returns the email body as a string.

The rest of the options are passed directly to
[node-pony](https://github.com/substack/node-pony).

When the user clicks on the uri link `forgot` emits a `"request", req, res`
event.

var reset = forgot(email, cb)
-----------------------------

Send a password reset email to the `email` address.
`cb(err)` fires when the email has been sent.

forgot.middleware(req, res, next)
---------------------------------

Use this middleware function to intercept requests on the `opts.uri`.

forgot.expire(id)
-----------------

Prevent a session from being used again. Call this after you have successfully
reset the password.

attributes
==========

reset.id
--------

Pass this value to `forgot.expire(id)`.

events
======

reset.on('request', function (req, res) { ... })
------------------------------------------------

Emitted when the user clicks on the password link from the email.

reset.on('failure', function (err) { ... })
-------------------------------------------

Emitted when an error occurs sending email. You can also listen for this event
in `forgot()`'s callback.

reset.on('success', function () {})
-----------------------------------

Emitted when an email is successfully sent.

install
=======

With [npm](http://npmjs.org) do:

```
npm install password-reset
```

license
=======

MIT/X11
