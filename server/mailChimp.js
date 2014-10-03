var config = require('./coopConfig.js'),
	mongoose = require('mongoose'),
	ObjectId = require('mongoose').Types.ObjectId, 
	models = require('./models.js'),
	async = require('async'),
	_ = require('lodash'),
	mcapi = require('mailchimp-api');
	
var mc = new mcapi.Mailchimp('106c008a4dda3fa2fe00cae070e178b9-us9');

exports.scheduleCampaign = function () {
	mc.Campaigns.schedule();
};

// get all campaigns in original folder
// replicate each campaign 
// schedule each campaign (except payment reminder)


// new function at payment reminder day.
// find original payment reminder campaign
// replicate it
// segment it by users who have unpaid invoices with title[0] = "S"
// schedule the campaign for today.

// when a new user signs up add him to the Member list
// if he is a producer, add him to the producer list

// find list ids
// add all current members to the member list
// add all current producers to the producer list

// list for members is id: e481a3338d
// segment for producers is id: 20453
// segment for late payers is id: 20457

// originals folder is id: 7865

// In case I need to ever update all the users in mail chimp
function updateUsers() { 
	models.User.find({}, function(e, users) {
		var batch = [], user;
		_.forEach(users, function(user) {
			batch.push({
				email: {email: user.email},
				merge_vars: {
					FNAME : user.firstName, 
					LNAME : user.lastName,
					USER_TYPE : user.user_type.name,
					ADDRESS : user.address,
					PHONE : user.phone
				}
			});
		});
	
		// 
		mc.lists.batchSubscribe({id: 'e481a3338d', update_existing: true, batch: batch}, function(result) {
			console.log(result);
		});
	});
}

function segmentsList () {
	mc.lists.segments({id: 'e481a3338d'}, function(result) {console.log(result);});
}

exports.mailSchedule = function() {

	async.waterfall([
		// find originals
		function(done) { 
			mc.campaigns.list({ filters: { folder_id: '7865'} }, function(originals) {
				console.log("successfully imported campaigns list.");
				var dateTitleMap = {};
				for (var i = 0; i < originals.data.length; i++) {
					dateTitleMap[originals.data[i].title] = titleDateMatcher(originals.data[i].title);
				}
				console.log(dateTitleMap);
				
		
				done(null, originals, dateTitleMap);
			}, 
			function(error) {
				done(error);
			});
		}, //replicate originals
		function (originals, dateTitleMap, done) {
			var batch = [], batch2 = [];
			
			// I could take this out of the waterfall as it may be benificial to call it
			// from the scheduler
			
			// find which users have not paid shopping invoices
			models.Invoice.find({status: 'un-paid', title: /(Shopping Order for )\w+/g}, function(e, invoices) {
				if (e) console.log(e);
				if (invoices.length > 0) {
					// if we find unpaid invoices populate the email field
					models.Invoice.populate(invoices, {path:'invoicee', select: 'email -_id'}, function(e, invoices) {
						// for each unpaid invoice, mark the user with the OVERDUE value as 'yes'
						for (var i = 0; i < invoices.length; i++) {
							batch.push({
								email: {email: invoices[i].invoicee.email}, 
								merge_vars: {OVERDUE: 'yes'} 
							});
						}
						// update the members list with the overdue variable
						mc.lists.batchSubscribe({id: 'e481a3338d', update_existing: true, batch: batch});
						
						// to add members to the overdue segment, we remove the merge_vars property
						for (i = 0; i < batch.length; i++) {
							batch2.push(batch[i].email);
						}
						mc.lists.staticSegmentMembersAdd({id:'e481a3338d', seg_id: 20457, batch: batch2});
					});
				}
				done(e, originals, dateTitleMap);
			});
		},
		function(originals, dateTitleMap, done) {
			var date;
		// currently untested feature. Expect work or reworking to be needed
			(function repeat(i) {
				if (i < originals.data.length) {
					
					date = dateTitleMap[originals.data[i].title];
					console.log(date);
				
					mc.campaigns.replicate({cid: originals.data[i].id},
					function(replica) {
						schedule(replica.id, date, function(result) {
							console.log(result);
							repeat(i + 1);
						},
						function(error) {
							console.log(error);
						});
					}, 
					function(error) { 
						done(error); 
					});
				}
				else done(null);
			}(0));
		}], 
		function(e) {
			if (e) console.log(e);
		}
	);
	
};

function schedule (id, date, callback, errorHandle) {	
	mc.campaigns.schedule({cid: id, schedule_time: date }, callback, errorHandle);
}

function titleDateMatcher(title) {
	var date;
	switch (title) {
	case 'Product Uploading Starts':
		date = config.cycle.ProductUploadStart;
		break;
	case 'Reminder: Upload Products':
		date = config.cycle.ProductUploadStop;
		break;
	case 'Ordering Now Open':
		date = config.cycle.ShoppingStart;
		break;
	case 'Reminder: Ordering Closes Soon':
		date = config.cycle.ShoppingStop.addDays(-2);
		break;
	case 'Sorting and driving Volunteers needed':
		date = config.cycle.volunteerRecruitment;
		break;
	case 'Payment Reminder':
		date = config.cycle.PaymentDueDay;
		break;
	case 'Delivery Day Reminder':
		date = config.cycle.DeliveryDay;
		break;
	default:
		return null;
	}
	return date.toString('yyyy-MM-dd HH:mm:ss');
}


