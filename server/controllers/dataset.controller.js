'use strict';

/**
 *
 * Dependencies
 *
 */
var _ = require('lodash'),
    models = require('../models/index'),
    Dataset = require('../models/index').Dataset,
    Account = require('../models/index').Account,
    File = require('../models/index').File,
    Sequelize = require('sequelize')
  ;


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
  console.log('Fetching datasets/');
  // Define WHERE clauses
  var filter = {
    private: false
  };

  if (req.query.accountId){
    filter.account_id = req.query.accountId;
  }

  // Set (default) limit
  var limit = req.query.limit || 10;
  // Set (default) offset
  var offset = req.query.offset || 0;

  Dataset.findAndCountAll({
    where: filter,
    limit: limit,
    offset: offset,
    order: 'created_at DESC',
    include: [
      { model: Account, as:'account', include: [
        { model: File, as: 'avatar'}
      ] }
    ]
  }).success(function(datasets) {
    return res.json(datasets);
  }).error(function(err){
    console.log(err);
    return handleError(res, err);
  });
};

/**
 *
 * Show a single dataset.
 *
 */
exports.show = function(req, res) {
  console.log('show dataset:', req.params.id);
  Dataset.findOne({
    where: { shortid: req.params.id },
    include: [
      { model: models.Distribution, as: 'distributions' },
      { model: models.Primary, as: 'primary' },
      { model: models.Tag, as:'tags' },
      { model: File, as: 'headerImg'},
      { model: Account, as:'account', include: [
        { model: File, as: 'avatar'},
        { model: File, as: 'headerImg'}
      ] },
      { model: models.Reference, as: 'references' }
    ]
  }).success(function(dataset){
    return res.json(dataset);
  }).error(function(err){
    console.log(err);
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
  Dataset.create(req.body).success(function(dataset) {
    //console.log('Dataset created: ', dataset);
    dataset.setAccount(req.body.account.id).success(function(dataset) {
      console.log('Dataset account attached: ', dataset);
      return res.json(dataset);
    }).error(function(err) {
      handleError(res,err);
    });
  }).error(function(err){
    handleError(res,err);
  });
};

// Updates an existing dataset in the DB.
exports.update = function(req, res) {

  if(req.body._id) { delete req.body._id; }

  Dataset.find(req.params.id).success(function(dataset){
    if(!dataset) { return res.send(404); }

    // Set new header image if needed
    if (req.body.headerImg){
      dataset.setHeaderImg(req.body.headerImg);
    }

    dataset.updateAttributes(req.body).success(function(dataset) {
      return res.json(dataset);
    }).error(function(err) {
      handleError(res,err);
    });
  }).error(function(err){
    handleError(res,err);
  });
};

// Deletes a dataset from the DB.
exports.destroy = function(req, res) {
  Dataset.findById(req.params.id, function (err, dataset) {
    if(err) { return handleError(res, err); }
    if(!dataset) { return res.send(404); }
    dataset.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};


/**
 *
 * Crate and add a tag to a dataset
 *
 */
exports.addTag = function(req,res) {

  var tag = req.body.tag;
  console.log('adding tag: ', req.body.tag);

  models.Tag.findOrCreate({
    where:{
      text: tag.text
    }
  }).success(function(tag, created){
    Dataset.find(req.params.id).success(function (dataset) {
      dataset.addTag(tag.id).success(function (dataset) {
        return res.json({dataset: dataset});
      }).error(function (err) {
        return handleError(res, err);
      });
    }).error(function (err) {
      return handleError(res, err);
    });
  }).error(function(err){
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
    Dataset.find(req.params.id).success(function (dataset) {
      if (dataset) {
        models.Tag.find({where: { id:req.params.tid}}).success(function(tag){
          dataset.removeTag(tag).then(function() {
            return res.json({status: 'success'});
          });
        }).error(function(err){
          return handleError(res,err);
        });
      } else {
        return res.json(dataset);
      }
    }).error(function (err) {
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

  Dataset.find(id).success(function(dataset) {
    if (!dataset){ return handleError( res, { error:'Failed to load dataset' } ); }
    models.Distribution.create(distribution).success(function(distribution){
      console.log('saved distribution', distribution);
      dataset.addDistribution(distribution).success(function(dataset){
        console.log('dataset', dataset);
        res.json(dataset);
      }).error(function(err){
        return handleError(res,err);
      }).error(function(err){
        return handleError(res,err);
      });
    }).error(function(err){
      return handleError(res,err);
    });
  }).error(function(err){
    return handleError(res,err);
  });
};

exports.updateDistribution = function(req, res, id) {
  console.log(req.params);
  models.Distribution.find(req.params.did).success(function(distribution){
    distribution.updateAttributes(req.params.distribution).success(function(distribution){
      res.json(distribution.id);
    })
  }).error(function(err){
    return handleError(res,err);
  })
};

exports.destroyDistribution = function(req, res) {

  var id = String(req.params.id);
  var distributionId = String(req.params.distributionId);

  Dataset.findOne({_id:id},function(err,dataset){
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
  console.log('id',id);
  console.log('reference', reference);

  // Find the dataset to attach the reference to
  Dataset.find(id).success(function(dataset){
    if (!dataset){ return handleError( res, { error:'Failed to load dataset' } ); }
    // Create a db-entry for the reference
    models.Reference.create(reference).success(function(reference){
      console.log('saved reference: ',reference);
      // Add the reference to the dataset
      dataset.addReference(reference).success(function(dataset){
        console.log('dataset', dataset);
        res.json(dataset);
      }).error(function(err){
        return handleError(res,err);
      });
    }).error(function(err){
      return handleError(res,err);
    });
  }).error(function(err){
    return handleError(res,err);
  });
};

exports.updateReference = function(req, res) {

};

// Delete a source attached to a dataset
exports.destroyReference = function(req, res) {

  var rid = req.params.rid;
  models.Reference.find(rid).success(function(reference){
    console.log('reference', reference);
    if(reference){
      reference.destroy().success(function(){
        console.log('deleted');
        res.json({status:'success'});
      }).error(function(err){
        handleError(res,err);
      });
    } else {
      res.json(reference);
    }
  }).error(function(err){
    handleError(res,err);
  });
};



function handleError(res, err) {
  console.log('Dataset error,', err);
  return res.send(500, err);
}
