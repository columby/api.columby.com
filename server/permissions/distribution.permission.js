'use strict';

var models = require('../models/index'),
    Distribution = models.Distribution,
    User = models.User;


/***
 *
 * Check to see if a user can view a specific distribution
 *
 ***/
exports.canView = function(req,res,next){

}


/***
 *
 * Check to see if a user can view a specific distribution
 *
 ***/
exports.canCreate = function(req,res,next){
  console.log('Checking canCreate for user id ' + req.jwt.sub);
  // Make sure a token exists (handled by auth.controller)
  if (!req.jwt.sub) {
    return res.status(401).json({status: 'Error', msg: 'Not authorized'});
  }

  // Fetch the user based on the token-user_id
  models.User.find({
    where: { id: req.jwt.sub},
    include: [
      { model: models.Account, as: 'account' }
    ]
  }).then(function(user){
    if (!user) { return res.status(401).json({status: 'Error', msg: 'No user found. '}); }
    console.log(req.body);
    console.log('User ' + req.jwt.sub + ' would like to add a distribution to account ' + req.body.account_id + ' for dataset ' + req.body.dataset_id);
    if (user.account.indexOf(req.body.account_id !== -1)){
      console.log('The user can create a new distribution for this account! ');
      next();
    } else {
      console.log('No access! ', user.Accounts);
      return res.status(401).json({status: 'Error', msg: 'No access'});
    }
  })
  .catch(function(err){
    console.log(err);
    return res.status(401).json({status: 'Error', msg: err});
  });
}



/***
 *
 * Check to see if a user can view a specific distribution
 *
 ***/
exports.canEdit = function(req,res,next){
  console.log('Checking canEdit for distribution ' + req.params.id + ' for user id ' + req.jwt.sub);
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
      if (!user) { return res.status(401).json({status: 'Error', msg: 'No user found. '}); }
      models.Distribution.find({
        where:{ id:req.params.id },
        include: [{ model: models.Dataset, as: 'dataset' }]
      }).then(function(result){
        if (!result.dataset.dataValues.account_id) {
          return res.status(401).json({status: 'Error', msg: 'Account id not found for dataset. '});
        }
        if (user.account.indexOf(result.dataset.dataValues.account_id !== -1)){
          console.log('The user can edit this distribution! ');
          req.distribution = result.dataValues;
          next();
        } else {
          console.log('No access! ', user.Accounts);
          return res.status(401).json({status: 'Error', msg: 'No access'});
        }
      })
      .catch(function(err){
        console.log(err);
        return res.status(401).json({status: 'Error', msg: err});
      });
    }).catch(function(err){
      console.log(err);
      return res.status(401).json({status: 'Error', msg: err});
  });
}



/***
 *
 * Check to see if a user can view a specific distribution
 *
 ***/
exports.canDelete = function(req,res,next){
  console.log('Checking canDelete for distribution ' + req.params.id + ' for user id ' + req.jwt.sub);
  if (!req.jwt.sub) {
    return res.status(401).json({status: 'Error', msg: 'Not authorized'});
  }
  models.User.find({
    where: { id: req.jwt.sub},
    include: [
      { model: models.Account, as: 'account' }
    ]
  })
    .then(function(user){
      if (!user) { return res.status(401).json({status: 'Error', msg: 'No user found. '}); }
      // get account for dataset for Distribution
      models.Distribution.find({
        where:{
          id:req.params.id
        },
        include: [{ model: models.Dataset, as: 'dataset' }]

      })
        .then(function(result){
          if (!result.dataset.dataValues.account_id) {
            return res.status(401).json({status: 'Error', msg: 'Account id not found for dataset. '});
          }
          if (user.account.indexOf(result.dataset.dataValues.account_id !== -1)){
            console.log('The user can delete this distribution! ');
            req.distribution = result.dataValues;
            next();
          } else {
            console.log('No access! ', user.Accounts);
            return res.status(401).json({status: 'Error', msg: 'No access'});
          }
        })
        .catch(function(err){
          console.log(err);
          return res.status(401).json({status: 'Error', msg: err});
        })

    })
    .catch(function(err){
      console.log(err);
      return res.status(401).json({status: 'Error', msg: err});
    });
}
