'use strict';

module.exports = function(sequelize, DataTypes) {

  var dataset_categories = sequelize.define('dataset_categories', {

  }, {
    hooks: {
      beforeUpdate: function(model,options) {
        console.log('model', model);
        // model.updateAttributes({
        //   shortid: hashids.encode(parseInt(String(Date.now()) + String(model.id)))
        // }).success(function(){}).error(function(){});
      }
    }
  });

  return dataset_categories ;
};
