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
  console.log(req.params);

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


exports.getDatasets = function(req,res){

  if (!req.params.id) {
    return res.json({status:'error', msg:'No collection id provided'});
  }

  var out = {
    count: 0,
    rows: []
  };

  // count
  var sql = 'SELECT COUNT(dataset_id) from "CollectionsDatasets" WHERE collection_id=' + req.params.id;
  models.sequelize.query(sql).then(function(result){
    console.log(result[0].count);
    out.count = result[ 0].count;

    if (out.count === 0){
      return res.json(out);
    }

    // Set filter
    var filter = {
      collection_id: req.params.id
    }
    // Set (default) limit
    var limit = req.query.limit || 10;
    // Set (default) offset
    var offset = req.query.offset || 0;

    var sql = 'SELECT "Datasets".id, "Datasets".shortid, "Datasets".title FROM "CollectionsDatasets"';
    sql += ' LEFT JOIN "Datasets" ON "CollectionsDatasets".dataset_id="Datasets".id';
    sql += ' WHERE "CollectionsDatasets".collection_id='+req.params.id;
    sql += ' LIMIT ' + limit + ' OFFSET ' + offset;

    console.log(sql);
    models.sequelize.query(sql).then(function(result){
      out.rows = result;
      return res.json(out);
    }).catch(function(err){
      return handleError(res,err);
    });
  }).catch(function(err){
    return handleError(res,err);
  })



  // models.CollectionsDatasets.findAndCountAll({
  //   //where: filter,
  //   //limit: limit,
  //   //offset: offset,
  //   order: 'created_at DESC',
  //   //include: [
  //   //  { model: models.Dataset, limit:1 }
  //   //]
  // }).then(function(datasets) {
  //   return res.json(datasets);
  // }).catch(function(err){
  //   return handleError(res, err);
  // });
}

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
