'use strict';

/**
 * Dependencies
 */
var models = require('../models/index'),
    datasetPerms = require('../permissions/dataset.permission'),
    tagCtrl = require('../controllers/tag.controller'),
    config = require('../config/config');


/**
 * @api {get} /dataset Request a list of datasets
 * @apiName GetDatasets
 * @apiGroup Dataset
 * @apiVersion 2.0.0
 *
 * @apiSuccess {Object} Array with dataset objects.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    [{
 *       "title": "Dataset title"
 *    }]
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
 * @api {get} /dataset/:slug Request a datasets
 * @apiName GetDataset
 * @apiGroup Dataset
 * @apiVersion 2.0.0
 *
 * @apiSuccess {Object} dataset object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "title": "Dataset title"
 *    }
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
    if (!dataset) { return res.json(dataset); }
    dataset.getRegistries().then(function(result){
      dataset.dataValues.registries = result;
      req.dataset = dataset;
      return res.json(dataset);
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

  var data = req.body;
  delete data.account;
  console.log('Creating dataset: ', data);

  // Create a new dataset
  models.Dataset.create(data).then(function(dataset) {
    console.log('[Controller Dataset] - Dataset created. ');
    return res.json(dataset);
  }).catch(function(err){
    handleError(res,err);
  });
};


// Updates an existing dataset in the DB.
exports.update = function(req, res) {
  models.Dataset.update(
    req.body,
    {
      where: {
        id: req.body.id
      }
    }).then(function(result){
    console.log('Update success: ', result);
    return res.json(req.body);
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



/*-------------- TAGS ---------------------------------------------------------------*/

/**
 * Create and add a tag to a dataset
 */
exports.addTag = function(req,res) {
  tagCtrl.findOrCreateTag(req.body.tag, function(tag,err){
    if (err) { return handleError(res, err); }
    if (tag) {
      // add tag to dataset
      req.dataset.addTag(tag.tag).then(function(result){
        console.log(result);
        if (result[0]) {
          tag.added=true;
        } else {
          tag.added=false;
        }
        return res.json(tag);
      }).catch(function(err){
        return handleError(res,err);
      });
    }
    // models.Dataset.findById(req.params.id).then(function (dataset) {
    //   dataset.addTag(tag).then(function(result) {
    //     return res.json({tag: tag, result:result});
    //   }).catch(function (err) { return handleError(res, err); });
    // }).catch(function (err) { return handleError(res, err); });
  });
};


/**
 * Detach a tag from a dataset
 */
exports.removeTag = function(req,res){
  console.log(req.params);
  if (req.params.id && req.params.tid) {
    models.Dataset.findById(req.params.id).then(function (dataset) {
      if (dataset) {
        models.Tag.find({where: { id:req.params.tid}}).then(function(tag){
          dataset.removeTag(tag).then(function() {

            // delete tags with no connections

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

/**
 * @api {get} /dataset/:id/registry/:rid Update dataset registry status
 * @apiName UpdateDatasetRegistry
 * @apiGroup Dataset
 * @apiVersion 2.0.0
 *
 * @apiSuccess {Object} Array with dataset_registry object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    [{
 *       "title": "Dataset title"
 *    }]
 */
exports.updateRegistry = function(req,res){
  console.log('update dataset registry');

  // get registries for this dataset
  models.dataset_registries.find({
    where: {
      dataset_id: req.params.id,
      registry_id: req.params.rid
    }
  }).then(function(registry){
    if (!registry){
      models.dataset_registries.create({
        dataset_id: req.params.id,
        registry_id: req.params.rid,
        status: req.body.status
      }).then(function(result){
        console.log(result.dataValues);
        return res.json(result);
      }).catch(function(err){
        handleError(res,err);
      })
    } else {
      registry.updateAttributes({
        status: req.body.status
      }).then(function(result){
        return res.json(result);
      }).catch(function(err){
        handleerror(res,err);
      });
    }
  });
}



function handleError(res, err) {
  console.log('Dataset controller error,', err);
  return res.status(500).json({status:'error', msg:err});
}
