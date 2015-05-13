'use strict';

var models = require('../models/index'),
    Distribution = models.Distribution,
    User = models.User;



 /**  PERMISSIONS **/
 function getUser(id, cb){
   models.User.find({
     where:{
       id: id
     },
     include: [
       { model: models.Account, as: 'account' }
     ]
   }).then(function(user){
     cb(user);
   }).catch(function(err){
     cb(err);
   })
 }

 /**
   incoming: primary object with dataset_id and distribution_id
   Check if current user has create permissions for the account connected to the dataset.
 **/
 exports.canCreate = function(req,res,next){
   console.log('checking can create');
   // Fetch the current user and associated accounts.
   getUser(req.jwt.sub, function(user){
     if (!user){
       return res.json({status:'err', msg:'User not found.'});
     }
     // An admin can edit everything
     if (user.admin) {
       console.log('User is admin, valid!');
       return next();
     }
     // get dataset's account
     models.Dataset.find({
       where:{ id: req.body.dataset_id },
       include: [ { model: models.Account, as: 'account' }]
     })
       .then(function(dataset){
         if (!dataset){
           return res.json({status:'err', msg:'Dataset not found.'});
         }
         var datasetId = dataset.account.dataValues.id;

         // Iterate over user's accounts
         for (var i=0; i<user.account.length; i++){
           // Check if account is same as requested publication account for the new dataset.
           if (user.account[ i].dataValues.id === datasetId) {
             console.log('Account found for user, checking role');
             // Check if account has the right role to edit.
             var role = user.account[ i].AccountsUsers.role;
             // User account with role owner, admin can edit an account. (Not editor or viewer)
             if (role === 1 || 2 || 3) {
               console.log('Valid role! ' + role);
               return next();
             }
           }
         }

       })
       .catch(function(err){
         return res.status(401).json({status: 'Error', msg: err});
     });
   });
 }

 exports.canEdit = function(req,res,next){

   // Fetch the current user and associated accounts.
   getUser(req.jwt.sub, function(user){
     req.user = user;

     if (!user){
       return res.json({status:'err', msg:'User not found.'});
     }

     // An admin can edit everything
     if (user.admin) {
       console.log('User is admin, valid!');
       return next();
     }

     // Get the dataset's publication Account
     models.Dataset.find({
       where: { id: req.body.dataset_id },
       include: [ { model: models.Account, as: 'account' }]}).then(function(dataset){
         if (!dataset){
           return res.json({status:'err', msg:'Dataset not found.'});
         }
         var datasetId = dataset.account.dataValues.id;
         // Iterate over user's accounts
         for (var i=0; i<user.account.length; i++){
           // Check if account is same as requested publication account for the new dataset.
           if (user.account[ i].dataValues.id === datasetId) {
             console.log('Account found for user, checking role');
             // Check if account has the right role to edit.
             var role = user.account[ i].AccountsUsers.role;
             // User account with role owner, admin can edit an account. (Not editor or viewer)
             if (role === 1 || 2 || 3) {
               console.log('Valid role! ' + role);
               return next();
             }
           }
         }
         return res.json({ status:'err', msg:'No access.' });
     }).catch(function(err){
       return res.status(401).json({status: 'Error', msg: err});
     });
   });
 }


// Check if a user can delete a primary source
exports.canDelete = function(req,res,next) {
  console.log('Checking canDelete');

  // Fetch the current user and associated accounts.
  getUser(req.jwt.sub, function(user){

    req.user = user;

    // An admin can edit everything
    if (user.admin) {
      console.log('User is admin, valid!');
      return next();
    }

    // Get the dataset related to the primary resource, including the publication account
    // Primary belongsTo Dataset Belongs to Account
    models.Primary.find({
      where: { id: req.params.id },
      include: [{
        model: models.Dataset,
        as: 'dataset',
      }]
    }).then(function(primary){
      if (!primary) {
        return res.json({ status:'err', msg:'No primary found.' });
      }
      console.log('dataset: ', primary.dataValues.id);
      var datasetId = primary.dataValues.dataset.dataValues.account_id;
      console.log('datasetId: ' + datasetId);
      // Iterate over user's accounts
      for (var i=0; i<user.dataValues.account.length; i++){
        // Check if account is same as requested publication account for the new dataset.
        if (user.dataValues.account[ i].dataValues.id === datasetId) {
          console.log('Account found for user, checking role');
          // Check if account has the right role to edit.
          var role = user.account[ i].AccountsUsers.role;
          // User account with role owner, admin can edit an account. (Not editor or viewer)
          if (role === 1 || 2 || 3) {
            console.log('Valid role! ' + role);
            return next();
          }
         }
       }
       return res.json({ status:'err', msg:'No access.' });

    }).catch(function(err){
      console.log('err', err);
    });
   });
 }
