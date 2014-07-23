var config = require('./config').Config;

var nodemailer = require('nodemailer'),
	mailTemplate = require('./staticMail');


// Create a SMTP transport object
var transport = nodemailer.createTransport("SMTP", {
        service: 'Gmail', // use well known service.
                            // If you are using @gmail.com address, then you don't
                            // even have to define the service name
        auth: config.gmailCredentials
    });

console.log('SMTP Configured');

// Message object


console.log('Sending Mail');

transport.sendMail(mailTemplate.serverStartUp, function(error){
    if(error){
        console.log('Error occured');
        console.log(error.message);
        return;
    }
    console.log('Message sent successfully!');

    // if you don't want to use this transport object anymore, uncomment following line
    //transport.close(); // close the connection pool
});


exports.transport = transport;