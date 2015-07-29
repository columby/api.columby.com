'use strict';


var models = require('../models/index'),
    crypto = require('crypto'),
    config = require('../config/config'),
    moment = require('moment'),
    fs = require('fs'),
    knox = require('knox'),
    gm = require('gm').subClass({ imageMagick: true }),
    path = require('path');


var s3client = knox.createClient({
  key: config.aws.key,
  secret: config.aws.secret,
  bucket: config.aws.bucket
});


/**
 * @api {get} /file/ Request a list of files
 * @apiName Getfiles
 * @apiGroup File
 * @apiVersion 2.0.0
 *
 * @apiSuccess {Object} dataset object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "count": "120",
 *       "rows" : [{"filename":"file.png"}]
 *    }
 */
exports.index = function(req, res) {
  var limit = req.query.limit || 20;
  var order = req.query.order || 'created_at DESC';
  var offset = req.query.offset || 0;

  var filter = {
    account_id: req.query.account_id,
    status: true
  }

  if (req.query.type) { filter.type = req.query.type; }

  models.File.findAndCountAll({
    where: filter,
    limit: limit,
    order: order,
    offset: offset
  }).then(function(files){
    return res.json(files);
  }).catch(function(error){
    return handleError(res,error)
  });
};


/**
 * @api {get} /file/:id File details
 * @apiName Getfile
 * @apiGroup File
 * @apiVersion 2.0.0
 * @apiDescription Show the details of an image reference stored in the database
 *
 * @apiSuccess {Object} file object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "title": "File title"
 *    }
 */
exports.show = function(req, res) {
  models.File.findById(req.params.id).then(function(file) {
    return res.json(file);
  }).catch(function(err){
    return handleError(res,err);
  });
};


/**
 * @api {put} /file/:id Update file
 * @apiName UpdateFile
 * @apiGroup File
 * @apiVersion 2.0.0
 * @apiDescription Update file details stored in the database
 *
 * @apiSuccess {Object} update status.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "title": "File title"
 *    }
 */
exports.update = function(req, res) {
   // validate body

   // update model
   models.File.update(req.params.id, req.body).then(function(result) {
    return res.json(result);
  }).catch(function(err){
    return handleError(res,err);
  });
};


/**
 * @api {delete} /file/:id Delete file
 * @apiName DeleteFile
 * @apiGroup File
 * @apiVersion 2.0.0
 * @apiDescription Delete a file from storage and the database
 *
 * @apiSuccess {Boolean} Delete status.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       true
 *    }
 */
exports.delete = function(req, res) {

  var url = config.environment + '/files/' + req.file.type + '/' + req.file.filename;
  console.log('deleting file ' + url);

  s3client.deleteFile(url, function(err, s3res) {
    if (err) { return handleError(res,err); }
    req.file.destroy().then(function(result){
      console.log('remove successful.', result);
      return res.json({status: 'success'});
    }).catch(function(err){
      return handleError(res,err);
    });
  });
};


/**
 * @api {post} /sign Sign file
 * @apiName SignFile
 * @apiGroup File
 * @apiVersion 2.0.0
 * @apiDescription Receive a signed request to upload a file from the browser
 *
 * @apiSuccess {Object} Credentials object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "credentials" {},
 *       "file": {}
 *    }
 */
exports.sign = function(req,res) {
  var request = req.body;
  request.meta = request.meta || {};

  var uploadType = request.type;
  var fileName = request.filename;
  var fileSize = request.filesize;
  var fileType = request.filetype;
  var account_id = request.account_id;

  var path = '/files/' + uploadType + '/' + fileName;

  // Handle the supplied query parameters
  var file = {
    type: uploadType,
    path: path,
    filename: fileName,
    status: false,
    filetype: fileType,
    size: fileSize,
    account_id: account_id
  };

  // Create a File record in the database
  models.File.create(file).then(function(file) {
    //console.log('File created: ', file.dataValues);
    // update path with new filename
    path = '/files/' + uploadType + '/' + file.filename;

    var expiration = moment().add(15, 'm').toDate(); //15 minutes
    var readType = 'private';

    var s3Policy = {
      'expiration': expiration,
      'conditions': [{ 'bucket': config.aws.bucket },
      ['starts-with', '$key', config.environment + path],
      { 'acl': readType },
      { 'success_action_status': '201' },
      ['starts-with', '$Content-Type', request.filetype],
      ['content-length-range', 2048, request.filesize], //min and max
    ]};

    var stringPolicy = JSON.stringify(s3Policy);
    var base64Policy = new Buffer(stringPolicy, 'utf-8').toString('base64');

    // sign policy
    var signature = crypto.createHmac('sha1', config.aws.secret)
        .update(new Buffer(base64Policy, 'utf-8')).digest('base64');

    var credentials = {
      url: config.aws.endpoint,
      fields: {
        key: config.environment + path,
        AWSAccessKeyId: config.aws.key,
        acl: readType,
        policy: base64Policy,
        signature: signature,
        'Content-Type': request.filetype,
        success_action_status: 201
      }
    };
    return res.json({file:file, credentials:credentials});
  }).catch(function (error) {
    return handleError(res, error);
  });
};


/**
 *
 * Handle a successful upload
 * Update the status of a file from draft to published
 *
 */
exports.finishUpload = function(req,res) {
  models.File.update({
    status: true
  }, {
    where: {
      id: req.body.id
    }
  }).then(function(result) {
    return res.json(result);
  }).catch(function (err) {
    return handleError(res, err);
  });
};



function handleError(res, err) {
  console.log('Error: ', err);
  return res.json({status: 'error', msg: err});
}
