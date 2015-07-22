var moment = require('moment'),
	Cycle = require('./../models/cycle'),
	async = require('async'),
	_ = require('lodash'),
	scheduler = require('./../scheduler');

	require('datejs');

exports.cycle = function(req, res, next, id) {
	Cycle.findById(id, function(err, cycle) {
		if (err) return next(err);
		if (!cycle) return next(new Error('Failed to load cycle: ' + id));
		req.cycle = cycle;
		next();
	});
};

exports.create = function(req, res) {
	Cycle.create(req.body, function(err, cycle) {
		if (err) {
			res.status(500).send('Could not create cycle for some reason');
		} else res.json(cycle);
	});
};

exports.update = function(req, res) {
	var cycle = _.merge(req.cycle, req.body);
	cycle.save(function(err) {
		if (err) return res.status(500).send('cannot update the cycle');
		res.json(cycle);
	});
};

exports.destroy = function(req, res) {
  var cycle = req.cycle;

  cycle.remove(function(err) {
    if (err) {
      return res.json(500, {
        error: 'Cannot delete the cycle'
      });
    }
    res.json(cycle);
  });
};

exports.show = function(req, res) {
  res.json(req.cycle);
};

exports.current = function(req, res) {
	res.json(scheduler.currentCycle);
};

exports.all = function(req, res) {
	Cycle.find().sort('_id').lean().exec(function(err, cycles) {
		if (err) return res.status(500).send(err);
		if (!cycles) return res.status(404).send('no cycles found');
		res.json(cycles);
	});
};

exports.future = function(req, res) {
	Cycle.find({deliveryDay: {$gt: new Date() } }).sort('shoppingStart').lean().exec(function(err, cycles) {
		if (err) return res.status(500).send(err);
		if (!cycles) return res.status(404).send('no future cycles found');
		res.json(cycles);
	});
};
