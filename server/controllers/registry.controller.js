'use strict';

/**
 *
 * Dependencies
 *
 */
var models = require('../models/index');


/**
 *
 * Get list of Registries
 *
 */
exports.index = function(req, res) {
  console.log('index registries');
  models.Registry.findAll().then(function(registries) {
    return res.json(registries);
  }).catch(function(err){
    return handleError(res, err);
  });
};

/**
 *
 * Get a single registry item
 *
 **/
exports.show = function(req, res) {
  models.Registry.findById(req.params.id).then(function(registry){
    res.json(registry);
  }).catch(function(err){
    return handleError(res,err);
  });
};



function handleError(res, err) {
  console.log('Registry controller error: ',err);
  return res.send(500, err);
}
