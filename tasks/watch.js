'use strict';

/**
 * Watch files, and do things when they changes.
 * Recompile scss if needed.
 * Reinject files
 */

var gulp       = require('gulp');
var livereload = require('gulp-livereload');
var watch      = require('gulp-watch');
var inject     = require('gulp-inject');
var plumber    = require('gulp-plumber');
var sass       = require('gulp-sass');
var bowerFiles = require('main-bower-files');

var toInject   = require('./config/filesToInject');
var toExclude  = require('./config/bowerFilesToExclude');

module.exports = function () {

  livereload.listen();

  gulp.watch('bower.json', function () {
    gulp.src('client/index.html')
      .pipe(inject(gulp.src(bowerFiles(), { read: false }), {
        name: 'bower',
        relative: 'true',
        ignorePath: toExclude
      }))
      .pipe(gulp.dest('client'));
  });

  watch([
    'client/assets/styles/**/*.scss',
    'client/views/**/*.scss',
    'client/app/directives/**/*.scss'
  ], function () {
    gulp.src('client/assets/styles/app.scss')
      .pipe(plumber())
      .pipe(sass())
      .pipe(gulp.dest('client/assets/styles/css'))
      .pipe(livereload());
  });

  var coreFiles = [
    'client/views',
    'client/views/**/*.html',
    'client/views/**/*.js',
    '!client/views/**/*.scss',
    '!client/views/**/*.spec.js',
    '!client/views/**/*.e2e.js',
    'client/app/directives',
    'client/app/directives/**/*.html',
    'client/app/directives/**/*.js',
    '!client/app/directives/**/*.spec.js',
    'client/app/services',
    'client/app/services/**/*.js',
    '!client/app/services/**/*.spec.js',
    'client/app/animations',
    'client/app/animations/*.js',
    'client/app/filters',
    'client/app/filters/**/*.js',
    '!client/app/filters/**/*.spec.js'
  ];

  var lastInjection = Date.now();

  watch(coreFiles, { events: ['add', 'unlink'] }, function () {
    if (Date.now() - lastInjection < 100) { return; }
    lastInjection = Date.now();
    gulp.src('client/index.html')
      .pipe(inject(gulp.src(toInject), { relative: true }))
      .pipe(gulp.dest('client'));
  });

  watch(coreFiles, livereload.changed);
  watch(['client/index.html', 'client/app.js'], livereload.changed);

};
