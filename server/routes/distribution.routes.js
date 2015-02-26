'use strict';

var express = require('express'),
  controller = require('../controllers/distribution.controller'),
  auth = require('../controllers/auth.controller'),
  models = require('../models/index'),
  router = express.Router();


// Validate if a user can create a distribution
function canCreate(req,res,next){
  console.log('Checking canCreate for user id ' + req.jwt.sub);
  if (!req.jwt.sub) {
    return res.status(401).json({status: 'Error', msg: 'Not authorized'});
  }
  models.User.find({
    where: { id: req.jwt.sub},
    include: [{ model: models.Account }]
  })
    .then(function(user){
      if (!user) { return res.status(401).json({status: 'Error', msg: 'No user found. '}); }
      console.log(req.body);
      console.log('User ' + req.jwt.sub + ' would like to add a distribution to account ' + req.body.account_id + ' for dataset ' + req.body.dataset_id);
      if (user.Accounts.indexOf(req.body.account_id !== -1)){
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

// Validate if a user can create a distribution
function canEdit(req, res, next) {
  console.log('Checking canEdit for distribution ' + req.params.id + 'for user id ' + req.jwt.sub);
  // user should be registered
  if (!req.jwt.sub) {
    return res.status(401).json({status: 'Error', msg: 'Not authorized'});
  }

  models.User.find({
    where: { id: req.jwt.sub},
    include: [{ model: models.Account }]
  }).then(function(user){
      if (!user) { return res.status(401).json({status: 'Error', msg: 'No user found. '}); }
      models.Distribution.find({
        where:{ id:req.params.id },
        include: [{ model: models.Dataset, as: 'dataset' }]
      }).then(function(result){
        if (!result.dataset.dataValues.account_id) {
          return res.status(401).json({status: 'Error', msg: 'Account id not found for dataset. '});
        }
        if (user.Accounts.indexOf(result.dataset.dataValues.account_id !== -1)){
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
      });
    }).catch(function(err){
      console.log(err);
      return res.status(401).json({status: 'Error', msg: err});
  });
}

// Validate if a user can delete a distribution
function canDelete(req,res,next){
  console.log('Checking canDelete for distribution ' + req.params.id + ' for user id ' + req.jwt.sub);
  if (!req.jwt.sub) {
    return res.status(401).json({status: 'Error', msg: 'Not authorized'});
  }
  models.User.find({
    where: { id: req.jwt.sub},
    include: [{ model: models.Account }]
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
          if (user.Accounts.indexOf(result.dataset.dataValues.account_id !== -1)){
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


module.exports = function(app){


  /**
   * Distribution Routes
   *
   **/
  router.get('/',
    controller.index);

  router.post('/',
    auth.ensureAuthenticated,
    canCreate,
    controller.create);

  router.post('/validate-link',
    auth.ensureAuthenticated,
    controller.validateLink);

  router.get('/:id',
    controller.show);

  router.put('/:id',
    auth.ensureAuthenticated,
    canEdit,
    controller.update);

  router.delete('/:id',
    auth.ensureAuthenticated,
    canDelete,
    controller.destroy);


  app.use('/v2/distribution',router);

};
