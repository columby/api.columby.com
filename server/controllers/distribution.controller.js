'use strict';

/**
 * Dependencies
 *
 */
var _ = require('lodash'),
  models = require('../models/index'),
  Sequelize = require('sequelize'),
  request = require('request')
  ;


exports.index = function(req,res) {
  console.log(req.params);
  var id = req.params.id;
  console.log(id);
};

exports.show = function(req,res){
  console.log(req.params);
};


/**
 *
 * Create a new distribution
 *
 * required: dataset_id;
 *
 * @param req
 * @param res
 */
exports.create = function(req,res) {
  //console.log(req.body);
  models.Distribution.create(req.body).success(function(distribution){
    //console.log(distribution);
    res.json(distribution);
  }).error(function(err){
    return handleError(res,err);
  });
};


/**
 *
 * Update a distribution
 *
 * @param req
 * @param res
 */
exports.update = function(req,res) {
  console.log(req.body);
  models.Distribution.find(req.body.id).success(function(distribution){
    distribution.updateAttributes(req.body).success(function(distribution){
      res.json(distribution);
    })
  }).error(function(err){
    return handleError(res,err);
  })
};


/**
 *
 * Delete a distribution
 *
 * @param req
 * @param res
 */
exports.destroy = function(req,res) {
  console.log(req.params);
  models.Distribution.find(req.params.id).success(function(distribution){
    if (!distribution) return res.json({ status:'error', err: 'Failed to load distribution' });
    distribution.destroy().success(function(){
      res.json({status:'success'});
    }).error(function(err){
      handleError(res,err);
    });
  });
};


/**
 *
 * Validate if a supplied link is valid for processing by columby
 *
 * @param req
 * @param res
 */
exports.validateLink = function(req,res){

  // Validate if it is a readable URL
  var url = req.body.url;

  // get link properties
  if (!url) {
    return res.json({status:'error', message: 'No url provided'});
  }

  request({
    uri: url,
    method: 'GET',
    timeout: '1500',
    followRedirect: true,
    maxRedirects: 10
  },function(err, response, body){
    if (err || response.statusCode !== 200) {
      console.log('url not found.');
      return res.json({ valid: false, msg: 'Non readable url' });
    }

    // Validate for arcgis
    validateArcgis(url, function(result){
      console.log('result, ', result);
      if (result){
        return res.json({valid: true, type: 'arcgis'})
      } else {
        validateFortes(url, function(result){
          if (result) {
            return res.json({valid:true, type:'fortes'})
          } else {
            // No readable datasource
            return res.json({valid:false});
          }
        });
      }
    });
  });
};



/**
 *
 * Validate if a source is a readable arcgis service.
 *
 * @param url
 * @param cb
 */
function validateArcgis(url,cb){
  request({
    uri:url,
    method: 'GET',
    timeout: 2500,
    followRedirect: true,
    maxRedirects: 10,
    qs: {
      pretty:true,
      f:'json'
    }
  }, function(err,response,body){
    if (response && response.statusCode===200){
      var o = body;
      try {
        o = JSON.parse(body);
      } catch(err){
        console.log('err',err);
      }

      if (o && typeof(o) === 'object' && o !== null) {
        if (o.currentVersion && o.capabilities) {
          console.log('valid arcgis');
          if (String(o.currentVersion) === '10.04') {
            return cb(true);
          }
        }
      }
    }
    cb(false);
  });
}


/**
 *
 * Validate if a source is a readable Fortes service.
 *
 * @param url
 * @param cb
 */
function validateFortes(url,cb){
  if (url==="http://ictdashboarddenhaag.fortes.nl/opendata/") {
    cb(true);
  } else {
    cb(true);
  }
}



function handleError(res, err) {
  console.log('Dataset error,', err);
  return res.send(500, err);
}
