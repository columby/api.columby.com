'use strict';

var _ = require('lodash'),
    models = require('../models/index');

// Get list of categorys
exports.index = function(req, res) {
  models.Category.findAll().then(function(models){
    return res.json(models);
  }).catch(function(err){
    return res.json(err);
  });
};

/**
 *
 * Get a single category
 *
 */
exports.show = function(req, res) {
  models.Category.find({
    where: {
      id: req.params.id
    },include: [
        { model: models.Account, include: [
          { model: models.File, as:'avatar' }
        ]}
      ]
    }).then(function(category){
      return res.json(category);
    }).catch(function(err){
      return res.json(err);
    });
};


exports.create = function(req,res){
  console.log('Creating new category');
  console.log(req.body);
  if (!req.body.account_id){
    return handleError(res,'No account id provided.');
  } else {
    var category = {
      account_id: req.body.account_id,
      name: req.body.name
    };
    models.Category.create(category).then(function(model){
      return res.json(model);
    }).catch(function(err){
      handleError(res,err);
    });
  }
};


exports.update = function(req,res){
  console.log(req.body);
  if (req.body.id){
    models.Category.findOne(req.body.id).then(function(category){
      if (!category){
        return handleError(res, 'No category found. ');
      } else {
        category.updateAttributes(req.body).then(function(updated) {
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
 * Delete a category and associated datasets
 *
 * @param req
 * @param res
 */
exports.destroy = function(req,res){
  if (req.params.id){
    models.Category.findById(req.params.id).then(function(model){
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
    return res.json({status:'error', msg:'No category id provided'});
  }

  var out = {
    count: 0,
    rows: []
  };

  // count
  var sql = 'SELECT COUNT(dataset_id) from "dataset_categories" WHERE category_id=' + req.params.id;
console.log(sql);
  models.sequelize.query(sql).then(function(result){
    
    out.count = result[ 0][0].count;

    if (out.count === 0){
      return res.json(out);
    }

    // Set filter
    var filter = {
      category_id: req.params.id
    }
    // Set (default) limit
    var limit = req.query.limit || 10;
    // Set (default) offset
    var offset = req.query.offset || 0;

    var sql = 'SELECT "Datasets".* FROM "dataset_categories"';
    sql += ' LEFT JOIN "Datasets" ON "dataset_categories".dataset_id="Datasets".id';
    sql += ' WHERE "dataset_categories".category_id='+req.params.id;
    sql += ' LIMIT ' + limit + ' OFFSET ' + offset;

    models.sequelize.query(sql).then(function(result){
      out.rows = result[0];
      return res.json(out);
    }).catch(function(err){
      return handleError(res,err);
    });
  }).catch(function(err){
    return handleError(res,err);
  })



  // models.CategorysDatasets.findAndCountAll({
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
 * Add a dataset to a category
 *  categoryId
 *  datasetId
 *
 */
exports.addDataset = function(req,res){
  if (!req.params.id){
    return handleError(res,'no categoryId provided');
  }
  if (!req.body.datasetId){
    return handleError(res,'no datasetId provided');
  }

  models.Category.findOne(req.params.id).then(function(category){
    models.Dataset.findOne(req.body.datasetid).then(function(dataset){
      category.addDataset(dataset).then(function(result){
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
 * Remove a dataset from a category
 *  categoryId
 *  datasetId
 *
 */
exports.removeDataset = function(req,res){
  if (!req.params.id){
    return handleError(res,'no categoryId provided');
  }
  if (!req.body.datasetId){
    return handleError(res,'no datasetId provided');
  }

  console.log('removing dataset ' + req.body.datasetId + ' from ' + req.params.id);

  models.Category.findOne(req.params.id).then(function(category){
    if (!category){
      return handleError(res,'Category not found.');
    }
    models.Dataset.findOne(req.body.datasetId).then(function(dataset){
      if (!dataset){
        return handleError(res,'Dataset not found.');
      }
      category.removeDataset(dataset).then(function(result){
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
