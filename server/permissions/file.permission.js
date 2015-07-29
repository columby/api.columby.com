'use strict';

var models = require('../models/index');


function validateAccountAccess(user, account_id, cb) {
  console.log('validating account id ' + account_id);
  console.log(user.primary.id);
  if (user.primary.id === account_id) {
    return cb(true);
  }
  // Iterate over user's accounts
  for (var i=0; i<user.organisations.length; i++){
    // Check if account is same as requested account
    console.log(user.organisations.id);
    if (parseInt(user.organisations[ i].id) === parseInt(account_id)) {
      // Check if account has the right role to edit.
      var role = user.organisations[ i].role;
      // User account with role owner or admin can edit an account. (not editor or viewer)
      if ( (role === 1) || (role === 2) ) {
        return cb(true);
      }
    }
  }
  return cb(false);
}


/**
 * Check if a user can update a file reference
 *
 */
exports.canUpdate = function(req, res, next) {

  // Check parameters
  if (!req.jwt) { return res.json({status: 'error', msg: 'No jwt found.'}); }
  if (!req.user) { return res.json({status: 'error', msg: 'No user found.'}); }
  if (!req.params.id) { return res.json({status:'error', msg: 'Required parameter file id missing.'}); }
  // Admin is allowed
  if (req.user.admin) { return next(); }
  // Check if user can edit requested account id.
  models.File.findById(req.params.id).then(function(file){
    req.file = file;
    if (!file) { res.json({status: 'error', msg: 'File not found'}); }
    validateAccountAccess(req.user, file.dataValues.account_id, function(result){
      if (!result) { return res.json({status:'error', msg: 'No access.'}); }

      return next();
    });
  });
};

/**
 * Check if a user can delete a file reference
 *
 */
exports.canDelete = function(req, res, next) {

  // Check parameters
  if (!req.jwt) { return res.json({status: 'error', msg: 'No jwt found.'}); }
  if (!req.user) { return res.json({status: 'error', msg: 'No user found.'}); }
  if (!req.params.id) { return res.json({status:'error', msg: 'Required parameter file id missing.'});}
  // Admin is allowed
  if (req.user.admin) { return next(); }
  // Check if user can edit requested account id.
  models.File.findById(req.params.id).then(function(file){
    req.file = file;
    if (!file) { return res.json({status: 'error', msg: 'File not found'}); }
    validateAccountAccess(req.user, file.dataValues.account_id, function(result){
      if (!result) { return res.json({status:'error', msg: 'No access.'}); }
      return next();
    });
  });
};


/**
 * Check if a user can upload a file to an account
 *
 */
exports.canUpload = function(req, res, next) {

  // Check parameters
  if (!req.jwt) { return res.json({status: 'error', msg: 'No jwt found.'}); }
  if (!req.user) { return res.json({status: 'error', msg: 'No user found.'}); }
  if (!req.query.account_id) { return res.json({status:'error', msg: 'Required parameter account_id missing.'}); }
  // Admin is allowed
  if (req.user.admin) { return next(); }
  // Check if user can edit requested account id.
  validateAccountAccess(user, req.query.account_id, function(result){
    if (!result) { return res.json({status:'error', msg: 'No access.'}); }

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
  });
};
