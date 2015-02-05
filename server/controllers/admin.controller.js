'use strict';

var models = require('../models');


function createAccount(user){
  // Create a new account
  // User is updated automatically
  console.log('Creating source.');
  var account = new models.Account({
    owner   : user._id,
    name    : user.drupal_name,
    slug    : user.drupal_name,
    primary : true,
    drupal_uuid : user.drupal_uuid
  });
  account.save(function(err){
    if (err){ console.log('err', err); }
    console.log('Account created ', account._id);
  });
}

exports.userAccounts = function(req,res){
  console.log('check accounts');
  models.User.find({})
    .populate('accounts', '_id, primary')
    .exec(function(err,users){
      // Check for primary publication account
      for (var i=0; i<users.length; i++) {
        // check if one of the accounts is primary
        var primary = false;
        if (users[ i].accounts.length>0){
          for (var k=0; k<users[ i].accounts.length; k++){
            if (users[ i].accounts[ k].primary === true) {
              primary = true;
            }
          }
        }
        if (primary === false){
          console.log('No primary source for: ' + users[ i]._id);
          createAccount(users[ i]);
        }
      }
      res.json('done');
  });
}




function handleError(res, err) {
  return res.send(500, err);
}
