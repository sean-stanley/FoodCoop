// functions related to invoices live here


var total;
// designed to sum up invoices for email invoice templates.
exports.total = function total(invoice) {
	var i, total;
	if (invoice.hasOwnProperty('toObject')) {
		invoice.toObject();
	}
	for (i in invoice.items) {
		total += i.cost;
	}
	return total
}