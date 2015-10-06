/* jshint -W079 */


var mongoose = require('mongoose')
   , geocoder = require('geocoder')
   , _ = require('lodash')
   , models = require('./../models.js');

var user1, user2;

describe('get recipient lists from models', function() {

  it('should be able to find unique emails from customers and producers with orders', function(done) {
    // test orders should already exist in the database for these operations.
    models.Order.find({}, 'supplier customer')
    .populate('supplier', 'name email')
    .populate('customer', 'name email')
    .exec(function(err, orders) {
      var customers, suppliers, recipients;
      expect(_.isArray(orders)).toBe(true);
      expect(orders[0].customer.name).toBeDefined();
      expect(orders[0].customer.email).toBeDefined();
      expect(orders[0].supplier.name).toBeDefined();
      expect(orders[0].supplier.email).toBeDefined();
      expect(orders[1].customer.name).toBeDefined();
      expect(orders[1].customer.email).toBeDefined();
      expect(orders[1].supplier.name).toBeDefined();
      expect(orders[1].supplier.email).toBeDefined();

      expect(orders[0].product).toBeUndefined();

      customers = _.pluck(orders, 'customer');
      suppliers = _.pluck(orders, 'supplier');
      recipients = _.merge(customers, suppliers);
      expect(recipients.length).toBe(2);

      done();


    });
  });
});
