'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;


var CollectionSchema = new Schema({

  // Reference to the account for this collection
  account: { type: ObjectId, ref: 'Account', required: true },

  title: { type: String },

  description: { type: String },

  headerImage: { type: String },

  headerPattern: { type: String },

  // References to the datasets in this collection
  datasets :[{ type: ObjectId, ref: 'Dataset' }],

  createdAt : { type: Date, default: Date.now() },
  updatedAt : { type: Date}

});


// When saving a new collection, add the reference to the appropriate Account
CollectionSchema.post('save', function (collection) {

  var Account = mongoose.model('Account');

  Account.findOne({_id: collection.account}, function(err,account){
    if (account._id){
      account.collections.push(collection._id);
      account.save();
    }
  });
});


module.exports = mongoose.model('Collection', CollectionSchema);
