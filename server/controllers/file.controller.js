'use strict';

/**
 *
 *  Module dependencies
 *
 */
var _ = require('lodash'),
    models = require('../models/index'),
    crypto    = require('crypto'),
    config = require('../config/config'),
    AWS = require('aws-sdk'),
    fs = require('fs'),
    gm = require('gm').subClass({ imageMagick: true }),
    request = require('request');


var s3 = new AWS.S3();


/** ------ FUNCTIONS ------------------------------------------------------- **/

function getExpiryTime() {
  var _date = new Date();
  return '' + (_date.getFullYear()) + '-' + (_date.getMonth() + 1) + '-' +
    (_date.getDate() + 1) + 'T' + (_date.getHours() + 3) + ':' + '00:00.000Z';
}

function createS3Policy(file) {
  console.log('Creating policy file. ', file);

  if (!file.account_id){
    console.log('No account id found. ');
    return null;
  }

  var fileKey;
  if (file.type === 'datafile'){
    fileKey = 'accounts/' + file.account_id + '/datafiles/' + file.filename;
  } else if (file.type === 'image') {
    fileKey = 'accounts/' + file.account_id + '/images/' + file.filename;
  } else {
    fileKey = 'accounts/' + file.account_id + '/files/' + file.filename;
  }

  var s3Policy = {
    'expiration': getExpiryTime(),
    'conditions': [
      ['eq', '$key', fileKey ],
      {'bucket': config.aws.bucket},
      {'acl': 'public-read'},
      ['starts-with', '$Content-Type', file.filetype],
      {'success_action_status' : '201'},
      ['content-length-range', 0, file.size]
    ]
  };
  console.log('policy', s3Policy);
  // stringify and encode the policy
  var stringPolicy = JSON.stringify(s3Policy);
  var base64Policy = new Buffer(stringPolicy, 'utf-8').toString('base64');

  // sign the base64 encoded policy
  var signature = crypto.createHmac('sha1', config.aws.secretKey)
                      .update(new Buffer(base64Policy, 'utf-8')).digest('base64');

  // build the results object
  return {
    policy: base64Policy,
    signature: signature,
    s3Key: config.aws.publicKey,
    bucket: config.aws.bucket,
    file: {
      key: fileKey,
      acl: 'public-read',
      filetype: file.filetype
    }
  };
}

/**
 *
 * Fetch a file from s3 and store it locally in a tmp folder.
 *
 * @param uri
 * @param callback
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



/* ------ ROUTES ---------------------------------------------------------- */

// Get list of files
exports.index = function(req, res) {
  models.File
    .find()
    .sort('-createdAt')
    .populate('owner', 'username')
    .exec(function(err,files){
      if(err) { return handleError(res, err); }
      if(!files) { return res.send(404); }
      return res.json(files);
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

  // Signing a request involves 3 steps:
  //   1. Create a unique, slugified filename
  //   2. Create a File record in the database
  //   3. Create a policy for upload

  // Handle the supplied query parameters
  var file = {
    type: req.query.type,
    filetype: req.query.filetype,
    size: req.query.filesize,
    filename: req.query.filename,
    account_id: req.query.accountId
  };
  console.log('Processing file: ', file);

  // Check file type validity
  var validFileType = false;
  var validFileSize = false;
  var maxSize = 0;
  switch (req.query.type) {
    case 'image':
      var validTypes = ['image/png', 'image/jpg', 'image/jpeg'];
      if (validTypes.indexOf(file.filetype) !== -1) {
        validFileType = true;
      }
      maxSize = 10000000; //10 mb
      break;
    case 'datafile':
      validTypes = ['text/csv'];
      if (validTypes.indexOf(file.filetype) !== -1) {
        validFileType = true;
      }
      break;
    default:
      validFileType = true;
      break;
  }

  if (!validFileType) {
    return res.json({status: 'error', err: 'File type ' + file.filetype + ' is not allowed. '});
  }
  // TODO: check account file size
  if (!validFileSize) {
    //return res.json({status: 'error', err: 'File size ' + file.filesize + ' is too big. ' + maxSize + ' allowed. '});
  }

  // Create a File record in the database
  models.File.create(file).then(function (file) {
    console.log('File created: ', file.dataValues);
    // Add the owner of the file (publication account)
    file.setAccount(req.query.accountId).then(function (owner) {
      console.log('owner, ', owner.dataValues);
      var credentials = createS3Policy(file.dataValues);
      console.log('credentials', credentials);
      if (!credentials) {
        return handleError(res, 'Error creating policy file.');
      } else {
        // Send back the policy
        return res.json({
          file: file,
          credentials: credentials
        });
      }
    }).catch(function (err) {
      // delete the file again
      return handleError(res, err);
    });
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
exports.handleS3Success = function(req,res) {
  models.File.find(req.body.fileId).then(function (file) {
    file.updateAttributes({
      status: true,
      url: req.body.url
    }).then(function(file){
      //console.log(file.dataValues);
      return res.json(file);
    }).catch(function(err){
      handleError(res,err);
    });
  }).catch(function (err) {
    handleError(res, err);
  });
};


function handleError(res, err) {
  console.log('Error: ', err);
  return res.send(500, err);
}
