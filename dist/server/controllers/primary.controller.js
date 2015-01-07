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
  var dataset_id = req.body.datasetId;
  console.log('did', dataset_id);
  var distribution_id = req.body.distributionId;
  console.log('did2', distribution_id);
  var primary = req.body;
  delete primary.datasetId;
  delete primary.distributionId;
  models.Primary.create(req.body).success(function(primary) {
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
  console.log('Updating primary: ', req.params);
  models.Primary.find(req.params.id).success(function(primary){
    primary.updateAttributes(req.params.primary).success(function(primary){
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
