'use strict';

// Development specific configuration
// ==================================
module.exports = {

  port: process.env.PORT,

  db:{
    uri: process.env.DATABASE_URL,
    postgis: process.env.DATABASE_POSTGIS_URL
  },

  jwt: {
    secret: process.env.JWT_SECRET
  },

  mandrill : {
    key: process.env.MANDRILL_API_KEY
  },

  // Amazon AWS S3 File Storage
  aws: {
    publicKey : process.env.AWS_ACCESS_KEY_ID,
    secretKey : process.env.AWS_SECRET_ACCESS_KEY,
    bucket    : process.env.S3_BUCKET_NAME,
    endpoint  : process.env.AWS_S3_ENDPOINT
  },

  embedly: {
    key : process.env.EMBEDLY_KEY
  }

};
