'use strict';

/**
 *
 * Dependencies
 *
 */
var models = require('../models/index'),
  pg = require('pg'),
  config = require('../config/config');


/*-------------- PRIMARY DISTRIBUTION --------------------------------------------------------*/
/**
 *
 **/
 exports.index = function(req,res){};


/**
 *
 **/
exports.show = function(req,res){};


/**
 *
 * Create a new Primary source
 *
 * @param req
 * @param res
 */
exports.create = function(req,res){
  var primary = req.body;

  models.Primary.create(primary).then(function(primary) {
    console.log('p', primary.dataValues);
    res.json(primary.dataValues);
  }).catch(function(err){
    return handleError(res,err);
  });
};


/**
 *
 **/
exports.update = function(req,res){

  models.Primary.find(req.params.id).then(function(primary){
    primary.updateAttributes(req.body).then(function(primary){
      return res.json(primary);
    }).catch(function(err){
      return handleError(res,err);
    });
  }).catch(function(err){
    return handleError(res,err);
  });
};


/**
 *
 **/
exports.destroy = function(req,res){

  models.Primary.find({
    where: { id: req.params.id },
    include: [
      { model: models.Distribution, as: 'distribution', include: [
        { model: models.Dataset, as: 'dataset' }
      ] }
    ]}).then(function(primary){

      // Delete the table
      var conn = config.db.postgis;
      pg.connect(conn, function(err,client,done){
        if (err){
          console.log('error connectiing: ', err);
        }
        var sql='DROP TABLE IF EXISTS primary_' +  primary.id + ';';
        console.log('sql', sql);
        client.query(sql, function(err,result){
          if (err){
            console.log(err);
          }
          done();
        });
      });
      primary.destroy().then(function(){
        return res.json({status:'success'});
      }).catch(function(err){
        return handleError(res,err);
      });

    }).catch(function(err){
      return handleError(res,err);
    });
};


/**
 *
 * (re)sync an existing primary source.
 *
 */
exports.sync = function(req,res) {

  models.Primary.find({
    where: {id: req.params.id},
    include: [{
      model: models.Distribution, as: 'distribution', include: [
        { model: models.Dataset, as: 'dataset' }
      ]}
    ]}).then(function (primary) {
      // Create a new job
      var j = {
        type: req.body.jobType,
        dataset_id: req.body.datasetId
      };

      models.Job.create(j).then(function(job){
        console.log('Job ' + job.id + ' created. Updating Primary source. ');
        // update primary source status
        models.Primary.update({
          jobStatus: 'active'
        },{
          where: {
            id: req.body.primaryId
          }
        }).then(function(updatedPrimary){
          console.log('updated primary ', updatedPrimary);
          res.json({result: updatedPrimary});
        }).catch(function(err){
          return handleError(res,err);
        });
      }).catch(function(err){
        return handleError(res,err);
      });
    });
};



function handleError(res, err) {
  console.log('Primary error,', err);
  return res.status(500).json({status:'error',msg:err });
}
