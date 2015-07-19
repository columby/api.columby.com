'use strict';

var models = require('../models/index'),
    referencePerms = require('../permissions/reference.permission'),
    config = require('../config/config');


exports.index = function(req, res) {
  console.log(req.params);
  var id = req.params.id;
  console.log(id);
};


exports.get = function(req,res){
  console.log(req.params);
};


exports.create = function(req, res) {
  var reference = req.body;

  // Find the dataset to attach the reference to
  models.Dataset.findById(reference.dataset_id).then(function(dataset){
    if (!dataset){ return handleError(res, { error:'Failed to load dataset' }); }
    // Create a db-entry for the reference
    models.Reference.create(reference).then(function(reference){
      // Add the reference to the dataset
      dataset.addReference(reference).then(function(dataset){
        // Send back the reference
        return res.json(reference);
      }).catch(function(err){
        return handleError(res,err);
      });
    }).catch(function(err){
      return handleError(res,err);
    });
  }).catch(function(err){
    return handleError(res,err);
  });
};


exports.update = function(req, res) {
  models.Reference.update(
    req.body,
    {
      where: {
        id: req.body.id
      }
    }).then(function(status){
      return res.json(req.body);
    }).catch(function(err){
      handleError(res,err);
    });
};


exports.destroy = function(req, res) {

  models.Reference.findById(req.params.id).then(function(reference){
    if (!reference){ return res.json({status:'error', msg: 'No reference found'}); }

    reference.destroy().then(function(){
      return res.json({status:'success'});
    }).catch(function(err){
      return handleError(res,err);
    });
  }).catch(function(err){
    return handleError(res,err);
  });
};


function handleError(res, err) {
  console.log('Reference controller error,', err);
  return res.status(500).json({status:'error', msg:err});
}
