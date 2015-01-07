'use strict';

// Use local.env.js for environment variables that grunt will set when the server starts locally.
// Use for your api keys, secrets, etc. This file should not be tracked by git.
//
// You will need to set these on the server you deploy to.

module.exports = {

  PORT                  : '8000',
  DOMAIN                : 'http://localhost',

  DATABASE_URL          : 'postgres://Arn@localhost:5432/columby_dev',

  MANDRILL_API          : '2kmdQagqpDwbeWjxi-_xHw',
  JWT_SECRET            : '12345',

  AWS_ACCESS_KEY_ID     : 'AKIAJWYLKRD6OW32TJXA',
  AWS_SECRET_ACCESS_KEY : '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',
  S3_BUCKET_NAME        : 'columby-dev',
  AWS_S3_ENDPOINT       : 's3.amazonaws.com/columby-dev',

  EMBEDLY_KEY           : '844b2c4d25334b4db2c327f10c70cb54',
  // Control debug level for modules using visionmedia/debug
  DEBUG                 : ''
};
