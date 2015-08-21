'use strict';

var models = require('../models/index'),
    Collection = models.Collection,
    User = models.User;



/***
 *
 * Check to see if a user can view a specific collection
 *
 ***/
exports.canEdit = function(req,res,next){

  console.log('Checking canEdit for collection ' + req.params.id + ' for user id ' + req.jwt.sub);
  // user should be registered
  if (!req.jwt.sub) {
    return res.status(401).json({status: 'Error', msg: 'Not authorized'});
  }

  models.User.find({
    where: { id: req.jwt.sub},
    include: [
      { model: models.Account, as: 'account' }
    ]
  }).then(function(user){
    if (!user) {
      return res.status(401).json({status: 'Error', msg: 'No user found. '});
    }

    if (user.accounts.indexOf(req.params.id !== -1)){
      console.log('canedit!');
      next();
    } else {
      return res.status(401).json({status: 'Error', msg: 'No access'});
    }
  }).catch(function(err){
    console.log(err);
    return res.status(401).json({status: 'Error', msg: err});
  });
}
