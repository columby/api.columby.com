'use strict';

var models = require('../models/index');


/**
 * Check if a user can upload a file to an account
 *
 */
exports.canUpload = function(req, res, next) {

  console.log(req.params);
  console.log(req.query);
  console.log('check jwt');

  if (!req.jwt) { return res.json({status: 'error', msg: 'No jwt found.'}); }
  if (!req.user) { return res.json({status: 'error', msg: 'No user found.'}); }
  if (!req.query.account_id) {
    return res.json({status:'error', msg: 'Required parameter account_id missting.'});
  }
  if (req.user.admin) { return next(); }


  // var images = [
  //   'image/png',
  //   'image/jpg',
  //   'image/jpeg'
  // ]
  //
  // // Validate file type
  // if (images.indexOf(fileType) === -1) {
  //   return res.json({status: 'error', msg: 'File type not supported. '});
  // }
  //
  // // Validate file size
  // if (fileSize > 1*1000*1000*10) {
  //   return res.json({status: 'error', msg: 'Max file size exceeded. '});
  // }

  // Check file type validity
  // var validFileType = false;
  // var validFileSize = false;
  // var maxSize = 0;
  // switch (req.query.type) {
  //   case 'image':
  //     var validTypes = ['image/png', 'image/jpg', 'image/jpeg'];
  //     if (validTypes.indexOf(file.filetype) !== -1) {
  //       validFileType = true;
  //     }
  //     maxSize = 10000000; //10 mb
  //     break;
  //   case 'datafile':
  //     validTypes = ['text/csv'];
  //     if (validTypes.indexOf(file.filetype) !== -1) {
  //       validFileType = true;
  //     }
  //     break;
  //   default:
  //     validFileType = true;
  //     break;
  // }
  //

  // if (!validFileType) {
  //   return res.json({status: 'error', err: 'File type ' + file.filetype + ' is not allowed. '});
  // }
  // // TODO: check account file size
  // if (!validFileSize) {
  //   //return res.json({status: 'error', err: 'File size ' + file.filesize + ' is too big. ' + maxSize + ' allowed. '});
  // }
  next();

};
