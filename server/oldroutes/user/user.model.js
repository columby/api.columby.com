/***
 *
 * --------------
 * | USER MODEL |
 * --------------
 *
 * A User can login into the website. Each user has a free primary publication account.
 * The primary publication account is created automatically upon registration.
 *
 * A user can create extra publication accounts.
 * These extra accounts can have multiple users attached with different roles.
 *
 * User:
 *  - email
 *  - primary account reference
 *  - other account references
 *
 * onCreate
 *   - Create a new primary account
 *   - Save the primary account _id into the user model
 *
 * onUpdate
 *   -
 *
 * onDelete
 *   - Delete primary account
 *
 */

'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/* --- VALIDATIONS ------------------------------------------------------------- */
var validateUniqueEmail = function(value, callback) {
  var User = mongoose.model('User');
  User.find({
    $and: [{
      email: value
    }, {
      _id: {
        $ne: this._id
      }
    }]
  }, function(err, user) {
    callback(err || user.length === 0);
  });
};


/* --- SCHEMA DEFINITION ------------------------------------------------------------- */
var UserSchema = new Schema({
  email: {
    type    : String,
    required: true,
    unique  : true,
    match   : [/.+\@.+\..+/, 'Please enter a valid email'],
    validate: [validateUniqueEmail, 'E-mail address is already in-use']
  },

  verified      : { type: Boolean, default: false },
  primaryAccount: { type: Schema.ObjectId, ref: 'Account' },
  accounts      : [{ type: Schema.ObjectId, ref: 'Account' }],

  createdAt : { type: Date, default: new Date() },

  // migration from beta.columby.com
  drupal_uid  : { type: String },
  drupal_uuid : { type: String },
  drupal_name : { type: String }

});

module.exports = mongoose.model('User', UserSchema);
