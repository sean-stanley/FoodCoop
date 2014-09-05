var config = require('./coopConfig.js'),
	mongoose = require('mongoose'),
	ObjectId = require('mongoose').Types.ObjectId, 
	models = require('./models.js'),
	async = require('async'),
	_ = require('lodash'),
	mcapi = require('mailchimp-api');
	
var mc = new mcapi.Mailchimp('106c008a4dda3fa2fe00cae070e178b9-us9');

exports.scheduleCampaign = function () {
	mc.Campaigns.schedule()
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
	})
}

function segmentsList () {
	mc.lists.segments({id: 'e481a3338d'}, function(result) {console.log(result);});
}

exports.mailSchedule = function() {

	async.waterfall([
		// find originals
		function(done) { mc.campaigns.list({ filters: { folder_id: '7865'} }, function(originals) {
			dateTitleMap = _.map(originals.data, function(doc) {
				var el = {title: doc.title, scheduleTime: ''}
				el.scheduleTime = titleDateMatcher(doc.title);
				return el
			});
		
			done(null, originals, dateTitleMap);
			}, function(error) {done(error)})
		}, //replicate originals
		function (originals, dateTitleMap, done) {
			var key, dateTitle, batch = [];
			if (originals.hasOwnProperty('total')) {
				for (key in originals.data) {
					if (originals.data.hasOwnProperty(key)) {
						if (originals.data[key].title === 'Payment Reminder') {
							// find which users have not paid shopping invoices
							models.Invoice.find({status: 'un-paid', title: /(Shopping Order for )\w+/g}, function(e, invoices) {
								if (e) console.log(e);
								if (invoices.length > 0) {
									models.Invoice.populate(invoices, {path:'invoicee', select: 'email -_id'}, function(e, invoices) {
										for (var i = 0; i < invoices.length; i++) {
											batch.push({
												email: {email: invoices[i].invoicee.email}, 
												merge_vars: {OVERDUE: 'yes'} 
											});
										}
										console.log(invoices);
								
										mc.lists.batchSubscribe({id: 'e481a3338d', update_existing: true, batch: batch}, function(result) {
											console.log(result);
										});
								
										batch2 = _.map(batch, function(user) {delete user.merge_vars; return user;});
										console.log(batch2);
								
										mc.lists.staticSegmentMembersAdd({id:'e481a3338d', seg_id: 20457, batch: batch2}, function(result) {
											console.log(result);
										});
									});
								}
								
							})
						}
						dateTitle = _.find(dateTitleMap, function(pair) {
							return pair.title === originals.data[key].title ? pair.scheduleTime : false
						});
						
						mc.campaigns.replicate({cid: originals.data[key].id}
							, function(result) {
								console.log('replicated'); 
								schedule(result, dateTitle.scheduleTime);
							}, 
							function(error) { done(error) }
						);
						
					}
				}
				done(null);
			};
			done(null);
		}], 
		function(e) {
			if (e) console.log(e);
		}
	);
	
};

function schedule (campaign, date) {	
	mc.campaigns.schedule({cid: campaign.id, schedule_time: date }
	, function(result) {
		console.log(result) // expect { confirmed: true }
	}, function(error) {console.log(error)});
}

function titleDateMatcher(title) {
	var date;
	switch (title) {
	case 'Product Uploading Starts':
		date = config.cycle.ProductUploadStart;
		break;
	case 'Reminder: Upload Products':
		date = config.cycle.ProductUploadStop;
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
		null
	}
	return date.toString('yyyy-MM-dd HH:mm:ss');
}


