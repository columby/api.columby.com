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

          models.Account.hasMany(Collection);
          Collection.belongsTo(models.Account);

          Collection.hasMany(models.Dataset);
          models.Dataset.hasMany(Collection);
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
