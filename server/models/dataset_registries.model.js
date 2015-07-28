'use strict';

module.exports = function(sequelize, DataTypes) {

  /**
   *
   * Schema definition
   *
   */
  var dataset_registries = sequelize.define('dataset_registries', {

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    sync: {
      type: DataTypes.BOOLEAN
    },

    status: {
      type: DataTypes.STRING
    }

  });

  return dataset_registries ;
};
