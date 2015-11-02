'use strict';

var models = require('../models/index');
var sequelize = models.sequelize;

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
                                // Limit characters
}


exports.findOrCreateTag = function(tag, cb){
  tag.slug = slugify(tag.text);
  console.log('Finding or create tag.', tag);
  models.Tag.findOrCreate({
    where: ['slug=? or text=?', tag.slug, tag.text],
    defaults: tag
  }).then(function(tag) {
    var result = {
      created: tag[ 1],
      tag: tag[ 0]
    };
    return cb(result);
  }).catch(function(err){
    return cb(null,err);
  });
}


exports.index = function(req, res) {
  var filter = {};
  if (req.query.tagId){
    filter.id= req.query.tagId
  } else if(req.query.text){
    filter.text= req.query.text
  }

  // Include contenttype
  var include=[];
  if (req.query.contentType && req.query.contentType==='dataset'){
    include.push({
      model: models.Dataset,
      as: 'tags',
      include: [
        {model: models.Account, as:'account'}
      ]
    });
  }

  var limit = req.query.limit || 10;
  if (limit > 50) { limit = 50; }
  var offset = req.query.offset || 0;

  models.Tag.findAndCountAll({
    where: filter,
    limit: limit,
    offset: offset,
    order: 'created_at DESC',
  }).then(function(models) {
    return res.json(models);
  }).catch(function(err){
    return handleError(res, err);
  });
};

/**
 *
 * Get a single tag
 *
 * @param req
 * @param res
 *
 */
exports.show = function(req, res) {
  var limit = req.query.limit || 10;
  if (limit > 50) { limit = 50; }
  var offset = req.query.offset || 0;
  var order = req.query.order || 'created_at DESC';
  var filter = {};

  // filter by account id if provided
  if (req.query.account_id){
    filter.account_id = req.query.account_id;
  }

  models.Tag.findOne({
    where: {
      slug: req.params.slug
    }
  }).then(function(tag) {
    if (!tag) { return res.json(tag); }

    // Get tag id from tag.slug query input
    //var sql = 'SELECT t.id FROM "Tags" as t WHERE t.slug = :slug';
    // models.sequelize.query(sql,
    //   { replacements: { slug: req.params.slug }, type: models.sequelize.QueryTypes.SELECT }
    // ).then(function(result) {
    //   console.log(result);
    //   if (result.length <1) { return res.json({}); }
      // Get dataset count for this tag
      // var tagId = result[0].id;
      var sql = 'SELECT count(dt.dataset_id) FROM dataset_tags as dt WHERE dt.tag_id = ' + tag.id;
      models.sequelize.query(sql).then(function(result){
        var count = result[0][0].count;

        // get datasets
        tag.getDatasets({
          limit:limit,
          offset:offset,
          filter:filter,
          include: [{
            model:models.Account, as:'account'
          }]
        }).then(function(datasets){
          tag.dataValues.hits = {
            datasets: {
              count: count,
              rows: datasets
            }
          };
          return res.json(tag);
        });
      }).catch(function(err){
        console.log(err);
      });
    });


  // }).catch(function(err) {
  //   console.log(err);
  //   return handleError(res,err);
  // });
};


/**
 *
 * Create a new Tag
 *
 * @param req
 * @param res
 */
exports.create = function(req,res){
  console.log('Creating tag, ', req.body);

  models.Tag.find({where:{text:req.body.text}}).then(function(model) {
    if (model && model.id){
      console.log('existing term', model.dataValues);
      return res.json(model);
    } else {
      models.Tag.create({text: req.body.text}).then(function(model) {
        console.log('new term', model.id);
        return res.json(model);
      }).catch(function(err){
        return handleError(res,err);
      });
    }
  }).catch(function(err){
    return handleError(res,err);
  });
};





function handleError(res, err) {
  console.log('Vocabulary controller error: ',err);
  return res.send({status:'error', msg:err});
}
