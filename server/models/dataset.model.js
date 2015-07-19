'use strict';

var Hashids = require('hashids'),
  hashids = new Hashids('Salt', 8);

module.exports = function(sequelize, DataTypes) {

  /**
   *
   * Schema definition
   *
   */
  var Dataset = sequelize.define('Dataset',
    {
      shortid: {
        type: DataTypes.STRING,
        unique: true
      },
      uuid: {
        type: DataTypes.UUID
      },
      title: {
        type: DataTypes.STRING
      },
      slug: {
        type: DataTypes.STRING
      },
      description: {
        type: DataTypes.TEXT
      },
      private: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      created_at:{
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      }
    }, {
      classMethods: {
        associate: function (models) {

          // Header image association
          models.File.hasOne(Dataset, {
            foreignKey: 'headerimg_id',
            as: 'headerImg'
          });

          //
          Dataset.belongsTo(models.File,{
            foreignKey: 'headerimg_id',
            as: 'headerImg'
          });

          // A dataset can have multiple distributions
          // One dataset to Many distributions
          Dataset.hasMany(models.Distribution, { as:'distributions' });
          models.Distribution.belongsTo(Dataset, { as: 'dataset' });

          //
          Dataset.belongsTo(models.Account, {
            as:'account'
          });

          //
          Dataset.hasMany(models.Reference, {
            as:'references'
          });

          Dataset.hasOne(models.Primary, {
            as: 'primary'
          });
        }
      }
    }
  );

  /**
   *
   * Set shortid after creating a new account
   *
   */
  Dataset.afterCreate( function(model) {
    model.updateAttributes({
      shortid: hashids.encode(parseInt(String(Date.now()) + String(model.id)))
    }).then(function(result){
      console.log('[Model Dataset] - Shortid created: ' + result.shortid);
    }).catch(function(){
      console.log('[Model Dataset] - Shortid error: ', err);
    });
  });

  return Dataset;
};
