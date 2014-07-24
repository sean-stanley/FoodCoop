var Emailer = require('./emailer')
var adminRecipients = [' "Sean Stanley" <sean@maplekiwi.com>', '"Michael Taylor" <michael@maplekiwi.com>'];
var companyEmail = {email: 'sean@maplekiwi.com', name: 'Sean Stanley'}

function currentTime() {
	  var date, hour, min;
	  date = new Date();
	  hour = date.getHours();
	  min = date.getMinutes();
	  if (min < 10) {
		 min = '0' + min.toString()
	  }
	  return hour + ":" + min;
  };
  
var currentTimeString = currentTime();

var options = {
	template: "server-start",
	subject: "Server up and running",
	to: companyEmail
};

var data = {
  name: "Sean Stanley",
  AngularVersion: "1.3.0-beta.5",
  expressVersion: "4.6.1",
  currentTime: currentTimeString
  };

serverStart = new Emailer(options, data);


serverStart.send(function(err, result) {
  if (err) {
    return console.log(err);
  }
  console.log("Message sent")
});


exports.adminEmail = adminRecipients;
exports.companyEmail = companyEmail;