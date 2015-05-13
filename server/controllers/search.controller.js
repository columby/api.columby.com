'use strict';

var config = require('../config/environment/index.js'),
    Dataset = require('../models/index').Dataset,
    Account = require('../models/index').Account,
    Sequelize = require('sequelize')
;

/**

General search
Search datasets within a collection
Search datasets within a publication account

**/


// Get list of searchs
exports.search = function(req, res) {
  if (!req.query.query) {
    handleError(res, 'error, no query provided');
  }

  if (req.query.collectionId) {
    searchCollection(req.query);
  } else if (req.query.accountId) {
    searchAccount(req.query);
  } else {
    generalSearch(req);
  }
};



function generalSearch(params){

  var q = params.query;

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
    account_wheres.push({name: { ilike: "%"+_q[idx]+"%" }});
  }

  var chain = new Sequelize.Utils.QueryChainer();

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

  new Sequelize.Utils.QueryChainer()

    .add(Dataset.findAll({
      where: Sequelize.and(
        { private: false },
        Sequelize.or.apply(null,dataset_wheres)
    )})) // .on('sql', console.log))

    .add(Account.findAll({where: Sequelize.or.apply(null, account_wheres)})) // .on('sql', console.log))

    .run()

    .then(function(_results){
      var results = [];
      // add datasets
      for(var idx=0; idx < _results[0].length; idx++) {
        results.push({
          contentType: 'dataset',
          title: _results[0][idx].title,
          description: _results[0][idx].description,
          shortid: _results[ 0][ idx].shortid,
          weight: weightFunc(weight_DatasetTitle, _results[0][idx].title) + weightFunc(weight_DatasetDescription, _results[0][idx].description)
        });
      }
      // add accounts
      for(var idx=0; idx < _results[1].length; idx++) {
        results.push({
          contentType: 'account',
          title: _results[1][idx].name,
          slug: _results[1][idx].slug,
          description: '',
          weight: weightFunc(weight_AccountName, _results[0][idx].name)
        });
      }
      // sort on weight
      results.sort(function(a,b){
        if (a.weight > b.weight) {
          return -1;
        }
        if (a.weight < b.weight) {
          return +1;
        }
        return 0;
      });
      return res.json(results);
    })
    .catch(function(err){
      console.log(err);
      handleError(res, err);
    });

  //return res.json({status:"ok", query:query});
}



function searchCollection(params){

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


function handleError(res, err) {
  return res.send(500, err);
}
