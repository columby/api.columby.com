'use strict';

var _ = require('lodash'),
    Collection = require('../models/index').Collection;

// Get list of collections
exports.index = function(req, res) {
  Collection
    .find({})
    .populate('datasets', 'title')
    .populate('account', 'name')
    .exec(function (err, collections) {
    if(err) { return handleError(res, err); }
    return res.json(200, collections);
  });
};

// Get a single collection
exports.show = function(req, res) {
  console.log(req.params.id);
  Collection
    .findOne({_id: req.params.id})
    .populate('datasets', 'title')
    .populate('account', 'name avatar slug')
    .exec(function (err, collection) {
      if(err) { return handleError(res, err); }
      if(!collection) { return res.send(404); }
      console.log('c', collection);
      return res.json(collection);
    }
  );
};


function handleError(res, err) {
  return res.send(500, err);
}
