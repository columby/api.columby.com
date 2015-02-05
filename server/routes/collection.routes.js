'use strict';

var express = require('express'),
    controller = require('../controllers/collection.controller'),
    auth = require('../controllers/auth.controller'),
    models = require('../models/index'),
    router = express.Router();


function canEdit(req, res, next) {
  console.log('checking canedit', req.jwt);
  // user should be registered
  if (req.jwt.sub) {
    console.log('finding user');
    models.User.find({
      where: { id: req.jwt.sub},
      include: [
        { model: models.Account }
      ]
    }).success(function(user){
      console.log('user found');
      if (user){
      // can user edit the requested collection id
        if (user.Accounts.indexOf(req.params.id !== -1)){
          console.log('canedit!');
          next();
        }
      } else {
        return res.json('no accesss');
      }
    }).error(function(err){
      console.log('err',err);
      return res.json(err);
    });
  } else {
    res.status(401).json('Not authorized');
  }
}


module.exports = function(app){

  router.get('/', controller.index);

  router.get('/:id', controller.show);

  router.post('/',
    auth.ensureAuthenticated,
    canEdit,
    controller.create);

  router.put('/:id',
    auth.ensureAuthenticated,
    canEdit,
    controller.update);

  router.delete('/:id',
    auth.ensureAuthenticated,
    canEdit,
    controller.destroy);

  router.post('/:id/addDataset',
    auth.ensureAuthenticated,
    canEdit,
    controller.addDataset
  );
  router.post('/:id/removeDataset',
    auth.ensureAuthenticated,
    canEdit,
    controller.removeDataset
  );

  app.use('/v2/collection',router);
};
