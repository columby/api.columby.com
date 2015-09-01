// All configuration with environment variables. Loaded by forever script or with foreman with local development.

var path = require('path');

try {
  var env = require('./env.js');
  console.log(env);
} catch(err){
  console.log('No local env.js');
}

module.exports = {

  root          : path.normalize(__dirname + '/../..'),

  environment   : process.env.NODE_ENV              || env.NODE_ENV                || 'development',
  port          : process.env.NODE_API_PORT         || env.NODE_API_PORT           || 8000,
  db : {
    cms: {
      uri       : process.env.DATABASE_CMS_URL      || env.DATABASE_CMS_URL        || '',
      dialect   : process.env.DATABASE_CMS_DIALECT  || env.DATABASE_CMS_DIALECT    || 'postgres'
    },
    postgis: {
      uri       : process.env.DATABASE_POSTGIS_URL  || env.DATABASE_POSTGIS_URL    || '',
    }
  },

  jwt: {
    secret      : process.env.JWT_SECRET            || env.JWT_SECRET              || '',
  },

  oauth: {
    googleSecret: process.env.GOOGLE_SECRET         || env.GOOGLE_SECRET           || '',
  },

  mandrill : {
    key         : process.env.MANDRILL_API_KEY      || env.MANDRILL_API_KEY        || '',
  },

  aws: {
    key         : process.env.AWS_ACCESS_KEY_ID     || env.AWS_ACCESS_KEY_ID       || '',
    secret      : process.env.AWS_SECRET_ACCESS_KEY || env.AWS_SECRET_ACCESS_KEY   || '',
    bucket      : process.env.S3_BUCKET_NAME        || env.AWS_S3_BUCKET_NAME      || '',
    endpoint    : process.env.AWS_S3_ENDPOINT       || env.AWS_S3_ENDPOINT         || '',
  },

  embedly: {
    key         : process.env.EMBEDLY_KEY           || env.EMBEDLY_KEY             || '',
  },

  scribeUser    : process.env.SCRIBE_USER           || env.SCRIBE_USER             || 'test:test'
};
