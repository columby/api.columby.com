'use strict';

/**
 *
 * Dependencies
 *
 */
var _ = require('lodash'),
  Sequelize = require('sequelize'),
  models = require('../models/index');


/**
 *
 * Get list of Tags
 *
 */
exports.index = function(req, res) {
  console.log('index tags', req.query);
  models.Tag.findAll().success(function(models) {
    return res.json(models);
  }).error(function(err){
    return handleError(res, err);
  });
};

/**
 *
 * Get a single tag
 *
 * @param req
 * @param res
 *
 */
exports.show = function(req, res) {
  models.Tag.find({title: req.params.title}).success(function(model){
    res.json(model);
  }).error(function(err){
    return handleError(res,err);
  });
};


/**
 *
 * Create a new Tag
 *
 * @param req
 * @param res
 */
exports.create = function(req,res){
  console.log('Creating tag, ', req.body);
  models.Tag.find({where:{text:req.body.text}}).success(function(model) {
    if (model && model.id){
      console.log('existing term', model.dataValues);
      return res.json(model);
    } else {
      models.Tag.create({text: req.body.text}).success(function(model) {
        console.log('new term', model.id);
        return res.json(model);
      }).error(function(err){
        return handleError(res,err);
      });
    }
  }).error(function(err){
    return handleError(res,err);
  });
};





function handleError(res, err) {
  console.log('Vocabulary controller error: ',err);
  return res.send(500, err);
}