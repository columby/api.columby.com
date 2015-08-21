'use strict';

/**
 * Documentation tasks
 */

var gulp    = require('gulp');
var exec    = require('child_process').exec;

exports.apidoc = function (done) {
  exec('apidoc -i server -o client/docs', done);
};
