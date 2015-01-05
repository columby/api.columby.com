'use strict';

/***
 *
 * -----------------
 * | ACCOUNT MODEL |
 * -----------------
 *
 * A publication account can publish datasets on Columby. An account always has an owner.
 * Publication accounts can have multiple users with a certain role (admin, publisher, viewer).
 *
 *
 * A user can create extra publication accounts.
 * These extra accounts can have multiple users attached with different roles.
 *
 * Account:
 *  - name: Selected by user
 *  - slug: Created automatically based on name
 *  - plan: Account subscription
 *  - description: Created by user
 *  - owner: Main user
 *  - users: Other users
 *  - avatar:
 *  - datasets: A list of datasets published by this account
 *  - keys:
 *  - collections: A list of collections published by this account.
 *  -
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



/**
 *
 * Module dependencies.
 *
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  User = mongoose.model('User')
;


/**
 *
 * Slugify a string.
 *
 */
function slugify(text) {

  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
                                // Limit characters
}


/**
 *
 * Publication account Schema.
 *
 */
var AccountSchema = new Schema({

  // Account settings
  name        : { type: String, unique: true },
  slug        : { type: String, unique: true },
  plan        : { type: String, default: 'free' },
  description : { type: String, required: false },

  owner       : {type: Schema.ObjectId, ref: 'User' },
  primary     : { type: Boolean },
  users : [{
    userId : { type: Schema.ObjectId, ref: 'User' },
    role   : { type: String }   // owner, admin, publisher, author, viewer
  }],

  avatar      : {
    url         : {
      type: String,
      required: false,
      default: 'assets/images/avatar.png'}
  },

  datasets    : [{ type: Schema.ObjectId, ref: 'Dataset' }],

  apikeys     : [ ],

  collections : [{ type: Schema.ObjectId, ref: 'Collection' }],

  createdAt   : { type:Date },
  updatedAt   : { type: Date },

  drupal_uuid : { type:String }

});


/**
 *
 * Pre-save hook
 *
 * When saving the new account, create a slug based on the username.
 * Create a new api-key for a new publication account.
 *
 */
AccountSchema.pre('save', function(next) {
  if (this.isNew){
    this.set('slug', slugify(this.slug));
    this.apikeys.push(String(mongoose.Types.ObjectId()));
  }
  next();
});


/**
 *
 * Post-save hook
 *
 * Add the new publication account to the user who created it
 * When primary: add 'owner' role, otherwise 'admin' role
 *
 */
AccountSchema.post('save', function(account) {
  // update search

  // find the user this account belongs to
  User.findOne({_id: account.owner}, function(err,user) {
    if (err) { console.log(err); }
    if (user){
      // check if it is a primary account or not.
      if (account.primary === true){
        user.primaryAccount = account._id;
      } else {
        // Check if account id is new for the user
        if (user.accounts.indexOf(account._id) === -1) {
          // Add it to the list of users
          user.accounts.push({userId: account._id, role: 'owner'});
          user.save();
        }
      }
    }
  });
});


module.exports = mongoose.model('Account', AccountSchema);
