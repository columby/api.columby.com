'use strict';

module.exports = function(sequelize, DataTypes) {

  /**
   *
   * Schema definition
   *
   */
  var account_registries = sequelize.define('account_registries', {

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    apikey: {
      type: DataTypes.STRING
    },

    valid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Registry is validated'
    },

    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Registry is active. Can be set by account editor'
    },

    autoadd: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Automatically add new datasets to the registrty'
    },

    statusMessage: {
      type: DataTypes.STRING
    }
  });

  return account_registries;

};
