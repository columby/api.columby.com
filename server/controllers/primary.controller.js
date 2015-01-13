'use strict';

/**
 *
 * Dependencies
 *
 */
var _ = require('lodash'),
  models = require('../models/index'),
  Sequelize = require('sequelize')
  ;


/*-------------- PRIMARY DISTRIBUTION --------------------------------------------------------*/
exports.index = function(req,res){};

exports.show = function(req,res){};

/**
 *
 * Create a new Primary source
 *
 * @param req
 * @param res
 */
exports.create = function(req,res){
  console.log('creating primary: ', req.body);
  var primary = req.body;

  models.Primary.create(primary).success(function(primary) {
    console.log('p', primary.dataValues);
    res.json(primary.dataValues);
    //primary.setDataset(dataset_id).success(function(primary){
    //  console.log('p2', primary.dataValues);
    //  primary.setDistribution(distribution_id).success(function(primary){
    //    console.log('p3', primary.dataValues);
    //    return res.json(primary);
    //  }).error(function(err){
    //    return handleError(res,err);
    //  });
    //}).error(function(err){
    //  return handleError(res,err);
    //});
  }).error(function(err){
    return handleError(res,err);
  });
};

exports.update = function(req,res){
  models.Primary.find(req.params.id).success(function(primary){
    primary.updateAttributes(req.body).success(function(primary){
      res.json(primary);
    }).error(function(err){
      return handleError(res,err);
    });
  }).error(function(err){
    return handleError(res,err);
  });
};

exports.destroy = function(req,res){
  var primaryId = req.params.id;
  models.Primary.find(primaryId).success(function(primary){
    primary.destroy().success(function(){
      return res.json({status:'success'});
    }).error(function(err){
      return handleError(res,err);
    });
  }).error(function(err){
    return handleError(res,err);
  });
};

function handleError(res, err) {
  console.log('Dataset error,', err);
  return res.send(500, err);
}
