var Message = function(to, subject, headers, html, attachments) {
	this.from = 'Northland Natural Food Co-op <sean@foodcoop.org.nz>'; // sender info
	this.to = to; // Comma separated list of recipients
	this.subject = subject; // Subject of the message
	this.headers = headers; //is an object
	this.text = ''; // plaintext body
	this.html = html; // HTML Body of the message
	this.attachments = attachments; //must be an array
};

var commonRecipients = [' "Sean Stanley" <sean@maplekiwi.com>', '"Michael Taylor" <michael@maplekiwi.com>']

var serverStartUp = new Message(
	commonRecipients, //to
	'The server has just been started up on a local machine somewhere.', //subject
	{'X-Laziness-level': 1000}, //headers
	'<p><b>Hello</b> The server was just started up by someone! And the mail settings are all working!</p>' //html body
	//no attachments
 );


var thankyouForContactingUs = {

    // sender info
    from: 'Northland Natural Food Co-op <sean@foodcoop.org.nz>',

    // Comma separated list of recipients
    to: ' "Sean Stanley" <sean@maplekiwi.com>, "Michael Taylor" <michael@maplekiwi.com>',

    // Subject of the message
    subject: 'Thankyou for contacting us', //

    headers: {
        'X-Laziness-level': 1000
    },

    // plaintext body
    text: '',

    // HTML body
    html:'<p><b>Hello</b> The server was just started up! And the mail settings are all working!</p>'

    // An array of attachments
    //attachments:[]
};


module.exports.serverStartUp = serverStartUp;