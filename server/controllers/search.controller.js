'use strict';

var config = require('../config/environment/index.js'),
    Dataset = require('../models/index').Dataset,
    Account = require('../models/index').Account,
    Sequelize = require('sequelize')
;


// Get list of searchs
exports.search = function(req, res) {
  if (!req.query.query) {
    handleError(res, 'error, no query provided');
  }

  var q = req.query.query;

  // @todo Sequelize.or does not seem to work or I implemented it wrongly.. (marcelfw)

  // Define dataset filters
  var dataset_wheres = [];
  var _q = q.trim().split(' ');
  for(var idx=0; idx < _q.length; idx++) {
    dataset_wheres.push({
      title: {
        ilike: '%'+_q[idx]+'%'
      }
    });
    dataset_wheres.push({
      description: {
        ilike: '%' + _q[idx] + '%'
      }
    });
  }

  // Define Account filters
  var account_wheres = [];
  for(idx=0; idx < _q.length; idx++) {
    account_wheres.push({displayName: { ilike: "%"+_q[idx]+"%" }});
  }

  // calculate fuzzy weight
  // start weight is weights[0]
  // every matched keyword from _q adds weights[1]
  var weightFunc = function(weights, str){
    if (str === undefined) {
        return 0;
    }
    var weight = weights[0];
    for(var idx=0; idx < _q.length; idx++) {
      if (str.search(new RegExp(_q[idx], 'i')) >= 0) {
        weight += weights[1];
        continue;
      }
    }
    return weight;
  };

  var weight_DatasetTitle = [ 10, 2 ];
  var weight_DatasetDescription = [ 5, 1 ];
  var weight_AccountName = [ 10, 2 ];

  var response = {
    datasets: {
      count: 0,
      rows: []
    },
    accounts: {
      count: 0,
      rows: []
    },
    tags: {
      count: 0,
      rows: []
    }
  };

  // Do the search
  Dataset.findAndCountAll({
    where: Sequelize.and(
      { private: false },
      Sequelize.or.apply(null,dataset_wheres)
    ),
    limit: 50,
    offset: 0,
    order: 'created_at DESC'
  }).then(function(result){
    //console.log(result);
    response.datasets.count = result.count;

    // Add datasets
    for(var idx=0; idx < result.rows.length; idx++) {
      //console.log('adding: ', result[ idx]);
      response.datasets.rows.push({
        contentType: 'dataset',
        title: result.rows[idx].title,
        description: result.rows[idx].description,
        shortid: result.rows[ idx].shortid,
        weight: weightFunc(weight_DatasetTitle, result.rows[idx].title) + weightFunc(weight_DatasetDescription, result.rows[idx].description)
      });
    }

    console.log('Searching accounts');
    Account.findAndCountAll({
      where: Sequelize.or.apply(null, account_wheres)
    }).then(function(result){
      //console.log('account result: ', result);
      // add accounts
      response.accounts.count= result.count;

      for(var idx=0; idx < result.rows.length; idx++) {
        response.accounts.rows.push({
          contentType: 'account',
          title: result.rows[ idx].displayName,
          slug: result.rows[ idx].slug,
          description: '',
          weight: weightFunc(weight_AccountName, result.rows[ idx].displayName)
        });
      }

      // sort on weight
      response.datasets.rows.sort(function(a,b){
        if (a.weight > b.weight) { return -1; }
        if (a.weight < b.weight) { return +1; }
        return 0;
      });

      // Send back result
      return res.json(response);
    }).catch(function(err){
      return handleError(res,err);
    });
  }).catch(function(err){
    return handleError(res,err);
  });
}


function searchAccount(params, cb) {

  Dataset.findAll({
    where: {
      account_id: params.accountId,
      title: {like: '%' + params.query + '%'}
    },
    limit: params.limit || 50,
    offset: params.offset || 0
  }).then(function(datasets){
    cb(datasets);
  }).catch(function(error){
    cb(error);
  })
}


/***
 * Error handler
 ***/
function handleError(res, err) {
  console.log('Search error: ', err);
  return res.send({status: 'error', msg:err});
}
