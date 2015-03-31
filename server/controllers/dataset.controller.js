'use strict';

/**
 * Dependencies
 */
var models = require('../models/index'),
  auth = require('./auth.controller'),
  config = require('../config/environment/index'),
  jwt = require('jwt-simple'),
  moment = require('moment'),
  primaryController = require('./primary.controller'),
  distributionController = require('./distribution.controller')
  ;


// Access functions

function canView(req, dataset, cb){
  // everybody can view public datasets
  if (dataset.private === false){
    return cb(true);
  }

  // check user
  if (req.headers.authorization){
    console.log('checkin authorization header');
    var token = req.headers.authorization.split(' ')[1];
    var payload = jwt.decode(token, config.jwt.secret);
    if (payload.exp <= moment().unix()) {
      console.log('Token has expired');
    }
    // Attach user id to req
    if (!payload.sub) {
      return cb(false);
    } else {
      // account editors can view account private datasets
      models.User.find(payload.sub).then(function(user) {
        if (user.admin) {
          return cb(true);
        }
        user.getAccounts().then(function(accounts){
          var accountIds = [];
          for (var i=0;i<accounts.length;i++){
            accountIds.push(accounts[ i].dataValues.id);
          }
          console.log('Checking if dataset\'s ' + dataset.id + ' account (' + dataset.account.id + ') is in user account list. ', accountIds);
          if (accountIds.indexOf(dataset.dataValues.account_id) !== -1){
            return cb(true);
          } else {
            return cb(false);
          }
        }).catch(function(err){
          console.log(err);
          return cb(false);
        });
      }).catch(function(err){
        console.log(err);
        return cb(false);
      });
    }
  } else {
    return cb(false);
  }
}


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

