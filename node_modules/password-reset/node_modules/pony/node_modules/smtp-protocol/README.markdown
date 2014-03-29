smtp-protocol
=============

Implements the smtp protocol for clients and servers.

This module does not relay any messages or perform disk I/O by itself.

examples
========

server
------

``` js
var smtp = require('smtp-protocol');

var server = smtp.createServer(function (req) {
    req.on('to', function (to, ack) {
        var domain = to.split('@')[1] || 'localhost';
        if (domain === 'localhost') ack.accept()
        else ack.reject()
    });
    
    req.on('message', function (stream, ack) {
        console.log('from: ' + req.from);
        console.log('to: ' + req.to);
        
        stream.pipe(process.stdout, { end : false });
        ack.accept();
    });
});

server.listen(9025);
```

usage:

```
$ node example/server.js 
```

elsewhere:

```
$ nc localhost 9025
250 beep
helo
250 
mail from: <beep@localhost>
250 
rcpt to: <boop@localhost>
250 
data
354 
Beep boop.
I am a computer.
.
250 
quit
221 Bye!
```

meanwhile:

```
from: beep@localhost
to: boop@localhost
Beep boop.
I am a computer.
```

client
------

``` js
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
```

output:

```
$ node example/client.js
[ 'beep ESMTP Postfix (Ubuntu)' ]
{ helo: 250,
  from: 250,
  to: 250,
  data: 354,
  message: 250,
  quit: 221 }
```

server methods
==============

var smtp = require('smtp-protocol')

smtp.createServer(domain=os.hostname(), cb)
-------------------------------------------

Return a new `net.Server` so you can `.listen()` on a port.

`cb(req)` fires for new connection. See the "requests" section below.

server requests
===============

events
------

Every event that can 

Every acknowledgeable event except "message" will implicitly call `ack.accept()`
if no listeners are registered.

If there are any listeners for an acknowledgeable event, exactly one listener
MUST call either `ack.accept()` or `ack.reject()`.

### 'greeting', cmd, ack

Emitted when `HELO`, `EHLO`, or `LHLO` commands are received.

Read the name of the command with `cmd.greeting`.
Read the optional domain parameter with `cmd.domain`.

### 'from', from, ack

Emitted when the `MAIL FROM:` command is received.

`from` is the email address of the sender as a string.

### 'to', to, ack

Emitted when the `RCPT TO:` command is received.

`to` is the email address of the recipient as a string.

### 'message', stream, ack

Emitted when the `DATA` command is received.

If the message request is accepted, the message body will be streamed through
`stream`.

This event has no implicit `ack.accept()` when there are no listeners.

### 'received', ack

Emitted when the body after the `DATA` command finishes.

### 'reset'

Emitted when the connection is reset from a `RSET` command.

### 'quit'

Emitted when the connection is closed from a `QUIT` command.

properties
----------

### req.from

The email address of the sender as a string.

### req.fromExt

Extended sender data if sent as a string.

### req.to

The email address of the recipient as a string.

### req.toExt

Extended recipient data if sent as a string.

### req.greeting

The greeting command. One of `'helo'`, `'ehlo'`, or `'lhlo'`.

### req.domain

The domain specified in the greeting.

server acknowledgements
=======================

Many request events have a trailing `ack` parameter.

If there are any listeners for an acknowledgeable event, exactly one listener
MUST call either `ack.accept()` or `ack.reject()`.

Consult [this handy list of SMTP codes](http://www.greenend.org.uk/rjk/2000/05/21/smtp-replies.html#SEND)
for which codes to use in acknowledgement responses.

ack.accept(code=250, message)
-----------------------------

Accept the command. Internal staged state modifications from the command are executed.

ack.reject(code, message)
-------------------------

Reject the command. Any staged state modifications from the command are discarded.

client methods
==============

For all `client` methods, `cb(err, code, lines)` fires with the server response.

var stream = smtp.connect(host='localhost', port=25, cb)
--------------------------------------------------------

Create a new SMTP client connection.

`host`, `port`, and `cb` are detected by their types in the arguments array so
they may be in any order.

You can use unix sockets by supplying a string argument that matches `/^[.\/]/`.

`cb(client)` fires when the connection is ready.

client.helo(domain, cb)
-----------------------

Greet the server with the `domain` string.

`cb(err, code, lines)` fires with the server response.

client.from(addr, ext=undefined, cb)
------------------------------------

Set the sender to the email address `addr` with optional extension data `ext`.

`cb(err, code, lines)` fires with the server response.

client.to(addr, ext=undefined, cb)
----------------------------------

Set the recipient to the email address `addr` with optional extension data `ext`.

`cb(err, code, lines)` fires with the server response.

client.data(cb)
---------------

Tell the server that we are about to transmit data.

`cb(err, code, lines)` fires with the server response.

client.message(stream, cb)
--------------------------

Write a message body from `stream` to the server.

`cb(err, code, lines)` fires with the server response.

client.quit(cb)
---------------

Ask the server to sever the connection.

`cb(err, code, lines)` fires with the server response.

client.reset(cb)
----------------

Ask the server to reset the connection.

`cb(err, code, lines)` fires with the server response.

client events
=============

'greeting', code, lines
-----------------------

Fired when the stream initializes. This should be the first message that the
server sends.

install
=======

With [npm](http://npmjs.org) do:

    npm install smtp-protocol
