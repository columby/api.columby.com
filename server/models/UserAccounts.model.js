'use strict';

module.exports = function(sequelize, DataTypes) {

  /**
   *
   * Schema definition
   *
   */
  var UserAccounts = sequelize.define('UserAccounts', {

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    /**
     * 1 primary
     * 2 admin
     * 3 editor
     * 4 viewer
     **/
    role: DataTypes.INTEGER,

    created_at:{
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }

  });

  return UserAccounts ;
};