exports.canCreate = function(req,res,next){
  // Fetch the current user and associated accounts.
  getUser(req.jwt.sub, function(user){
    // An admin can edit everything
    if (user.admin) {
      console.log('User is admin, valid!');
      return next();
    }
    // Iterate over user's accounts
    for (var i=0; i<user.account.length; i++){
      // Check if account is same as requested publication account for the new dataset.
      if (user.account[ i].dataValues.id === req.body.account.id) {
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
    // All failed, no access :(
    return res.json({ status:'err', msg:'No access.' });
  })
}


exports.canEdit = function(req,res,next){
  console.log(req.body);

  // Fetch the current user and associated accounts.
  getUser(req.jwt.sub, function(user){

    // An admin can edit everything
    if (user.admin) {
      console.log('User is admin, valid!');
      return next();
    }

    // Get the dataset's publication Account
    models.Dataset.find({
      where: { id: req.body.id },
      include: [ { model: models.Account, as: 'account' }]}).then(function(dataset){
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
      return handleError(res,err);
    });
  });
}

exports.canDelete = function(req,res,next){
  // Fetch the current user and associated accounts.
  getUser(req.jwt.sub, function(user){
    // An admin can edit everything
    if (user.admin) {
      console.log('User is admin, valid!');
      return next();
    }

    // Iterate over user's accounts
    for (var i=0; i<user.account.length; i++){
      // Check if account is same as requested publication account for the new dataset.
      if (user.account[ i].dataValues.id === req.body.account.id) {
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

    // All failed, no access :(
    return res.json({ status:'err', msg:'No access.' });
  });
}


exports.extractlink = function(req,res) {
  console.log(req.params);
  console.log(req.query);
  var uri = req.query.uri;
  console.log(uri);

  // get link properties
  if (uri){
    req.head(uri, function(err, result, body){
      if (res.statusCode !== 200) {
        console.log('invalid url');
      } else {
        // check for file
        console.log('valid url');
        // check for arcgis

      }


      res.json({
        headers: result,
        body: body
      });
      console.log('content-type:', result.headers['content-type']);
      console.log('content-length:', result.headers['content-length']);
    });
  } else {
    res.json({err:'no uri'});
  }
};


/**
 *
 * Get list of datasets.
 *
 */
exports.index = function(req, res) {
  console.log('Fetching datasets');
  // Define WHERE clauses
  var filter = {
    // Only show public datasets for a general index-show
    private: false
  };

  // filter by account id if provided
  if (req.query.accountId){
    filter.account_id = req.query.accountId;
  }

  // Set (default) limit
  var limit = req.query.limit || 10;
  // Set (default) offset
  var offset = req.query.offset || 0;

  models.Dataset.findAndCountAll({
    where: filter,
    limit: limit,
    offset: offset,
    order: 'created_at DESC',
    include: [
      { model: models.Account, as:'account', include: [
        { model: models.File, as: 'avatar'}
      ] }
    ]
  }).then(function(datasets) {
    return res.json(datasets);
  }).catch(function(err){
    return handleError(res, err);
  });
};

/**
 *
 * Show a single dataset.
 *
 */
exports.show = function(req, res) {
  // Show only if status is public and user can edit the dataset.
  models.Dataset.findOne({
    where: ['shortid=? or slug=?', req.params.id, req.params.id],
    include: [
      { model: models.Distribution, as: 'distributions' },
      { model: models.Primary, as: 'primary', include: [
        {model: models.File, as: 'file'}
      ] },
      { model: models.Tag, as:'tags' },
      { model: models.File, as: 'headerImg'},
      { model: models.Account, as:'account', include: [
        { model: models.File, as: 'avatar'},
        { model: models.File, as: 'headerImg'}
      ] },
      { model: models.Reference, as: 'references' }
    ]
  }).then(function(dataset) {
    // return if result is empty
    if (!dataset){
      return res.json(dataset);
    }
    // Check access
    canView(req,dataset, function(access){
      if (access){
        return res.json(dataset);
      } else {
        return handleError(res,'No access');
      }
    });
  }).catch(function(err){
    return handleError(res, err);
  });
};


/**
 *
 * Create a new dataset.
 *
 */
exports.create = function(req, res) {

  var d = req.body;

  // Handle tags
  if (d.tags ) {
    //d.tags = d.tags.split(',');
  }

  // Create a new dataset
  models.Dataset.create(req.body).then(function(dataset) {
    //console.log('Dataset created: ', dataset);
    dataset.setAccount(req.body.account.id).then(function(dataset) {
      console.log('Dataset account attached: ', dataset);
      return res.json(dataset);
    }).catch(function(err) {
      handleError(res,err);
    });
  }).catch(function(err){
    handleError(res,err);
  });
};


// Updates an existing dataset in the DB.
exports.update = function(req, res) {

  if(req.body._id) { delete req.body._id; }

  models.Dataset.find(req.params.id).then(function(dataset){
    if(!dataset) { return res.send(404); }

    // Set new header image if needed
    if (req.body.headerImg){
      dataset.setHeaderImg(req.body.headerImg);
    }

    dataset.updateAttributes(req.body).then(function(dataset) {
      return res.json(dataset);
    }).catch(function(err) {
      handleError(res,err);
    });
  }).catch(function(err){
    handleError(res,err);
  });
};


/**
 *
 * Deletes a dataset from the DB.
 * And all related content: sources, primaries, references, collections
 *
 */
exports.destroy = function(req, res) {
  console.log('Deleteting dataset ' + req.params.id);

  models.Dataset.find({
    where: {
      id: req.params.id
    },
    include: [
      { model: models.Distribution, as: 'distributions' },
      { model: models.Primary, as: 'primary' }
    ]}
    ).then(function (dataset) {

    if(!dataset) { return res.send(404); }

    // if (dataset.primary) {
    //   return res.json({status: 'error', msg:'Dataset has a primary source. '});
    // }

    // if (dataset.distributions.length >0){
    //   return res.json({status: 'error', msg:'Dataset has distributions. '});
    // }

    // destroy references


    // destroy primary


    // destroy sources


    // destroy dataset
    dataset.destroy().then(function(r){
      console.log(r);
      return res.status(204).json({status: 'success', msg: 'Dataset deleted.'})
    }).catch(function(err){
      handleError(res,err);
    });
  }).catch(function(err){
    if(err) { return handleError(res, err); }
  });
};


/**
 *
 * Crate and add a tag to a dataset
 *
 */
exports.addTag = function(req,res) {

  var tag = req.body.tag;
  models.Tag.findOrCreate({
    where: {
      text: tag.text
    }
  }).spread(function(tag, created){
    console.log('created: ', created);
    console.log(created);
    models.Dataset.find(req.params.id).then(function (dataset) {
      dataset.addTag(tag.id).then(function (dataset) {
        return res.json({dataset: dataset});
      }).catch(function (err) {
        return handleError(res, err);
      });
    }).catch(function (err) {
      return handleError(res, err);
    });
  }).catch(function(err){
    return handleError(res,err);
  });
};


/**
 *
 * Detach a tag from a dataset
 *
 */
exports.removeTag = function(req,res){
  console.log(req.params);
  if (req.params.id && req.params.tid) {
    models.Dataset.find(req.params.id).then(function (dataset) {
      if (dataset) {
        models.Tag.find({where: { id:req.params.tid}}).then(function(tag){
          dataset.removeTag(tag).then(function() {
            return res.json({status: 'success'});
          });
        }).catch(function(err){
          return handleError(res,err);
        });
      } else {
        return res.json(dataset);
      }
    }).catch(function (err) {
      return handleError(res, err);
    })
  } else {
    return handleError(res, {error: 'Missing id.'});
  }
};



/*-------------- DISTRIBUTIONS ---------------------------------------------------------------*/
exports.listDistributions = function(req, res) {
  console.log(req.params);
  var id = req.params.id;
  console.log(id);
};

exports.getDistribution = function(req,res){
  console.log(req.params);
};

exports.createDistribution = function(req, res) {
  console.log('creating distribution');
  console.log(req.body);
  var id = req.params.id;
  var distribution = req.body.distribution;

  models.Dataset.find(id).then(function(dataset) {
    if (!dataset){ return handleError( res, { error:'Failed to load dataset' } ); }
    models.Distribution.create(distribution).then(function(distribution){
      console.log('saved distribution', distribution);
      dataset.addDistribution(distribution).then(function(dataset){
        console.log('dataset', dataset);
        res.json(dataset);
      }).catch(function(err){
        return handleError(res,err);
      }).catch(function(err){
        return handleError(res,err);
      });
    }).catch(function(err){
      return handleError(res,err);
    });
  }).catch(function(err){
    return handleError(res,err);
  });
};

exports.updateDistribution = function(req, res, id) {
  console.log(req.params);
  models.Distribution.find(req.params.did).then(function(distribution){
    distribution.updateAttributes(req.params.distribution).then(function(distribution){
      res.json(distribution.id);
    })
  }).catch(function(err){
    return handleError(res,err);
  })
};

exports.destroyDistribution = function(req, res) {

  var id = String(req.params.id);
  var distributionId = String(req.params.distributionId);

  models.Dataset.findOne({_id:id},function(err,dataset){
    if (err) return res.json({status:'error', err:err});
    if (!dataset) return res.json({error:'Failed to load dataset', err:err});
    for (var i=0; i < dataset.distributions.length; i++){
      if (String(dataset.distributions[ i]._id) === distributionId){
        dataset.distributions.splice(i,1);
      }
    }
    dataset.save();
    res.json({status:'success'});
  });
};


/*-------------- REFERENCES --------------------------------------------------------------*/
exports.listReferences = function(req, res) {
  console.log(req.params);
  var id = req.params.id;
  console.log(id);
};

exports.getReference = function(req,res){
  console.log(req.params);
};

exports.createReference = function(req, res) {
  var id = req.params.id;
  var reference = req.body.reference;

  // Find the dataset to attach the reference to
  models.Dataset.find(id).then(function(dataset){
    if (!dataset){ return handleError( res, { error:'Failed to load dataset' } ); }
    // Create a db-entry for the reference
    models.Reference.create(reference).then(function(reference){
      // Add the reference to the dataset
      dataset.addReference(reference).then(function(dataset){
        res.json(dataset);
      }).catch(function(err){
        return handleError(res,err);
      });
    }).catch(function(err){
      return handleError(res,err);
    });
  }).catch(function(err){
    return handleError(res,err);
  });
};

exports.updateReference = function(req, res) {

};

// Delete a source attached to a dataset
exports.destroyReference = function(req, res) {

  var rid = req.params.rid;
  models.Reference.find(rid).then(function(reference){
    console.log('reference', reference);
    if(reference){
      reference.destroy().then(function(){
        console.log('deleted');
        res.json({status:'success'});
      }).catch(function(err){
        handleError(res,err);
      });
    } else {
      res.json(reference);
    }
  }).catch(function(err){
    handleError(res,err);
  });
};



function handleError(res, err) {
  console.log('Dataset error,', err);
  return res.status(500).json({status:'error', msg:err});
}
