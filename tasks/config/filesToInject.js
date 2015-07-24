/**
 * Files injected into index.html by gulp-inject
 * used by tasks inject & watch
 */

module.exports = [
  'client/app/app.js',
  'client/app/animations/*.js',
  'client/app/controllers/**/*.js', '!client/app/controllers/**/*.spec.js',
  'client/app/directives/**/*.js', '!client/app/directives/**/*.spec.js',
  'client/app/filters/**/*.js', '!client/app/filters/**/*.spec.js',
  'client/app/routes/**/*.js', '!client/app/routes/**/*.spec.js',
  'client/app/services/**/*.js', '!client/app/services/**/*.spec.js',
  'client/views/**/*.js', '!client/views/**/*.spec.js', '!client/views/**/*.e2e.js'
];
