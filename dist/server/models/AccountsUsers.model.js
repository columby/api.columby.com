'use strict';

module.exports = function(sequelize, DataTypes) {

  /**
   *
   * Schema definition
   *
   */
  var AccountsUsers = sequelize.define('AccountsUsers', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    role: DataTypes.INTEGER,

    created_at:{
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }

    /**
     * 1 primary
     * 2 owner
     * 3 admin
     * 4 publisher
     * 5 viewer
     **/

    });

  return AccountsUsers ;
};
