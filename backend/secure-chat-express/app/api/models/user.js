"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    searchable = require('mongoose-searchable');

// Schema for a user.
var userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    profilePhotoURL: {
        type: String,
        required: true
    },
    facebook: {
        id: String
    },
    publicKey: {
        keys: {
            pgp: {type: String},
            readable: {type: String}
        }
    },
    friends: [String],
    pendingFriends: [String]
});

// make all string fields searchable.
userSchema.plugin(searchable, {
  language: 'english',
  fields: ['email', 'name']
});

// create a model based on the schema provided.
mongoose.model('User', userSchema);
