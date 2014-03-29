pony
====

Send email and a pony.

![pony](http://substack.net/images/pony.png)

example
=======

send an email with some options
-------------------------------

``` js
var pony = require('pony');

var opts = {
    host : 'localhost',
    port : 25,
    from : 'substack',
    to : 'root',
};

pony(opts, function (err, req) {
    if (err) console.error(err)
    else {
        req.setHeader('content-type', 'text/plain');
        req.setHeader('subject', 'greetings');
        req.end('oh hello');
    }
});
```

or you can curry the options for later
--------------------------------------

``` js
var pony = require('pony');

var send = pony({
    host : 'localhost',
    port : 25,
    from : 'substack',
});

send({ to : 'root' }, function (err, req) {
    if (err) console.error(err)
    else {
        req.setHeader('content-type', 'text/plain');
        req.setHeader('subject', 'protip');
        req.end('curry is tasty');
    }
});
```

methods
=======

``` js
var pony = require('pony')
```

pony(params, cb)
----------------

Send an email with some parameters `params`.

If you specify a callback `cb(err, req)` the message will be sent and you'll get
a request object.

If you don't specify a callback, `pony()` returns a new version of the pony
function with the `params` merged in as default options.

request object
--------------

The request object is a stream that behaves like the `req` you get from
`http.createServer()`.

SMTP messages are a lot like is HTTP messages is why.

req.setHeader(key, value)
-------------------------

Use `setHeader()` to set the `'content-type'`, `'subject'`, and such things
relevant to emails.

req.removeHeader(key)
---------------------

Remove a header.

req.write(data)
---------------

Write a string or Buffer to the message body after the headers.

req.end(data)
-------------

End the message body, optionally writing an additional Buffer or string `data`
first.

install
=======

With [npm](http://npmjs.org) do:

```
npm install pony
```

tests
=====

So many tests. Run them with `npm test`.

todo
====

* authentication
* ssl

pony comics
===========

[more shetland pony adventures](http://harkavagrant.com/index.php?id=131)

[pony returns](http://www.harkavagrant.com/index.php?id=284)

license
=======

MIT/X11
