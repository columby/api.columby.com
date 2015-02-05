'use strict';

/**
 *
 * Dependencies
 *
 */
var models = require('../models/index'),
  pg = require('pg'),
  config = require('../config/environment');



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
  var primary = req.body;

  // check if user has permission to create a primary for this dataset.
  models.User.find(req.jwt.sub).then(function(user){

    user.getAccounts().then(function(accounts){
      var accountIds = [];
      for (var i=0;i<accounts.length;i++){
        accountIds.push(accounts[ i].dataValues.id);
      }
      models.Distribution.find({
        where: { id: req.body.distribution_id },
        include: [
          { model: models.Dataset, as: 'dataset' }
      ]}).then(function(distribution){
        console.log(user.dataValues);
        if (user.dataValues.admin || accountIds.indexOf(distribution.dataset.dataValues.account_id) !== -1) {
          models.Primary.create(primary).then(function(primary) {
            console.log('p', primary.dataValues);
            res.json(primary.dataValues);
          }).catch(function(err){
            return handleError(res,err);
          });
        } else {
          return res.json({status:'error',message:'Not authorized'});
        }
      }).catch(function(err){
        return handleError(res,err);
      });
    }).catch(function(err){
      return handleError(res,err);
    })
  }).catch(function(err) {
    return handleError(res,err);
  });
};


exports.update = function(req,res){
  // Check if user has access
  models.User.find(req.jwt.sub).then(function(user){
    user.getAccounts().then(function(accounts){
      var accountIds = [];
      for (var i=0;i<accounts.length;i++){
        accountIds.push(accounts[ i].dataValues.id);
      }
      models.Distribution.find({
        where: { id: req.body.distribution_id },
        include: [
          { model: models.Dataset, as: 'dataset' }
        ]}).then(function(distribution){
        console.log(user.dataValues);
        if (user.dataValues.admin || accountIds.indexOf(distribution.dataset.dataValues.account_id) !== -1) {
          // User can access
          models.Primary.find(req.params.id).then(function(primary){
            primary.updateAttributes(req.body).then(function(primary){
              res.json(primary);
            }).catch(function(err){
              return handleError(res,err);
            });
          }).catch(function(err){
            return handleError(res,err);
          });

        } else {
        return res.json({status:'error',message:'Not authorized'});
      }
    }).catch(function(err){
      return handleError(res,err);
    });
  }).catch(function(err){
    return handleError(res,err);
  })
}).catch(function(err) {
  return handleError(res,err);
});
};


exports.destroy = function(req,res){
  // check if user can edit Primary (dataset);
  models.User.find(req.jwt.sub).then(function(user) {

    user.getAccounts().then(function(accounts){
      var accountIds = [];
      for (var i=0;i<accounts.length;i++){
        accountIds.push(accounts[ i].dataValues.id);
      }
      models.Primary.find({
        where: { id: req.params.id },
        include: [
          { model: models.Distribution, as: 'distribution', include: [
            { model: models.Dataset, as: 'dataset' }
          ] }
        ]}).then(function(primary){
        console.log(primary.distribution.dataset.dataValues.account_id);
        var accountId = primary.distribution.dataset.dataValues.account_id;

        if (user.dataValues.admin || accountIds.indexOf(accountId) !== -1) {
          console.log('user can delete');

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

        } else {
          return res.json({status:'error', message:'Not authorized'});
        }
      }).catch(function(err){
        return handleError(res,err);
      });
    }).catch(function(err){
      return handleError(res,err);
    })
  });
};


/**
 *
 * (re)sync an existing primary source.
 *
 */
exports.sync = function(req,res) {

  // check if user can edit Primary (dataset);
  models.User.find(req.jwt.sub).then(function(user) {
    user.getAccounts().then(function(accounts) {
      var accountIds = [];
      for (var i = 0; i < accounts.length; i++) {
        accountIds.push(accounts[i].dataValues.id);
      }
      models.Primary.find({
        where: {id: req.params.id},
        include: [
          {
            model: models.Distribution, as: 'distribution', include: [
            {model: models.Dataset, as: 'dataset'}
          ]
          }
        ]
      }).then(function (primary) {
        console.log(primary.distribution.dataset.dataValues.account_id);
        var accountId = primary.distribution.dataset.dataValues.account_id;

        if (user.dataValues.admin || accountIds.indexOf(accountId) !== -1) {
          console.log('user can sync');
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
        } else {
          return res.json({status:'error', message:'Not authorized'});
        }
      });
    });
  });
};



function handleError(res, err) {
  console.log('Dataset error,', err);
  return res.send(500, err);
}
