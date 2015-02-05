'use strict';

/**
 * Dependencies
 *
 */
var config = require('../config/environment/index'),
    AWS = require('aws-sdk'),
    models = require('../models/index'),
    request = require('request'),
    fileController = require('./file.controller')
  ;

var s3 = new AWS.S3();

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
  models.Distribution.create(req.body).then(function(distribution){
    //console.log(distribution);
    res.json(distribution);
  }).catch(function(err){
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
  models.Distribution.find(req.body.id).then(function(distribution){
    distribution.updateAttributes(req.body).then(function(distribution){
      res.json(distribution);
    })
  }).catch(function(err){
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
  models.Distribution.find(req.params.id).then(function(distribution){
    if (!distribution) return res.json({ status:'error', err: 'Failed to load distribution' });

    // delete file if present
    if (distribution.file_id){

      // Find the file, delete it from s3 and db
      models.File.find({where:{id:distribution.file_id}}).then(function(file){
        if (!file) {
          console.log('File not found. ');
        } else {
          var key = file.url;
          key = key.replace('https://'+config.aws.bucket+'.s3.amazonaws.com/', '');
          // File found, delete it from s3
          var params = {
            Bucket: config.aws.bucket,
            Key: key
          };
          // delete from s3
          console.log('deleting ' + key);
          s3.deleteObject(params, function (err) {
            if (err) {
              console.log(err);
            } else {
              // delete db entry
              file.destroy().then(function() {
                console.log('remove .thenful.');
              }).catch(function(err){
                console.log('err', err);
              });
            }
          });
        }
      }).catch(function(err){
        console.log(err);
      });
    }

    distribution.destroy().then(function(){
      res.json({status:'.then'});
    }).catch(function(err){
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
  console.log('url',url);

  // get link properties
  if (!url) {
    return res.json({status:'error', message: 'No url provided'});
  }

  // Temp check for a specific api case
  if (url==="http://ictdashboarddenhaag.fortes.nl/opendata/") {
    return res.json({valid:true, type:'fortes'});
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
      if (result){
        return res.json({valid: true, type: 'arcgis'})
      } else {
        return res.json({ valid: false, msg: 'No valid url' });
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
        console.log('err parsing',err);
        return cb(false);
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
    return cb(false);
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
  console.log('check fortes: ', url);
  if (url==="http://ictdashboarddenhaag.fortes.nl/opendata/") {
    cb(true);
  } else {
    cb(false);
  }
}



function handleError(res, err) {
  console.log('Dataset error,', err);
  return res.send(500, err);
}
