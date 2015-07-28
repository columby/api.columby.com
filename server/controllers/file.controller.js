'use strict';

/**
 *
 *  Module dependencies
 *
 */
var models = require('../models/index'),
    crypto    = require('crypto'),
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
 *
 * Fetch a file from s3 and store it locally in a tmp folder.
 *
 */
function getImage(file, callback) {
  var localFile = fs.createWriteStream(config.root + '/server/tmp/' + file.id);

  localFile.on('open', function() {
    console.log('Fetching file: ', file.url);
    request(file.url).pipe(localFile).on('close', function(){
      console.log('localfile', localFile);
      callback(null, localFile);
    }).on('error', function(err){
      console.log('error', err);
      callback(err, null);
    });
  });
}

function uploadImage(file,callback){
  console.log('upload image file source', typeof(file.source));
  console.log(file.source);

  fs.readFile(file.source, function (err, data) {
    console.log('reading file');
    if (err) {
      console.log('err', err);
      //return err;
    }

    var key = 'styles/' + file.account_id + '/' + file.style.name + '/' + file.filename;
      console.log('s3 key: ' + key);
      var params = {
        Bucket: config.aws.bucket,
        Key: key,
        Body: data,
        ACL: 'public-read',
        ContentType: file.filetype
      };
      s3.putObject(params, function (err) {
        if (err){ callback(err,null); }
        console.log('Successfully uploaded file.');
        // Delete source file
        fs.unlink(file.source);
        callback(null, true);
      });
    });
}

/**
 *
 * Try to create a derivative image based on an external source.
 *
 */
function createDerivative(file, callback) {
  console.log('Creating a new derivative for: ', file);
  console.log('Getting image');
  // Get remote image and store it locally
  getImage(file, function (err, tmpFile) {
    if (err) {
      callback('Could not fetch image.', null);
    }

    if (!err && tmpFile) {
      console.log('image fetched at ' + tmpFile.path);

      // Create a writestream for the derived image
      var u = config.root + '/server/tmp/' + file.id + '_' + file.style.name;
      console.log('Creating writestream: ' + u);

      var writeStream = fs.createWriteStream(u);

      writeStream.on('open', function(){

        gm(config.root + '/server/tmp/' + file.id)
          .options({imageMagick: true})
          .resize(file.style.width)
          .stream(function (err, stdout, stderr) {
            stdout.pipe(writeStream).on('error', function (err) {
              console.log(err);
              callback(err, null);
            }).on('close', function () {
              // Delete the tmp source file
              fs.unlink(config.root + '/server/tmp/'+file.id);
              console.log('Local derivative created. ');
              file.source = u;
              uploadImage(file, callback);
            });
          });
      }).on('error', function(err){
        console.log('error', err);
        callback(err, null);
      });
    }
  });
}


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
 *       "title": "Dataset title"
 *    }
 */
exports.index = function(req, res) {
  console.log(req.query);
  var limit = req.query.limit || 20;
  var order = req.query.order || 'created_at DESC';

  var filter = {
    account_id: req.query.account_id,
    status: true
  }
  if (req.query.type) {
    filter.type = req.query.type
  }

  models.File.findAll({
    where: filter,
    limit: limit,
    order: order
  }).then(function(files){
    return res.json(files);
  }).catch(function(error){
    return handleError(res,error)
  });
};


// Get a single file
exports.show = function(req, res) {
  console.log('File requested with id: ', req.params.id);
  console.log('File requested with style: ', req.query.style);

  models.File.find(req.params.id).then(function (file) {
    if (!file || !file.id){
      return handleError(res, 'The requested image was not found.');
    }
    // TODO: make this work with https
    var s3Endpoint = config.aws.endpoint.replace('https://','http://');
    // Check for request params
    if (req.query.style){
      var style = req.query.style;
      var availableStyles = {
        xlarge : { width:1200 },
        large  : { width:800 },
        medium : { width:400 },
        small  : { width:200 },
        avatar : { width:80 }
      };

      if (!availableStyles[ req.query.style]){
        return handleError(res, 'Requested style was not found. ');
      }

      var width = availableStyles[ req.query.style].width;

      s3Endpoint += 'styles/' + file.account_id + '/' + style + '/' + file.filename;

    } else {
      s3Endpoint += 'accounts/' + file.account_id + '/images/' + file.filename;
    }
    console.log('Endpoint for file ' + file.id + ': ' + s3Endpoint);
    // Stream the file to the user
    var r = request(s3Endpoint);
    r.on('response', function (response) {
      console.log('responseCode: ', response.statusCode);
      if ( (req.query.style) && (response.statusCode === 403 || response.statusCode === 404) ){
        file = file.dataValues;
        file.style= {
          name: style,
          width: width
        };
        file.url = config.aws.endpoint.replace('https://','http://') + 'accounts/' + file.account_id + '/images/' + file.filename;
        console.log('Image style not found, creating a new derivative. ', file.url, file.style);
        createDerivative(file, function(err, derivative){
          if (err) { res.status(404).send(err); } else {
            var r2 = request(s3Endpoint);
            r2.on('response', function (response) {
              console.log('responseCode: ', response.statusCode);
              if (response.statusCode === 200) {
                r2.pipe(res);
              } else {

                handleError(res,response.statusCode);
              }
            });
            r2.on('error', function(err){
              handleError(res,err);
            })
          }
        });
      } else {
        r.pipe(res);
      }
    })
  });
};


/**
 *
 * Creates a new file in the DB.
 *
 */
exports.create = function(req, res) {
  if (!req.user) { return handleError(res, {err:'No user id'});  }

  var file = req.body;
  file.owner = req.user.id;

  models.File.create(file, function(err, file) {
    if(err) { return handleError(res, err); }
    return res.json(201, file);
  });
};


/**
 *
 * Updates an existing file in the DB.
 *
 */
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  models.File.findById(req.params.id, function (err, file) {
    if (err) { return handleError(res, err); }
    if(!file) { return res.send(404); }
    var updated = _.merge(file, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, file);
    });
  });
};


/**
 *
 * Deletes a file from the DB.
 *
 */
exports.destroy = function(req, res) {
  // Find the file
  models.File.find({where:{id:req.file.id}}).then(function(file){

    // File found, delete it from s3
    var params = {
      Bucket: config.aws.bucket,
      Key: req.file.key
    };

    s3.deleteObject(params, function(err) {
      if (err) { return handleError(res,err); }

      file.remove(function(){
        console.log('remove successful.');
        res.json({status: 'success'});
      });
    });

  }).catch(function(err){

    console.log(err);
  });
};


/***
 *
 * Sign a request
 *
 * Required params: size, type, name
 *
 ***/
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

    console.log('credentials', credentials);

    return res.json({file:file, credentials:credentials});

  }).catch(function (error) {
    console.log(error);
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
