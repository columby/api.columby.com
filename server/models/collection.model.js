'use strict';

var Hashids = require('hashids'),
    hashids = new Hashids('Salt', 8);


module.exports = function(sequelize, DataTypes) {

  /**
   *
   * Schema definition
   *
   */
  var Collection = sequelize.define('Collection',
    {
      title: {
        type: DataTypes.STRING
      },
      shortid: {
        type: DataTypes.STRING,
        unique: true
      },
      description: {
        type: DataTypes.TEXT
      },
      created_at:{
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      }
    },{
      classMethods: {
        associate: function(models) {

          // An account can have multiple collection
          models.Account.hasMany(Collection);
          Collection.belongsTo(models.Account);

          // A collection can have multiple datasets, datasets can belong to many collections (Many to many)
          Collection.belongsToMany(models.Dataset, { through: 'collection_datasets' } );
          models.Dataset.belongsToMany(Collection, { through: 'collection_datasets' } );

        }
      }
    }
  );

  /**
   *
   * Set shortid after creating a new account
   *
   */
  Collection.afterCreate( function(model) {
    model.updateAttributes({
      shortid: hashids.encode(parseInt(String(Date.now()) + String(model.id)))
    }).success(function(){}).error(function(){});
  });

  return Collection;
};
