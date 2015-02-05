'use strict';

var _ = require('lodash'),
    models = require('../models/index');

// Get list of collections
exports.index = function(req, res) {
  models.Collection
    .find({})
    .populate('datasets', 'title')
    .populate('account', 'name')
    .exec(function (err, collections) {
    if(err) { return handleError(res, err); }
    return res.json(200, collections);
  });
};

/**
 *
 * Get a single collection
 *
 */
exports.show = function(req, res) {
  console.log(req.params.id);

  models.Collection
    .find({
      where: {shortid: req.params.id},
      include: [
        { model: models.Dataset },
        { model: models.Account, include: [
          { model: models.File, as:'avatar' }
        ]}
      ]
    }).then(function(models){
      return res.json(models);
    }).catch(function(err){
      return res.json(err);
    });
};


exports.create = function(req,res){
  console.log('Creating new collection');
  console.log(req.params);
  if (!req.body.accountId){
    return handleError(res,'No account id provided.');
  } else {
    var collection = {
      account_id: req.body.accountId,
      title: req.body.title
    };
    models.Collection.create(collection).then(function(model){
      return res.json(model);
    }).catch(function(err){
      handleError(res,err);
    });
  }
};


exports.update = function(req,res){
  console.log(req.body);
  if (req.body.id){
    models.Collection.findOne(req.body.id).then(function(collection){
      if (!collection){
        return handleError(res, 'No collection found. ');
      } else {
        collection.updateAttributes(req.body).then(function(updated) {
          return res.json(updated);
        }).catch(function(err) {
          handleError(res,err);
        });
      }
    }).catch(function(err){
      return handleError(res,err);
    });
  } else {
    return handleError(res, 'No id provided');
  }
};

/**
 *
 * Delete a collection and associated datasets
 *
 * @param req
 * @param res
 */
exports.destroy = function(req,res){
  if (req.params.id){
    models.Collection.findOne(req.params.id).then(function(model){
      // todo: delete associated datasets

      model.destroy().then(function(){
        return res.json(true);
      }).catch(function(err){
        return handleError(res,err);
      });
    }).catch(function(err){
      return handleError(res,err);
    });
  } else {
    return handleError(res, 'No id provided');
  }
};


/**
 *
 * Add a dataset to a collection
 *  collectionId
 *  datasetId
 *
 */
exports.addDataset = function(req,res){
  if (!req.params.id){
    return handleError(res,'no collectionId provided');
  }
  if (!req.body.datasetId){
    return handleError(res,'no datasetId provided');
  }

  models.Collection.findOne(req.params.id).then(function(collection){
    models.Dataset.findOne(req.body.datasetid).then(function(dataset){
      collection.addDataset(dataset).then(function(result){
        return res.json(result);
      }).catch(function(err){
        return res.json(res,err);
      });
    }).catch(function(err){
      return res.json(res,err);
    });
  }).catch(function(err){
    return handleError(res,err);
  });
};


/**
 *
 * Remove a dataset from a collection
 *  collectionId
 *  datasetId
 *
 */
exports.removeDataset = function(req,res){
  if (!req.params.id){
    return handleError(res,'no collectionId provided');
  }
  if (!req.body.datasetId){
    return handleError(res,'no datasetId provided');
  }

  console.log('removing dataset ' + req.body.datasetId + ' from ' + req.params.id);

  models.Collection.findOne(req.params.id).then(function(collection){
    if (!collection){
      return handleError(res,'Collection not found.');
    }
    models.Dataset.findOne(req.body.datasetId).then(function(dataset){
      if (!dataset){
        return handleError(res,'Dataset not found.');
      }
      collection.removeDataset(dataset).then(function(result){
        return res.json(result);
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



function handleError(res, err) {
  console.log('Error: ', err);
  return res.send(500, err);
}
