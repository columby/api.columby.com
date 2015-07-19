'use strict';

module.exports = function(sequelize, DataTypes) {

  /**
   *
   * Schema definition
   *
   */
  var account_registries = sequelize.define('account_registries', {

    apikey: {
      type: DataTypes.STRING
    },

    autosync: {
      type: DataTypes.STRING
    },

    status: {
      type: DataTypes.STRING
    },

    statusMessage: {
      type: DataTypes.STRING
    }
  });

  return account_registries;

};
