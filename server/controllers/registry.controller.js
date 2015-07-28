'use strict';

/**
 *
 * Dependencies
 *
 */
var models = require('../models/index'),
    request = require('request');


/**
 *
 * Get list of Registries
 *
 */
exports.index = function(req, res) {
  console.log('index registries');
  models.Registry.findAll().then(function(registries) {
    return res.json(registries);
  }).catch(function(err){
    return handleError(res, err);
  });
};

/**
 *
 * Get a single registry item
 *
 **/
exports.show = function(req, res) {
  models.Registry.findById(req.params.id).then(function(registry){
    res.json(registry);
  }).catch(function(err){
    return handleError(res,err);
  });
};


exports.query = function(req,res){

  /***
  organization_list - organisations list on ckan
  group_list_authz - Return the list of groups that the user is authorized to edit

  ***/

  request.get('http://data_overheid_2.acceptatie.indicia.nl/').on('response', function(response){
    return res.json(response);
  });
}



/**
 * @api {post} v2/registry/:id/validate Validate
 * @apiName ValidateRegistry
 * @apiGroup Registry
 * @apiVersion 2.0.0
 *
 * @apiDescription Validate access to a registry with provided credentials
 *
 * @apiParam {Number} id Registry unique ID.
 *
 * @apiSuccess {boolean} valid true or false.
 * @apiSuccess {object} data Details from the registry for the validated user.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    [{
 *       "valid": true,
 *       "data" : {
 *         "groups": ["group A", "group B"]
 *       }
 *    }]
 */
exports.validate = function(req,res){
  request({
    method: 'POST',
    url: 'https://dev-api.columby.com/v2/registry/ckan',
    form: {
      url: 'http://data_overheid_2.acceptatie.indicia.nl/data/api/3/action/dashboard_activity_list_html',
      apikey: req.body.apikey
    }
  }, function(err, response, body){
    if (JSON.parse(body).response.statusCode === 403 ) {
      return res.json({
        status: 'error',
        statusCode: 403,
        body: JSON.parse(body)
      });
    } else {
      request({
        method: 'POST',
        url: 'https://dev-api.columby.com/v2/registry/ckan',
        form: {
          url: 'http://data_overheid_2.acceptatie.indicia.nl/data/api/3/action/group_list_authz',
          apikey: '0ed2ec4d-ecb2-4e4d-befa-257f51db52e4'
        }
      }, function(error, response, body){
        return res.json({
          status: 'success',
          statusCode: response.statusCode,
          err: error,
          response: response,
          body: JSON.parse(JSON.parse(body).body)
        })
      });
    }
  })

  // var options = {
  //   url: 'http://data_overheid_2.acceptatie.indicia.nl/data/api/3/action/dashboard_activity_list_html',
  //   headers: {
  //     'Authorization': req.body.settings.apikey
  //   }
  // }
  //
  // request.get(options, function(err, response,body){
  //   console.log(body);
  //   if (response.statusCode !== 200) {
  //     return res.json({err: err, body:body, response:response});
  //   }
  //   if (response.statusCode === 200) {
  //     options = {
  //       url: 'http://data_overheid_2.acceptatie.indicia.nl/data/api/3/action/group_list_authz',
  //       headers: {
  //         'Authorization': req.body.settings.apikey
  //       }
  //     }
  //     request.get(options, function(error, response, body){
  //       return res.json({
  //         response: response,
  //         status: 'success',
  //         body: body,
  //         error: error
  //       });
  //     });
  //   }
  // });
}


function handleError(res, err) {
  console.log('Registry controller error: ',err);
  return res.send(500, err);
}
