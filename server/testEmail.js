var Emailer = require('./emailer'),
	adminRecipients = [' "Sean Stanley" <sean@maplekiwi.com>', '"Michael Taylor" <michael@maplekiwi.com>'],
	companyEmail = {email: 'sean@maplekiwi.com', name: 'Sean Stanley'};
	

function currentTime() {
	  var date, hour, min;
	  date = new Date();
	  hour = date.getHours();
	  min = date.getMinutes();
	  if (min < 10) {
		 min = '0' + min.toString();
	  }
	  return hour + ':' + min;
  }
  
var currentTimeString = currentTime();

var options = {
	template: 'server-start',
	subject: 'Server up and running',
	to: companyEmail,
};

var data = {
  name: 'Sean Stanley',
  AngularVersion: '1.2.26',
  expressVersion: '4.9.1',
  currentTime: currentTimeString,
  data: [1, 2, 3, 4, 5]
  };

serverStart = new Emailer(options, data);




serverStart.send(function(err, result) {
  if (err) {
    console.log(err);
  }
  console.log(result);
});



exports.testEmail = serverStart;
exports.adminEmail = adminRecipients;
exports.companyEmail = companyEmail;