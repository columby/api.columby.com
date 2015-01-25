"use strict";

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var config    = require('./../config/environment');

/**
 *
 * Database settings
 *
 **/
var sequelize = new Sequelize(config.db.uri, {
    dialect: config.db.dialect,
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: false
    }
  }
);

/**
 *
 * Authenticate to the database
 *
 **/
sequelize
  .authenticate()
  .complete(function(err) {
    if (!!err) {
      console.log('Unable to connect to the database:', err)
    } else {
      console.log('Postgres; Connection has been established successfully.')
    }
  });

/**
 *
 * Read model files
 *
 **/
var db = {};

fs.readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf(".") !== 0) && (file !== "index.js");
  })
  .forEach(function(file) {
    var model = sequelize["import"](path.join(__dirname, file));
    db[model.name] = model;
  });


/**
 *
 * Create associations for loaded models
 *
 **/
Object.keys(db).forEach(function(modelName) {
  if ("associate" in db[modelName]) {
    db[modelName].associate(db);
  }
});


db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
